import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy .env.local.example to .env.local and fill in the values.'
  )
}

// supabase-js v2 uses navigator.locks (Web Locks API) by default to serialise
// auth state access. In single-tab SPA usage we hit a known issue where the
// lock is acquired but never released after a session refresh / HMR cycle,
// causing every subsequent query (including from('table')) to hang forever.
// We replace it with a no-op runner: just execute the work directly. This is
// safe for single-tab usage; multi-tab session sync still works via
// localStorage events emitted by supabase-js itself.
const noLock = async (_name, _acquireTimeout, fn) => fn()

export const supabase = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    lock: noLock,
  },
})
