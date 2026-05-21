// Tests for src/lib/courses.js — covers the pure helper computeCoursePercent
// plus the 5-minute TTL cache around fetchLearnedVocabWords/Count.
import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mutable mock state: each test configures the data and inspects call counts.
let progressData = []
let lessonsData = []
let progressCalls = 0
let lessonsCalls = 0

vi.mock('../supabase', () => ({
  supabase: {
    from: (table) => {
      if (table === 'user_course_progress') {
        progressCalls += 1
        return {
          select: () => ({
            eq: () => ({
              data: progressData,
              error: null,
              order: () => ({ data: progressData, error: null }),
            }),
          }),
        }
      }
      if (table === 'lessons') {
        lessonsCalls += 1
        return {
          select: () => ({
            in: () => ({ data: lessonsData, error: null }),
            eq: () => ({ order: () => ({ data: [], error: null }) }),
          }),
        }
      }
      return {
        select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }),
      }
    },
  },
}))

import {
  computeCoursePercent,
  fetchLearnedVocabWords,
  fetchLearnedVocabCount,
  invalidateLearnedVocabCache,
} from '../courses'

describe('computeCoursePercent', () => {
  it('returns 0 when there are no lessons', () => {
    expect(computeCoursePercent(0, { completed_lesson_ids: [] })).toBe(0)
    expect(computeCoursePercent([], { completed_lesson_ids: [1, 2] })).toBe(0)
    expect(computeCoursePercent(undefined, { completed_lesson_ids: [1] })).toBe(0)
  })

  it('accepts both numeric counts and arrays of lessons', () => {
    expect(computeCoursePercent(4, { completed_lesson_ids: [1, 2] })).toBe(50)
    expect(computeCoursePercent([{}, {}, {}, {}], { completed_lesson_ids: [1, 2] })).toBe(50)
  })

  it('rounds to nearest integer', () => {
    expect(computeCoursePercent(3, { completed_lesson_ids: [1] })).toBe(33)
    expect(computeCoursePercent(3, { completed_lesson_ids: [1, 2] })).toBe(67)
  })

  it('clamps the result into [0, 100]', () => {
    // More completions than lessons should never exceed 100.
    expect(computeCoursePercent(2, { completed_lesson_ids: [1, 2, 3, 4, 5] })).toBe(100)
  })

  it('handles missing progress row', () => {
    expect(computeCoursePercent(5, undefined)).toBe(0)
    expect(computeCoursePercent(5, null)).toBe(0)
    expect(computeCoursePercent(5, {})).toBe(0)
  })
})

describe('learned vocab cache (TTL + invalidation)', () => {
  beforeEach(() => {
    progressData = [{ completed_lesson_ids: [1, 2, 3] }]
    lessonsData = [
      { highlight_words: ['Hello', 'World'] },
      { highlight_words: ['mine', 'craft'] },
    ]
    progressCalls = 0
    lessonsCalls = 0
    invalidateLearnedVocabCache('user-A')
    invalidateLearnedVocabCache('user-B')
  })

  it('first read hits the network; subsequent reads come from the cache', async () => {
    const set1 = await fetchLearnedVocabWords('user-A')
    expect(set1.size).toBe(4)
    expect(set1.has('hello')).toBe(true)
    expect(progressCalls).toBe(1)
    expect(lessonsCalls).toBe(1)

    // Both Words and Count should reuse the cached Set
    const set2 = await fetchLearnedVocabWords('user-A')
    const count = await fetchLearnedVocabCount('user-A')
    expect(set2).toBe(set1) // exact same Set reference
    expect(count).toBe(4)
    expect(progressCalls).toBe(1)
    expect(lessonsCalls).toBe(1)
  })

  it('invalidate forces a refetch on the next read', async () => {
    await fetchLearnedVocabWords('user-A')
    expect(progressCalls).toBe(1)

    invalidateLearnedVocabCache('user-A')
    await fetchLearnedVocabWords('user-A')
    expect(progressCalls).toBe(2)
    expect(lessonsCalls).toBe(2)
  })

  it('caches per-user without cross-talk', async () => {
    await fetchLearnedVocabWords('user-A')
    expect(progressCalls).toBe(1)

    // user-B is a fresh key so it must hit the network on its own.
    await fetchLearnedVocabWords('user-B')
    expect(progressCalls).toBe(2)

    // Re-reading user-A is still served from cache.
    await fetchLearnedVocabWords('user-A')
    await fetchLearnedVocabCount('user-A')
    expect(progressCalls).toBe(2)
  })

  it('short-circuits when userId is empty (no network call)', async () => {
    const s = await fetchLearnedVocabWords('')
    expect(s.size).toBe(0)
    const c = await fetchLearnedVocabCount(null)
    expect(c).toBe(0)
    expect(progressCalls).toBe(0)
    expect(lessonsCalls).toBe(0)
  })

  it('caches the empty-result branch (no progress rows)', async () => {
    progressData = []
    await fetchLearnedVocabWords('user-A')
    expect(progressCalls).toBe(1)
    // No lessons query is needed when there is nothing to look up.
    expect(lessonsCalls).toBe(0)

    // Subsequent reads stay cached even though the result is empty.
    const again = await fetchLearnedVocabWords('user-A')
    expect(again.size).toBe(0)
    expect(progressCalls).toBe(1)
  })
})
