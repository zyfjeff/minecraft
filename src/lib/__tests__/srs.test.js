import { describe, it, expect, beforeEach, vi } from 'vitest'
import { computeNextState, recordReview, loadSrsState, listDueWords, countDueWords, clearSrsState } from '../srs.js'

// Provide a minimal localStorage shim for Node-side tests. Vitest defaults to
// jsdom for src/, but we keep this guard so the file works in either env.
function ensureLocalStorage() {
  if (typeof globalThis.localStorage !== 'undefined') return
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  }
}

describe('srs.computeNextState', () => {
  it('first good review schedules ~1 day later', () => {
    const next = computeNextState(undefined, 'good')
    expect(next.repetitions).toBe(1)
    expect(next.intervalDays).toBe(1)
    expect(next.dueAt).toBeGreaterThan(Date.now() + 86399000)
  })

  it('again resets repetitions and pushes due ~10 minutes out', () => {
    const seed = computeNextState(undefined, 'good')
    const after = computeNextState(seed, 'again')
    expect(after.repetitions).toBe(0)
    expect(after.intervalDays).toBe(0)
    // Due within the next 11 minutes.
    expect(after.dueAt - Date.now()).toBeLessThan(11 * 60 * 1000)
    // Ease decreases but stays >= 1.3.
    expect(after.ease).toBeLessThan(seed.ease)
    expect(after.ease).toBeGreaterThanOrEqual(1.3)
  })

  it('easy increases ease and stretches interval beyond good', () => {
    const seed = computeNextState(undefined, 'good') // 1d
    const easy = computeNextState(seed, 'easy')
    expect(easy.ease).toBeGreaterThan(seed.ease)
    expect(easy.intervalDays).toBeGreaterThan(seed.intervalDays)
  })
})

describe('srs.recordReview + listDueWords', () => {
  beforeEach(() => {
    ensureLocalStorage()
    clearSrsState('user-1')
  })

  it('persists state to localStorage and lists due words', () => {
    const learned = new Set(['apple', 'banana'])
    const due = listDueWords('user-1', learned)
    // Both new words start due (dueAt === now).
    expect(due.length).toBe(2)
    const state = loadSrsState('user-1')
    expect(Object.keys(state).sort()).toEqual(['apple', 'banana'])
  })

  it('after good rating the word leaves the due queue', () => {
    const learned = new Set(['apple'])
    listDueWords('user-1', learned) // seed
    recordReview('user-1', 'apple', 'good')
    const stillDue = listDueWords('user-1', learned)
    expect(stillDue.length).toBe(0)
    expect(countDueWords('user-1', learned)).toBe(0)
  })

  it('countDueWords matches listDueWords length', () => {
    const learned = new Set(['a', 'b', 'c'])
    listDueWords('user-1', learned)
    expect(countDueWords('user-1', learned)).toBe(3)
    recordReview('user-1', 'a', 'good')
    expect(countDueWords('user-1', learned)).toBe(2)
  })
})
