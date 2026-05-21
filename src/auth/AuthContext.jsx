import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { listTodayCompletions, insertCompletion } from '../lib/quests'
import { listThisWeekCompletedDates, computeWeekDots } from '../lib/streak'
import { listAllQuests } from '../lib/quests-list'
import { listAchievements, listUserUnlocks, evaluateAndUnlock } from '../lib/achievements'
import {
  listCourses,
  listVocab,
  buildVocabMap,
  listUserCourseProgress,
  buildProgressMap,
  markLessonComplete as dbMarkLessonComplete,
  recordQuestionAnswer as dbRecordQuestionAnswer,
} from '../lib/courses'
import { getCachedJson, setCachedJson, CACHE_KEYS } from '../lib/offlineCache'

const AuthContext = createContext(null)

function mapProfile(row) {
  if (!row) return null
  const xp = row.xp ?? 0
  const xpToNext = row.xp_to_next || 100
  return {
    id: row.id,
    displayName: row.display_name,
    level: row.level ?? 1,
    xp,
    xpToNext,
    xpPercent: Math.max(0, Math.min(100, Math.round((xp / xpToNext) * 100))),
    streak: row.streak ?? 0,
  }
}

async function fetchOrCreateProfile(authUser) {
  // Try to read first
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle()

  if (error) throw error
  if (data) return data

  // Insert default profile (RLS requires auth.uid() = id, which holds because user is signed in)
  const fallbackName =
    authUser.user_metadata?.display_name ||
    (authUser.email ? authUser.email.split('@')[0] : 'Adventurer')

  const { data: inserted, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: authUser.id,
      display_name: fallbackName,
    })
    .select('*')
    .single()

  if (insertError) {
    // Could happen if trigger raced ahead; fall back to a re-read
    const { data: reread } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()
    if (reread) return reread
    throw insertError
  }
  return inserted
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  // Today's completed quests for the current user. Used by Home to gray out
  // already-claimed quest cards and to compute pendingCount.
  const [todayCompletions, setTodayCompletions] = useState([])
  // Distinct completion dates within the current ISO week (Mon..Sun, UTC).
  // Used by Home's 7-dot streak grid.
  const [weekDots, setWeekDots] = useState([false, false, false, false, false, false, false])
  // Catalog of all quests (rendered as cards on Home). Public read data, so
  // we can fetch this even before profile is hydrated, but for simplicity we
  // only refresh on auth bootstrap / sign-in.
  const [quests, setQuests] = useState([])
  // Achievements catalog (public) + this user's unlocks. Both are needed by
  // Home's "Recent Achievements" preview to render unlocked vs locked state.
  const [achievements, setAchievements] = useState([])
  const [userUnlocks, setUserUnlocks] = useState([])
  // Loaded flags distinguish "haven't fetched yet" from "fetched but empty",
  // so Home can show skeletons during bootstrap without flickering an empty
  // state. They are flipped to true in finally{} of each refresh fn (success
  // OR failure) so a hard error never traps the UI in the skeleton.
  const [questsLoaded, setQuestsLoaded] = useState(false)
  const [achievementsLoaded, setAchievementsLoaded] = useState(false)
  // Courses module — catalog (public), per-user progress, vocab dictionary.
  // userCourseProgress is a map (courseId -> progressRow) for O(1) lookup
  // by CourseList; vocabMap is a map (lowercase word -> vocabRow) for the
  // VocabPopover used by VideoLesson and ReadingPractice.
  const [courses, setCourses] = useState([])
  const [coursesLoaded, setCoursesLoaded] = useState(false)
  const [userCourseProgress, setUserCourseProgress] = useState({})
  const [progressLoaded, setProgressLoaded] = useState(false)
  const [vocabMap, setVocabMap] = useState({})
  const [vocabLoaded, setVocabLoaded] = useState(false)
  // Surfaces the first bootstrap-time data error to the UI as a toast.
  // Home consumes via useEffect + clearBootstrapError. Profile / completions /
  // streak failures share this single channel intentionally — users only need
  // one "something went wrong" message, the console has the details.
  const [bootstrapError, setBootstrapError] = useState(null)
  const profileLoadedFor = useRef(null)
  // Admin status mirrors `public.is_admin()` from the DB. Fetched once per
  // sign-in so the UI can hide /admin links from non-admins; the actual
  // security boundary lives in RLS, this is purely UX.
  const [isAdmin, setIsAdmin] = useState(false)
  const [isAdminLoaded, setIsAdminLoaded] = useState(false)
  // In-flight refresh dedup. Concurrent calls share the same promise so
  // bootstrap + onAuthStateChange don't double-fetch the catalog.
  const inflight = useRef({})
  // Tracks whether the bootstrap effect has finished its initial run, so we
  // can skip the redundant INITIAL_SESSION event that supabase-js emits
  // immediately after subscribing to onAuthStateChange.
  const bootstrapDone = useRef(false)

  // Wraps an async loader so concurrent invocations share one in-flight
  // promise (keyed by `key`). Prevents duplicate network requests when both
  // bootstrap and onAuthStateChange race to refresh the same catalog.
  const dedup = useCallback((key, fn) => {
    if (inflight.current[key]) return inflight.current[key]
    const p = Promise.resolve()
      .then(fn)
      .finally(() => { delete inflight.current[key] })
    inflight.current[key] = p
    return p
  }, [])

  const refreshIsAdmin = useCallback(async (uid) => {
    const userId = uid || session?.user?.id
    if (!userId) {
      setIsAdmin(false)
      setIsAdminLoaded(true)
      return
    }
    return dedup(`isAdmin:${userId}`, async () => {
      try {
        const { data, error } = await supabase.rpc('is_admin')
        if (error) throw error
        setIsAdmin(!!data)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[auth] is_admin RPC failed', err)
        setIsAdmin(false)
      } finally {
        setIsAdminLoaded(true)
      }
    })
  }, [session, dedup])

  const refreshTodayCompletions = useCallback(async (uid) => {
    const userId = uid || session?.user?.id
    if (!userId) {
      setTodayCompletions([])
      return
    }
    return dedup(`todayCompletions:${userId}`, async () => {
      try {
        const rows = await listTodayCompletions(userId)
        setTodayCompletions(rows)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[auth] failed to load today completions', err)
        setTodayCompletions([])
      }
    })
  }, [session, dedup])

  const refreshWeekDots = useCallback(async (uid) => {
    const userId = uid || session?.user?.id
    if (!userId) {
      setWeekDots([false, false, false, false, false, false, false])
      return
    }
    return dedup(`weekDots:${userId}`, async () => {
      try {
        const dates = await listThisWeekCompletedDates(userId)
        setWeekDots(computeWeekDots(dates))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[auth] failed to load week dots', err)
        setWeekDots([false, false, false, false, false, false, false])
      }
    })
  }, [session, dedup])

  const refreshQuests = useCallback(async () => {
    return dedup('quests', async () => {
      try {
        const rows = await listAllQuests()
        setQuests(rows)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[auth] failed to load quests catalog', err)
        setQuests([])
        setBootstrapError('Failed to load quests \u2014 please refresh')
      } finally {
        setQuestsLoaded(true)
      }
    })
  }, [dedup])

  const refreshCourses = useCallback(async () => {
    return dedup('courses', async () => {
      // Stale-while-revalidate: paint cached catalog immediately, then go to
      // the network. If the network call fails we keep whatever was already
      // shown so the app stays usable offline.
      let hadCache = false
      try {
        const cached = await getCachedJson(CACHE_KEYS.courses)
        if (cached?.data && Array.isArray(cached.data)) {
          setCourses(cached.data)
          setCoursesLoaded(true)
          hadCache = true
        }
      } catch (_) { /* cache read is best-effort */ }
  
      try {
        const rows = await listCourses()
        setCourses(rows)
        // Persist asynchronously so we never block the UI on the write.
        setCachedJson(CACHE_KEYS.courses, rows).catch(() => {})
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[auth] failed to load courses catalog', err)
        if (!hadCache) {
          setCourses([])
          setBootstrapError('Failed to load courses — please refresh')
        }
      } finally {
        setCoursesLoaded(true)
      }
    })
  }, [dedup])
  
  const refreshVocab = useCallback(async () => {
    return dedup('vocab', async () => {
      let hadCache = false
      try {
        const cached = await getCachedJson(CACHE_KEYS.vocab)
        if (cached?.data && Array.isArray(cached.data)) {
          setVocabMap(buildVocabMap(cached.data))
          setVocabLoaded(true)
          hadCache = true
        }
      } catch (_) { /* best-effort */ }
  
      try {
        const rows = await listVocab()
        setVocabMap(buildVocabMap(rows))
        setCachedJson(CACHE_KEYS.vocab, rows).catch(() => {})
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[auth] failed to load vocab', err)
        if (!hadCache) setVocabMap({})
        // Vocab popover failure is recoverable (taps will just no-op), so we
        // intentionally do NOT raise bootstrapError for it.
      } finally {
        setVocabLoaded(true)
      }
    })
  }, [dedup])

  const refreshUserCourseProgress = useCallback(async (uid) => {
    const userId = uid || session?.user?.id
    if (!userId) {
      setUserCourseProgress({})
      setProgressLoaded(true)
      return
    }
    return dedup(`userCourseProgress:${userId}`, async () => {
      try {
        const rows = await listUserCourseProgress(userId)
        setUserCourseProgress(buildProgressMap(rows))
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[auth] failed to load user course progress', err)
        setUserCourseProgress({})
      } finally {
        setProgressLoaded(true)
      }
    })
  }, [session, dedup])

  const refreshAchievements = useCallback(async (uid) => {
    const userId = uid || session?.user?.id
    return dedup(`achievements:${userId || 'guest'}`, async () => {
      try {
        const catalog = await listAchievements()
        setAchievements(catalog)
        if (!userId) {
          setUserUnlocks([])
          return
        }
        // Always evaluate on bootstrap/refresh: this is idempotent (only inserts
        // newly satisfied rows, 23505 is swallowed) and ensures users who met
        // the criteria *before* the evaluate-on-claim hook existed still see
        // their badges on first load.
        const unlocks = await evaluateAndUnlock(userId)
        setUserUnlocks(unlocks)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[auth] failed to load achievements', err)
        setAchievements([])
        setUserUnlocks([])
        setBootstrapError('Failed to load achievements \u2014 please refresh')
      } finally {
        setAchievementsLoaded(true)
      }
    })
  }, [session, dedup])

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null)
      profileLoadedFor.current = null
      setProfileLoading(false)
      return
    }
    // Avoid reloading on every token refresh for the same user
    if (profileLoadedFor.current === authUser.id) return
    setProfileLoading(true)
    try {
      // 5s timeout: never let a hanging Supabase query (RLS/network) freeze the UI.
      const row = await Promise.race([
        fetchOrCreateProfile(authUser),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('profile fetch timeout')), 5000)
        ),
      ])
      setProfile(mapProfile(row))
      profileLoadedFor.current = authUser.id
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[auth] failed to load profile', err)
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Safety net: never let the UI stay stuck on "Loading..." forever
    // (e.g. wrong Supabase URL / network blocked / getSession or profile
    // query hangs). Reset BOTH loading flags so RequireAuth can proceed.
    const failSafe = setTimeout(() => {
      if (mounted) {
        setLoading(false)
        setProfileLoading(false)
      }
    }, 6000)

    ;(async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!mounted) return
        if (error) throw error
        setSession(data.session ?? null)
        const authUser = data.session?.user

        // Always load public catalogs (courses + vocab) regardless of auth state.
        // These are read-only data needed by guest users to browse courses.
        await Promise.allSettled([
          refreshCourses(),
          refreshVocab(),
        ])

        if (authUser?.email_confirmed_at) {
          try {
            await loadProfile(authUser)
            await Promise.allSettled([
              refreshTodayCompletions(authUser.id),
              refreshWeekDots(authUser.id),
              refreshQuests(),
              refreshAchievements(authUser.id),
              refreshUserCourseProgress(authUser.id),
              refreshIsAdmin(authUser.id),
            ])
          } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[auth] initial loadProfile failed', err)
          }
        } else {
          setIsAdminLoaded(true)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[auth] getSession failed', err)
      } finally {
        if (mounted) {
          setLoading(false)
          bootstrapDone.current = true
        }
      }
    })()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (!mounted) return
      // supabase-js fires INITIAL_SESSION right after subscribe(); the
      // bootstrap IIFE above already handled this, so skip to avoid a
      // second wave of refresh requests.
      if (event === 'INITIAL_SESSION' && bootstrapDone.current) {
        setSession(nextSession ?? null)
        return
      }
      // TOKEN_REFRESHED is purely a JWT rotation; user identity is unchanged
      // so no catalog reloads are needed.
      if (event === 'TOKEN_REFRESHED') {
        setSession(nextSession ?? null)
        return
      }
      setSession(nextSession ?? null)
      const authUser = nextSession?.user
      if (authUser?.email_confirmed_at) {
        try {
          // Profile must load first (other refreshes may read level/streak from it).
          await loadProfile(authUser)
          // Remaining refreshes are independent — run them in parallel so one
          // failure doesn't block the rest.
          const results = await Promise.allSettled([
            refreshTodayCompletions(authUser.id),
            refreshWeekDots(authUser.id),
            refreshQuests(),
            refreshAchievements(authUser.id),
            refreshCourses(),
            refreshVocab(),
            refreshUserCourseProgress(authUser.id),
            refreshIsAdmin(authUser.id),
          ])
          // Log any individual failures (non-fatal).
          results.forEach((r, i) => {
            if (r.status === 'rejected') {
              // eslint-disable-next-line no-console
              console.warn('[auth] parallel refresh #' + i + ' failed', r.reason)
            }
          })
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[auth] loadProfile failed on auth change', err)
        }
      } else {
        setProfile(null)
        profileLoadedFor.current = null
        setTodayCompletions([])
        setWeekDots([false, false, false, false, false, false, false])
        setQuests([])
        setAchievements([])
        setUserUnlocks([])
        setQuestsLoaded(false)
        setAchievementsLoaded(false)
        // Keep courses + vocab loaded for guest browsing
        setUserCourseProgress({})
        setProgressLoaded(false)
        setBootstrapError(null)
        setIsAdmin(false)
        setIsAdminLoaded(true)
      }
      // Any auth event implies the initial bootstrap is over.
      if (mounted) setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(failSafe)
      sub?.subscription?.unsubscribe?.()
    }
  }, [loadProfile])

  const signUp = useCallback(async ({ email, password, displayName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || (email ? email.split('@')[0] : '') },
        emailRedirectTo: `${window.location.origin}/`,
      },
    })
    if (error) throw error
    return data
  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }, [])

  const signOut = useCallback(async () => {
    // 1. Clear React state synchronously so RequireAuth redirects to /login.
    profileLoadedFor.current = null
    setProfile(null)
    setSession(null)
    setProfileLoading(false)
    setTodayCompletions([])
    setWeekDots([false, false, false, false, false, false, false])
    setQuests([])
    setAchievements([])
    setUserUnlocks([])
    setQuestsLoaded(false)
    setAchievementsLoaded(false)
    setCourses([])
    setCoursesLoaded(false)
    setUserCourseProgress({})
    setProgressLoaded(false)
    setVocabMap({})
    setVocabLoaded(false)
    setBootstrapError(null)
    setIsAdmin(false)
    setIsAdminLoaded(false)

    // 2. Manually wipe persisted tokens from localStorage. This is the
    //    critical step that supabase-js v2's signOut does NOT guarantee:
    //    its signOut still issues POST /auth/v1/logout (regardless of scope),
    //    and on network failure it short-circuits BEFORE clearing storage,
    //    leaving the next page load to silently restore the old session.
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        Object.keys(window.localStorage)
          .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
          .forEach((k) => window.localStorage.removeItem(k))
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[auth] failed to clear localStorage tokens', err)
    }

    // 3. Fire-and-forget the supabase-js signOut (with a 3s timeout) so it
    //    can broadcast SIGNED_OUT to other tabs and reset its in-memory state,
    //    without ever blocking the UI on a hanging network request.
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('signOut timeout')), 3000)
    )
    Promise.race([supabase.auth.signOut({ scope: 'local' }), timeout]).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[auth] background signOut failed (local state already cleared)', err)
    })
  }, [])

  const refreshProfile = useCallback(async () => {
    const authUser = session?.user
    if (!authUser) return
    profileLoadedFor.current = null
    await loadProfile(authUser)
  }, [session, loadProfile])

  // Legacy: kept for backward compatibility. Direct XP grants are no longer
  // used by the UI — use claimQuest({id, xp_reward, ...}) instead, which
  // enforces "each quest is claimable at most once per UTC day" via the
  // quest_completions composite primary key.
  const addXp = useCallback(async (delta) => {
    const authUser = session?.user
    if (!authUser || !profile || !delta) return
    let newXp = profile.xp + delta
    let newLevel = profile.level
    let newXpToNext = profile.xpToNext
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext
      newLevel += 1
      newXpToNext = newXpToNext + 50
    }
    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXp, level: newLevel, xp_to_next: newXpToNext })
      .eq('id', authUser.id)
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[auth] failed to add xp', error)
      return
    }
    await refreshProfile()
  }, [session, profile, refreshProfile])

  // Anti-cheat aware quest claim. Returns one of:
  //   { ok:true,  alreadyClaimed:false, xpAwarded:N }  -> first claim today, profile XP refreshed
  //   { ok:true,  alreadyClaimed:true,  xpAwarded:0 }  -> already claimed today (no-op)
  //   { ok:false, error }                              -> failure (network/RLS/etc)
  const claimQuest = useCallback(async (quest) => {
    const authUser = session?.user
    if (!authUser || !profile || !quest?.id) {
      return { ok: false, error: new Error('claimQuest: missing user/profile/quest') }
    }
    try {
      const { alreadyClaimed, xpAwarded } = await insertCompletion(authUser.id, quest)
      if (alreadyClaimed) {
        return { ok: true, alreadyClaimed: true, xpAwarded: 0 }
      }
      // Optimistically update local completions so UI grays the card immediately.
      setTodayCompletions((prev) => [
        ...prev,
        { quest_id: quest.id, xp_awarded: xpAwarded, completed_on: new Date().toISOString().slice(0, 10) },
      ])
      // Optimistically light up today's dot in the weekly streak grid.
      setWeekDots((prev) => {
        const today = new Date()
        const dow = today.getUTCDay() // 0=Sun..6=Sat
        const idx = (dow + 6) % 7 // Mon=0..Sun=6
        if (prev[idx]) return prev
        const next = [...prev]
        next[idx] = true
        return next
      })
      // Recompute level/xp from server-side authoritative profile values.
      let newXp = profile.xp + xpAwarded
      let newLevel = profile.level
      let newXpToNext = profile.xpToNext
      while (newXp >= newXpToNext) {
        newXp -= newXpToNext
        newLevel += 1
        newXpToNext = newXpToNext + 50
      }
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ xp: newXp, level: newLevel, xp_to_next: newXpToNext })
        .eq('id', authUser.id)
      if (updErr) throw updErr
      // Bump daily streak via the bump_streak RPC. The RPC is idempotent —
      // multiple claims on the same day will keep streak unchanged. Failure
      // here is non-fatal (we still credited the XP) so we just warn.
      try {
        const { error: streakErr } = await supabase.rpc('bump_streak')
        if (streakErr) {
          // eslint-disable-next-line no-console
          console.warn('[auth] bump_streak failed', streakErr)
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[auth] bump_streak threw', err)
      }
      await refreshProfile()
      // Re-evaluate achievements against the freshly bumped profile/streak/
      // questCount. evaluateAndUnlock is idempotent and only inserts newly
      // satisfied rows, so re-running it on every claim is safe.
      try {
        const fresh = await evaluateAndUnlock(authUser.id)
        setUserUnlocks(fresh)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[auth] evaluateAndUnlock failed', err)
      }
      return { ok: true, alreadyClaimed: false, xpAwarded }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[auth] claimQuest failed', err)
      return { ok: false, error: err }
    }
  }, [session, profile, refreshProfile])

  // Award XP and bump profile.level when a course mutation grants xp. Mirrors
  // the level-up math used by addXp / claimQuest. Returns the xp delta that
  // was actually applied (0 if profile is missing).
  const grantCourseXp = useCallback(async (delta) => {
    const authUser = session?.user
    if (!authUser || !profile || !delta) return 0
    let newXp = profile.xp + delta
    let newLevel = profile.level
    let newXpToNext = profile.xpToNext
    while (newXp >= newXpToNext) {
      newXp -= newXpToNext
      newLevel += 1
      newXpToNext = newXpToNext + 50
    }
    const { error } = await supabase
      .from('profiles')
      .update({ xp: newXp, level: newLevel, xp_to_next: newXpToNext })
      .eq('id', authUser.id)
    if (error) {
      // eslint-disable-next-line no-console
      console.error('[auth] grantCourseXp update failed', error)
      return 0
    }
    await refreshProfile()
    return delta
  }, [session, profile, refreshProfile])

  // Mark a lesson as complete for the current user. Idempotent: a second call
  // with the same lessonId is a no-op (alreadyCompleted=true, xpAwarded=0).
  const markLessonComplete = useCallback(async (courseId, lesson) => {
    const authUser = session?.user
    if (!authUser || !courseId || !lesson?.id) {
      return { ok: false, error: new Error('markLessonComplete: missing args') }
    }
    try {
      const xpReward = Number(lesson.xp_reward) || 0
      const result = await dbMarkLessonComplete(authUser.id, courseId, lesson.id, xpReward)
      // Optimistically update the in-memory map so CourseList progress bars
      // and the lesson "✓ Completed" badge react immediately.
      setUserCourseProgress((prev) => ({
        ...prev,
        [courseId]: result.row,
      }))
      if (!result.alreadyCompleted && result.xpAwarded > 0) {
        await grantCourseXp(result.xpAwarded)
        // Re-evaluate achievements (XP / questCount thresholds may have just flipped).
        try {
          const fresh = await evaluateAndUnlock(authUser.id)
          setUserUnlocks(fresh)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('[auth] evaluateAndUnlock after lesson complete failed', err)
        }
      }
      return {
        ok: true,
        alreadyCompleted: result.alreadyCompleted,
        xpAwarded: result.alreadyCompleted ? 0 : result.xpAwarded,
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[auth] markLessonComplete failed', err)
      return { ok: false, error: err }
    }
  }, [session, grantCourseXp])

  // Submit an answer to a quiz question. XP is granted only on first-time
  // correct answers; wrong answers are intentionally NOT recorded so the user
  // can retry without permanently losing the XP.
  const submitAnswer = useCallback(async (courseId, question, isCorrect) => {
    const authUser = session?.user
    if (!authUser || !courseId || !question?.id) {
      return { ok: false, error: new Error('submitAnswer: missing args') }
    }
    if (!isCorrect) {
      // Don't write anything for wrong answers — let the user retry.
      return { ok: true, alreadyAnswered: false, xpAwarded: 0, isCorrect: false }
    }
    try {
      const xpReward = Number(question.xp_reward) || 0
      const result = await dbRecordQuestionAnswer(authUser.id, courseId, question.id, xpReward)
      setUserCourseProgress((prev) => ({
        ...prev,
        [courseId]: result.row,
      }))
      if (!result.alreadyAnswered && result.xpAwarded > 0) {
        await grantCourseXp(result.xpAwarded)
      }
      return {
        ok: true,
        alreadyAnswered: result.alreadyAnswered,
        xpAwarded: result.alreadyAnswered ? 0 : result.xpAwarded,
        isCorrect: true,
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[auth] submitAnswer failed', err)
      return { ok: false, error: err }
    }
  }, [session, grantCourseXp])

  const clearBootstrapError = useCallback(() => setBootstrapError(null), [])

  // Update display name in both profiles table and local state.
  const updateDisplayName = useCallback(async (newName) => {
    const authUser = session?.user
    if (!authUser || !newName?.trim()) {
      throw new Error('updateDisplayName: missing user or name')
    }
    const trimmed = newName.trim()
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', authUser.id)
    if (error) throw error
    // Refresh to sync latest profile state
    await refreshProfile()
  }, [session, refreshProfile])

  const value = useMemo(
    () => ({
      session,
      authUser: session?.user ?? null,
      profile,
      loading,
      profileLoading,
      todayCompletions,
      weekDots,
      quests,
      achievements,
      userUnlocks,
      questsLoaded,
      achievementsLoaded,
      courses,
      coursesLoaded,
      userCourseProgress,
      progressLoaded,
      vocabMap,
      vocabLoaded,
      isAdmin,
      isAdminLoaded,
      bootstrapError,
      clearBootstrapError,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      refreshTodayCompletions,
      refreshWeekDots,
      refreshQuests,
      refreshAchievements,
      refreshCourses,
      refreshVocab,
      refreshUserCourseProgress,
      refreshIsAdmin,
      addXp,
      claimQuest,
      markLessonComplete,
      submitAnswer,
      updateDisplayName,
    }),
    [session, profile, loading, profileLoading, todayCompletions, weekDots, quests, achievements, userUnlocks, questsLoaded, achievementsLoaded, courses, coursesLoaded, userCourseProgress, progressLoaded, vocabMap, vocabLoaded, isAdmin, isAdminLoaded, bootstrapError, clearBootstrapError, signUp, signIn, signOut, refreshProfile, refreshTodayCompletions, refreshWeekDots, refreshQuests, refreshAchievements, refreshCourses, refreshVocab, refreshUserCourseProgress, refreshIsAdmin, addXp, claimQuest, markLessonComplete, submitAnswer, updateDisplayName]
  )

  return <AuthContext.Provider value={value} data-qoder-id="qel-authcontext-provider-dedf7bff" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-authcontext-provider-dedf7bff&quot;,&quot;filePath&quot;:&quot;react-vite/src/auth/AuthContext.jsx&quot;,&quot;componentName&quot;:&quot;AuthProvider&quot;,&quot;elementRole&quot;:&quot;authcontext-provider&quot;,&quot;loc&quot;:{&quot;line&quot;:162,&quot;column&quot;:10}}">{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
