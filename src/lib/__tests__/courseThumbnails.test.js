// Tests for src/lib/courseThumbnails.js — ensure each vocabulary course
// resolves to a distinct, dedicated `v_*` icon (no longer collides with
// reading icons), and explicit `thumbnail_key` short-circuits the inference.
import { describe, expect, it } from 'vitest'
import {
  inferReadingThumbnail,
  inferVocabThumbnail,
  resolveThumbnailKey,
} from '../courseThumbnails'

describe('inferVocabThumbnail — every vocab course gets a distinct v_* icon', () => {
  const cases = [
    ['vocab-hostile-mobs',        'v_hostile'],
    ['vocab-friendly-animals',    'v_animal'],
    ['vocab-tools-weapons',       'v_tools'],
    ['vocab-precious-resources',  'v_resources'],
    ['vocab-food-cooking',        'v_food'],
    ['vocab-nature-landscape',    'v_nature'],
    ['vocab-nether-end',          'v_dimension'],
    ['vocab-crafting-machines',   'v_crafting'],
    ['vocab-action-verbs',        'v_action'],
    ['vocab-describing-words',    'v_adjective'],
    // Bundle-imported courses whose ids would otherwise collide on shared keywords:
    ['vocab-adventure-survival',  'v_adventure'],
    ['vocab-building-crafting',   'v_building'],
    ['vocab-nature-world',        'v_world'],
  ]

  for (const [id, expectedKey] of cases) {
    it(`${id} → ${expectedKey}`, () => {
      expect(inferVocabThumbnail(id)).toBe(expectedKey)
    })
  }

  it('falls back to v_adjective for unknown vocab ids', () => {
    expect(inferVocabThumbnail('vocab-totally-new-topic')).toBe('v_adjective')
  })

  it('all 13 mappings are unique (no duplicates across vocab courses)', () => {
    const keys = cases.map(([, k]) => k)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('vocab keys never overlap with reading keys', () => {
    const vocabKeys = new Set(cases.map(([, k]) => k))
    const readingSamples = [
      'minecraft-2-exploring-a-cave', 'minecraft-cherry-grove',
      'minecraft-7-diamonds', 'minecraft-fishing',
    ]
    for (const id of readingSamples) {
      expect(vocabKeys.has(inferReadingThumbnail(id))).toBe(false)
    }
  })

  it('id-precise overrides beat keyword rules for ambiguous ids', () => {
    // Without overrides, vocab-adventure-survival would collapse to v_action and
    // vocab-building-crafting would collapse to v_crafting. Verify they are now distinct.
    expect(inferVocabThumbnail('vocab-adventure-survival')).not.toBe(inferVocabThumbnail('vocab-action-verbs'))
    expect(inferVocabThumbnail('vocab-building-crafting')).not.toBe(inferVocabThumbnail('vocab-crafting-machines'))
    expect(inferVocabThumbnail('vocab-nature-world')).not.toBe(inferVocabThumbnail('vocab-nature-landscape'))
  })
})

describe('resolveThumbnailKey', () => {
  it('honours an explicit thumbnail_key when valid (non-default)', () => {
    expect(resolveThumbnailKey({ kind: 'vocabulary', id: 'mob-encyclopedia', thumbnail_key: 'mob' })).toBe('mob')
  })

  it('treats default "blocks" as unset for reading/vocabulary and falls back to inference', () => {
    // 这是之前的真正 bug：16_seed 没设 thumbnail_key → DB default 为 'blocks'
    // → 旧逻辑短路返回 'blocks'，10 门 vocab 课图标全部一样。
    expect(resolveThumbnailKey({ kind: 'vocabulary', id: 'vocab-food-cooking', thumbnail_key: 'blocks' })).toBe('v_food')
    expect(resolveThumbnailKey({ kind: 'vocabulary', id: 'vocab-hostile-mobs', thumbnail_key: 'blocks' })).toBe('v_hostile')
    expect(resolveThumbnailKey({ kind: 'reading', id: 'minecraft-7-diamonds', thumbnail_key: 'blocks' })).toBe('r_diamond')
  })

  it('falls through to inference when explicit key is unknown', () => {
    expect(resolveThumbnailKey({ kind: 'vocabulary', id: 'vocab-food-cooking', thumbnail_key: 'not-a-key' })).toBe('v_food')
  })

  it('uses reading inference for reading courses', () => {
    expect(resolveThumbnailKey({ kind: 'reading', id: 'minecraft-7-diamonds' })).toBe('r_diamond')
  })

  it('keeps explicit "blocks" for non-themed kinds (e.g. listening)', () => {
    expect(resolveThumbnailKey({ kind: 'listening', id: 'foo', thumbnail_key: 'blocks' })).toBe('blocks')
  })

  it('returns blocks for unknown course shapes', () => {
    expect(resolveThumbnailKey(null)).toBe('blocks')
    expect(resolveThumbnailKey({ kind: 'listening', id: 'foo' })).toBe('blocks')
  })
})
