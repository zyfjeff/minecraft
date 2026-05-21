// Pure-function tests for src/lib/streak.js. The async helpers that hit
// Supabase are not covered here — only `getWeekStartUtc` and `computeWeekDots`.
import { describe, expect, it, vi } from 'vitest'

// streak.js imports the supabase client at module load time. Stub it so the
// real client is never instantiated during unit tests (no env vars required,
// no browser-only globals touched).
vi.mock('../supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ eq: () => ({ gte: async () => ({ data: [], error: null }) }) }),
    }),
  },
}))

import { getWeekStartUtc, computeWeekDots } from '../streak'

function utcDateStr(d) {
  return d.toISOString().slice(0, 10)
}

describe('getWeekStartUtc', () => {
  it('returns Monday for any weekday in the same ISO week', () => {
    // 2024-03-13 is a Wednesday; ISO week start is 2024-03-11 (Monday).
    const wed = new Date('2024-03-13T15:30:00Z')
    expect(utcDateStr(getWeekStartUtc(wed))).toBe('2024-03-11')
  })

  it('treats Sunday as the LAST day of the previous Monday-anchored week', () => {
    // 2024-03-17 Sunday — its Monday is 2024-03-11.
    const sun = new Date('2024-03-17T23:59:59Z')
    expect(utcDateStr(getWeekStartUtc(sun))).toBe('2024-03-11')
  })

  it('returns Monday itself when input is already Monday', () => {
    const mon = new Date('2024-03-11T00:00:00Z')
    expect(utcDateStr(getWeekStartUtc(mon))).toBe('2024-03-11')
  })

  it('rolls back across month boundaries', () => {
    // 2024-03-03 Sunday — its Monday is 2024-02-26.
    const sun = new Date('2024-03-03T08:00:00Z')
    expect(utcDateStr(getWeekStartUtc(sun))).toBe('2024-02-26')
  })

  it('rolls back across year boundaries', () => {
    // 2024-01-01 Monday — already Monday.
    expect(utcDateStr(getWeekStartUtc(new Date('2024-01-01T00:00:00Z')))).toBe('2024-01-01')
    // 2023-12-31 Sunday — its Monday is 2023-12-25.
    expect(utcDateStr(getWeekStartUtc(new Date('2023-12-31T12:00:00Z')))).toBe('2023-12-25')
  })

  it('zeros out the time-of-day component', () => {
    const d = getWeekStartUtc(new Date('2024-03-13T15:30:45.123Z'))
    expect(d.getUTCHours()).toBe(0)
    expect(d.getUTCMinutes()).toBe(0)
    expect(d.getUTCSeconds()).toBe(0)
    expect(d.getUTCMilliseconds()).toBe(0)
  })
})

describe('computeWeekDots', () => {
  it('returns 7 false for empty input', () => {
    expect(computeWeekDots([])).toEqual([false, false, false, false, false, false, false])
    expect(computeWeekDots(null)).toHaveLength(7)
  })

  it('flips a single weekday into the matching dot', () => {
    // Compute week start NOW so the test stays deterministic regardless of run date.
    const start = getWeekStartUtc()
    const wed = new Date(start)
    wed.setUTCDate(start.getUTCDate() + 2) // Wednesday
    const dots = computeWeekDots([utcDateStr(wed)])
    expect(dots).toEqual([false, false, true, false, false, false, false])
  })

  it('handles all seven weekdays', () => {
    const start = getWeekStartUtc()
    const all = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setUTCDate(start.getUTCDate() + i)
      return utcDateStr(d)
    })
    expect(computeWeekDots(all)).toEqual([true, true, true, true, true, true, true])
  })

  it('ignores dates outside the current week', () => {
    const start = getWeekStartUtc()
    const lastWeek = new Date(start)
    lastWeek.setUTCDate(start.getUTCDate() - 3)
    expect(computeWeekDots([utcDateStr(lastWeek)])).toEqual(
      [false, false, false, false, false, false, false],
    )
  })

  it('deduplicates repeated dates implicitly via Set semantics', () => {
    const start = getWeekStartUtc()
    const monStr = utcDateStr(start)
    expect(computeWeekDots([monStr, monStr, monStr])[0]).toBe(true)
  })
})
