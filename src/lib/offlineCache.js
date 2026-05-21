// =============================================================================
// offlineCache.js — Tiny key/value cache backed by IndexedDB (with a localStorage
// fallback for very old browsers / SSR).
//
// Purpose: lets AuthContext stale-while-revalidate the read-only catalog data
// (courses, vocab) so the app boots instantly on a flaky network and stays
// usable when the user goes offline mid-session. We deliberately avoid pulling
// in `idb-keyval` to keep the bundle a single tiny module.
//
// Schema:
//   db:  craftwords-cache
//   ver: 1
//   obj: kv          (key: string, value: { data, savedAt })
//
// API:
//   getCachedJson(key)             -> Promise<{ data, savedAt } | null>
//   setCachedJson(key, data)       -> Promise<void>
//   clearCachedJson(key)           -> Promise<void>
//
// All errors are swallowed and logged so a broken IDB never breaks app boot.
// =============================================================================

const DB_NAME = 'craftwords-cache'
const STORE = 'kv'
const VERSION = 1

function hasIndexedDB() {
  return typeof indexedDB !== 'undefined' && indexedDB
}

let dbPromise = null
function openDb() {
  if (!hasIndexedDB()) return Promise.resolve(null)
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    let req
    try {
      req = indexedDB.open(DB_NAME, VERSION)
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[offlineCache] indexedDB.open threw', e)
      resolve(null)
      return
    }
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      // eslint-disable-next-line no-console
      console.warn('[offlineCache] failed to open IndexedDB', req.error)
      resolve(null)
    }
  })
  return dbPromise
}

function lsKey(key) {
  return `craftwords-cache:${key}`
}

export async function getCachedJson(key) {
  const db = await openDb()
  if (!db) {
    // localStorage fallback.
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(lsKey(key)) : null
      return raw ? JSON.parse(raw) : null
    } catch (_) {
      return null
    }
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const store = tx.objectStore(STORE)
      const req = store.get(key)
      req.onsuccess = () => resolve(req.result || null)
      req.onerror = () => resolve(null)
    } catch (_) {
      resolve(null)
    }
  })
}

export async function setCachedJson(key, data) {
  const payload = { data, savedAt: Date.now() }
  const db = await openDb()
  if (!db) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(lsKey(key), JSON.stringify(payload))
      }
    } catch (_) { /* quota / private mode — ignore */ }
    return
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(payload, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch (_) {
      resolve()
    }
  })
}

export async function clearCachedJson(key) {
  const db = await openDb()
  if (!db) {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(lsKey(key))
    } catch (_) { /* ignore */ }
    return
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch (_) { resolve() }
  })
}

// Stable cache keys used by AuthContext / loaders. Centralised so callers can't
// drift apart and accidentally read someone else's payload.
export const CACHE_KEYS = {
  courses: 'catalog:courses:v1',
  vocab: 'catalog:vocab:v1',
}
