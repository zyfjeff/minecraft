// =============================================================================
// VocabQuiz — Practice phase with 3 rotating quiz types.
//
// Types:
//   en2zh    — show English word, pick Chinese definition (4-choice MCQ)
//   zh2en    — show Chinese definition, pick English word (4-choice MCQ)
//   spelling — show Chinese definition + first-letter hint, type the word
//
// Props:
//   words           object[]  — vocab entries in this deck
//   learningWords   Set       — word IDs marked "still learning" (appear first)
//   hearts          number    — remaining hearts
//   onCorrect       (word)=>void
//   onWrong         (word)=>void
//   onComplete      (results)=>void — called when all words tested
// =============================================================================
import { useState, useMemo, useCallback, useEffect, useRef } from 'react'

// Shuffle helper (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pick N random distractors from pool, excluding the correct answer
function pickDistractors(pool, correctId, count = 3) {
  const candidates = pool.filter(w => w.id !== correctId)
  const shuffled = shuffle(candidates)
  return shuffled.slice(0, count)
}

const QUIZ_TYPES = ['en2zh', 'zh2en', 'spelling']

export default function VocabQuiz({ words, learningWords, hearts, onCorrect, onWrong, onComplete }) {
  // Build quiz queue: learning words first, then mastered, each with a quiz type
  const quizQueue = useMemo(() => {
    if (!words || words.length === 0) return []
    const learning = words.filter(w => learningWords?.has(w.id))
    const mastered = words.filter(w => !learningWords?.has(w.id))
    const ordered = [...shuffle(learning), ...shuffle(mastered)]
    return ordered.map((w, i) => ({
      word: w,
      qtype: QUIZ_TYPES[i % QUIZ_TYPES.length],
    }))
  }, [words, learningWords])

  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [spellingInput, setSpellingInput] = useState('')
  const [showResult, setShowResult] = useState(false) // 'correct' | 'wrong' | false
  const [results, setResults] = useState({ en2zh: { total: 0, correct: 0 }, zh2en: { total: 0, correct: 0 }, spelling: { total: 0, correct: 0 } })
  const [wrongWords, setWrongWords] = useState(new Set())
  const inputRef = useRef(null)

  const current = quizQueue[currentIdx]
  const isLast = currentIdx >= quizQueue.length - 1

  // Generate MCQ options for current question
  const options = useMemo(() => {
    if (!current) return []
    const { word: correctWord, qtype } = current
    const distractors = pickDistractors(words, correctWord.id, 3)

    if (qtype === 'en2zh') {
      const opts = [
        { id: correctWord.id, label: correctWord.definition_zh, correct: true },
        ...distractors.map(d => ({ id: d.id, label: d.definition_zh, correct: false })),
      ]
      return shuffle(opts)
    }
    if (qtype === 'zh2en') {
      const opts = [
        { id: correctWord.id, label: correctWord.word, correct: true },
        ...distractors.map(d => ({ id: d.id, label: d.word, correct: false })),
      ]
      return shuffle(opts)
    }
    return []
  }, [current, words])

  // Focus spelling input
  useEffect(() => {
    if (current?.qtype === 'spelling' && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentIdx, current?.qtype])

  const handleSelect = useCallback((opt) => {
    if (showResult) return
    setSelected(opt.id)
    const isCorrect = opt.correct
    setShowResult(isCorrect ? 'correct' : 'wrong')
    const qtype = current.qtype
    setResults(prev => ({
      ...prev,
      [qtype]: {
        total: prev[qtype].total + 1,
        correct: prev[qtype].correct + (isCorrect ? 1 : 0),
      },
    }))
    if (isCorrect) {
      onCorrect?.(current.word)
    } else {
      onWrong?.(current.word)
      setWrongWords(prev => new Set([...prev, current.word.id]))
    }
  }, [showResult, current, onCorrect, onWrong])

  const handleSpellingSubmit = useCallback(() => {
    if (showResult) return
    const answer = spellingInput.trim().toLowerCase()
    const correct = current.word.word.toLowerCase()
    const isCorrect = answer === correct
    setShowResult(isCorrect ? 'correct' : 'wrong')
    setResults(prev => ({
      ...prev,
      spelling: {
        total: prev.spelling.total + 1,
        correct: prev.spelling.correct + (isCorrect ? 1 : 0),
      },
    }))
    if (isCorrect) {
      onCorrect?.(current.word)
    } else {
      onWrong?.(current.word)
      setWrongWords(prev => new Set([...prev, current.word.id]))
    }
  }, [showResult, spellingInput, current, onCorrect, onWrong])

  const handleNext = useCallback(() => {
    // End quiz early if hearts depleted or last question
    if (isLast || hearts <= 0) {
      onComplete?.({ results, wrongWords: [...wrongWords] })
      return
    }
    setCurrentIdx(i => i + 1)
    setSelected(null)
    setSpellingInput('')
    setShowResult(false)
  }, [isLast, hearts, onComplete, results, wrongWords])

  if (!current) return null

  const { word: cw, qtype } = current

  return (
    <div style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
      {/* Progress */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
        marginBottom: 'var(--space-lg)', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-muted)' }}>
          Question {currentIdx + 1} / {quizQueue.length}
        </span>
        <div style={{
          flex: 1, maxWidth: 160, height: 4, borderRadius: 2,
          background: 'rgba(0,0,0,0.06)',
        }}>
          <div style={{
            height: '100%', borderRadius: 2,
            width: `${Math.round(((currentIdx + 1) / quizQueue.length) * 100)}%`,
            background: 'var(--color-grass)',
            transition: 'width 300ms ease',
          }} />
        </div>
      </div>

      {/* Quiz type label */}
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 'var(--space-sm)', textAlign: 'center',
      }}>
        {qtype === 'en2zh' ? 'What does this word mean?' :
         qtype === 'zh2en' ? 'Which word matches this definition?' :
         'Spell the word'}
      </div>

      {/* Prompt */}
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xl)',
        textAlign: 'center',
        marginBottom: 'var(--space-lg)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '2px solid var(--tile-yellow)',
      }}>
        {qtype === 'en2zh' ? (
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 800,
            color: 'var(--color-title)', margin: 0,
          }}>
            {cw.word}
          </h2>
        ) : qtype === 'zh2en' ? (
          <div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--color-title)' }}>
              {cw.definition_zh}
            </p>
            {cw.pos ? (
              <span style={{
                display: 'inline-block', marginTop: 'var(--space-sm)',
                fontSize: 11, fontWeight: 700, color: 'var(--color-muted)',
                background: 'var(--color-surface-soft)', padding: '2px 8px',
                borderRadius: 'var(--radius-pill)',
              }}>
                {cw.pos}
              </span>
            ) : null}
          </div>
        ) : (
          <div>
            <p style={{ margin: '0 0 var(--space-sm)', fontSize: 18, fontWeight: 700, color: 'var(--color-title)' }}>
              {cw.definition_zh}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--color-muted)' }}>
              Starts with: <strong style={{ color: 'var(--color-grass-active)', fontSize: 18 }}>
                {cw.word.charAt(0).toUpperCase()}
              </strong>
              {'_ '.repeat(Math.min(cw.word.length - 1, 12))}
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                ({cw.word.length} letters)
              </span>
            </p>
          </div>
        )}
      </div>

      {/* MCQ Options */}
      {(qtype === 'en2zh' || qtype === 'zh2en') ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {options.map((opt, i) => {
            let bg = 'var(--color-surface)'
            let border = '2px solid rgba(0,0,0,0.08)'
            let color = 'var(--color-title)'
            if (showResult && opt.id === selected) {
              if (opt.correct) {
                bg = 'rgba(76,175,80,0.1)'
                border = '2px solid var(--color-grass)'
                color = 'var(--color-grass-active)'
              } else {
                bg = 'rgba(193,60,60,0.1)'
                border = '2px solid var(--color-danger, #c13c3c)'
                color = 'var(--color-danger, #c13c3c)'
              }
            } else if (showResult && opt.correct) {
              bg = 'rgba(76,175,80,0.06)'
              border = '2px solid var(--color-grass)'
            }
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt)}
                disabled={!!showResult}
                style={{
                  padding: '14px var(--space-lg)',
                  borderRadius: 'var(--radius-md)',
                  background: bg,
                  border,
                  color,
                  fontWeight: 600,
                  fontSize: 14,
                  textAlign: 'left',
                  cursor: showResult ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: showResult && opt.id !== selected && !opt.correct ? 0.5 : 1,
                }}
              >
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.05)', marginRight: 'var(--space-sm)',
                  fontSize: 12, fontWeight: 700, color: 'var(--color-muted)',
                }}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt.label}
              </button>
            )
          })}
        </div>
      ) : null}

      {/* Spelling Input */}
      {qtype === 'spelling' ? (
        <div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input
              ref={inputRef}
              type="text"
              value={spellingInput}
              onChange={(e) => setSpellingInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && spellingInput.trim()) handleSpellingSubmit()
              }}
              disabled={!!showResult}
              placeholder="Type the word..."
              style={{
                flex: 1, padding: '12px var(--space-md)',
                borderRadius: 'var(--radius-md)',
                border: showResult
                  ? showResult === 'correct'
                    ? '2px solid var(--color-grass)'
                    : '2px solid var(--color-danger, #c13c3c)'
                  : '2px solid rgba(0,0,0,0.12)',
                fontSize: 16, fontWeight: 600,
                fontFamily: 'var(--font-display)',
                color: 'var(--color-title)',
                background: showResult
                  ? showResult === 'correct'
                    ? 'rgba(76,175,80,0.06)'
                    : 'rgba(193,60,60,0.06)'
                  : 'var(--color-surface)',
                outline: 'none',
              }}
            />
            {!showResult ? (
              <button
                onClick={handleSpellingSubmit}
                disabled={!spellingInput.trim()}
                style={{
                  padding: '12px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: spellingInput.trim() ? 'var(--color-grass)' : 'rgba(0,0,0,0.08)',
                  color: spellingInput.trim() ? '#fff' : 'var(--color-muted)',
                  fontWeight: 700, fontSize: 14,
                  cursor: spellingInput.trim() ? 'pointer' : 'default',
                }}
              >
                Check
              </button>
            ) : null}
          </div>
          {showResult === 'wrong' ? (
            <p style={{
              margin: 'var(--space-sm) 0 0', fontSize: 13,
              color: 'var(--color-danger, #c13c3c)', fontWeight: 600,
            }}>
              Correct answer: <strong style={{ color: 'var(--color-title)' }}>{cw.word}</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Feedback + Next */}
      {showResult ? (
        <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
          <div style={{
            fontSize: 14, fontWeight: 700, marginBottom: 'var(--space-md)',
            color: showResult === 'correct' ? 'var(--color-grass-active)' : 'var(--color-danger, #c13c3c)',
          }}>
            {showResult === 'correct' ? 'Correct!' : 'Not quite...'}
          </div>
          <button
            onClick={handleNext}
            style={{
              padding: '12px 40px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--color-grass)',
              color: '#fff',
              fontWeight: 700, fontSize: 15,
              cursor: 'pointer',
            }}
          >
            {isLast ? 'See Report' : 'Next'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
