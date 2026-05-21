import { describe, it, expect } from 'vitest'
import { scoreRecognition } from '../speech.js'

describe('speech.scoreRecognition', () => {
  it('returns A for an exact match', () => {
    const r = scoreRecognition('hello world', 'Hello world')
    expect(r.grade).toBe('A')
    expect(r.score).toBeGreaterThan(0.95)
    expect(r.words.every((w) => w.hit)).toBe(true)
  })

  it('returns D when nothing matches', () => {
    const r = scoreRecognition('exploration cave', 'banana muffin')
    expect(r.grade).toBe('D')
    expect(r.words.every((w) => !w.hit)).toBe(true)
  })

  it('partial match yields B or C with mixed word hits', () => {
    const r = scoreRecognition('I love minecraft very much', 'I love minecraft')
    expect(['B', 'C']).toContain(r.grade)
    const hits = r.words.filter((w) => w.hit).map((w) => w.expected)
    expect(hits).toEqual(expect.arrayContaining(['i', 'love', 'minecraft']))
  })

  it('single-word prompt is scored exact', () => {
    const ok = scoreRecognition('apple', 'apple')
    expect(ok.grade).toBe('A')
    const bad = scoreRecognition('apple', 'orange')
    expect(bad.grade).toBe('D')
  })

  it('handles punctuation and casing', () => {
    const r = scoreRecognition("Let's go!", 'lets go')
    // tokenizer drops non-alpha so "let's" becomes "let s" — order partial credit.
    expect(r.score).toBeGreaterThan(0)
  })

  it('empty expected returns D safely', () => {
    const r = scoreRecognition('', 'anything')
    expect(r.grade).toBe('D')
    expect(r.score).toBe(0)
  })
})
