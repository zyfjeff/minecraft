import { describe, it, expect } from 'vitest'
import { buildStatsCsv } from '../exportStats.js'

describe('exportStats.buildStatsCsv', () => {
  const fixture = {
    displayName: 'Robot',
    level: 1,
    xp: 120,
    xpToNext: 200,
    streak: 3,
    activeDays: 4,
    todayXp: 25,
    questCount: 7,
    learnedVocab: 42,
    achievementsUnlocked: 3,
    achievementsTotal: 12,
    courseProgressList: [
      { id: 'a', title: 'Course A', kind: 'listening', difficulty: 2, lessons_count: 5, percent: 100 },
      { id: 'b', title: 'Course "B"', kind: 'reading', difficulty: 1, lessons_count: 3, percent: 50 },
      { id: 'c', title: 'Course\nC', kind: 'vocabulary', difficulty: 3, lessons_count: 1, percent: 0 },
    ],
  }

  it('emits a header row + summary block + course block', () => {
    const csv = buildStatsCsv(fixture)
    expect(csv.startsWith('CraftWords Learning Stats Export')).toBe(true)
    expect(csv).toContain('# Summary')
    expect(csv).toContain('Display name,Robot')
    expect(csv).toContain('Total XP,120')
    expect(csv).toContain('# Course Progress')
  })

  it('quotes values that contain commas, quotes, or newlines', () => {
    const csv = buildStatsCsv(fixture)
    // Course B has an embedded double-quote — must be escaped to "" inside quotes.
    expect(csv).toContain('"Course ""B"""')
    // Course C has a newline — must be wrapped in quotes.
    expect(csv).toMatch(/"Course\nC"/)
  })

  it('marks course status correctly', () => {
    const csv = buildStatsCsv(fixture)
    expect(csv).toContain('100%,Completed')
    expect(csv).toContain('50%,In progress')
    expect(csv).toContain('0%,Not started')
  })
})
