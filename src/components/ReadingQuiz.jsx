// =============================================================================
// ReadingQuiz — Multi-type quiz renderer for segmented reading lessons.
//
// Props:
//   segment       The lesson_segment object (qtype, quiz_payload, blank_word, distractors, sentence_en)
//   onAnswer      (isCorrect: boolean) => void
//   disabled      boolean — true after user has answered
// =============================================================================
import { useState, useMemo } from 'react'

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const cardStyle = {
  background: 'var(--color-surface)',
  borderRadius: 'var(--radius-xl)',
  padding: 'var(--space-lg)',
  marginTop: 'var(--space-md)',
}

const promptStyle = {
  fontSize: 14, fontWeight: 700, color: 'var(--color-title)',
  marginBottom: 'var(--space-md)',
}

function OptionButton({ label, selected, correct, wrong, disabled, onClick, index }) {
  const borderColor = correct
    ? 'var(--color-success)'
    : wrong
      ? 'var(--color-danger)'
      : selected
        ? 'var(--color-grass)'
        : 'var(--color-disabled)'
  const bg = correct
    ? 'rgba(111,186,44,0.08)'
    : wrong
      ? 'rgba(224,90,90,0.08)'
      : selected
        ? 'var(--color-grass-wash, rgba(111,186,44,0.06))'
        : 'white'
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 14px', borderRadius: 'var(--radius-md)',
        border: `2px solid ${borderColor}`,
        background: bg,
        textAlign: 'left', cursor: disabled ? 'default' : 'pointer',
        fontSize: 13, fontWeight: 500, color: 'var(--color-body)',
        fontFamily: 'var(--font-body)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
        width: '100%',
      }}
    >
      <span style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? 'var(--color-grass)' : 'var(--color-disabled)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700,
      }}>
        {String.fromCharCode(65 + index)}
      </span>
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// VocabClozeQuiz — Fill in the blank word in the sentence
// ---------------------------------------------------------------------------
function VocabClozeQuiz({ segment, onAnswer, disabled }) {
  const [picked, setPicked] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const correctWord = segment.blank_word || ''
  const options = useMemo(() => {
    // quiz_payload.options if available, else build from distractors + blank_word
    if (segment.quiz_payload?.options) return segment.quiz_payload.options
    const distractors = Array.isArray(segment.distractors) ? segment.distractors : []
    const all = [correctWord, ...distractors].filter(Boolean)
    // Shuffle
    return all.sort(() => Math.random() - 0.5)
  }, [segment, correctWord])

  const correctIndex = segment.quiz_payload?.correct ?? options.indexOf(correctWord)

  // Build sentence with blank
  const template = segment.quiz_payload?.sentence_template ||
    (segment.sentence_en || '').replace(
      new RegExp(`\\b${correctWord}\\b`, 'i'),
      '______'
    )

  function handlePick(idx) {
    if (submitted || disabled) return
    setPicked(idx)
  }

  function handleSubmit() {
    if (picked === null || submitted) return
    setSubmitted(true)
    const isCorrect = picked === correctIndex
    onAnswer(isCorrect)
  }

  return (
    <div style={cardStyle}>
      <p style={promptStyle}>Fill in the blank:</p>
      <p style={{ fontSize: 14, color: 'var(--color-body)', lineHeight: 1.7, marginBottom: 'var(--space-md)' }}>
        {template}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {options.map((opt, i) => (
          <OptionButton
            key={i}
            index={i}
            label={opt}
            selected={picked === i}
            correct={submitted && i === correctIndex}
            wrong={submitted && picked === i && i !== correctIndex}
            disabled={submitted || disabled}
            onClick={() => handlePick(i)}
          />
        ))}
      </div>
      {!submitted && !disabled && (
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={picked === null}
          style={{ width: '100%', marginTop: 'var(--space-md)' }}
        >
          Check
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ComprehensionQuiz — Standard MCQ
// ---------------------------------------------------------------------------
function ComprehensionQuiz({ segment, onAnswer, disabled }) {
  const [picked, setPicked] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const payload = segment.quiz_payload || {}
  const prompt = payload.prompt || 'What does this paragraph tell us?'
  const options = Array.isArray(payload.options) ? payload.options : []
  const correctIndex = typeof payload.correct === 'number' ? payload.correct : 0

  function handlePick(idx) {
    if (submitted || disabled) return
    setPicked(idx)
  }

  function handleSubmit() {
    if (picked === null || submitted) return
    setSubmitted(true)
    onAnswer(picked === correctIndex)
  }

  return (
    <div style={cardStyle}>
      <p style={promptStyle}>{prompt}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {options.map((opt, i) => (
          <OptionButton
            key={i}
            index={i}
            label={opt}
            selected={picked === i}
            correct={submitted && i === correctIndex}
            wrong={submitted && picked === i && i !== correctIndex}
            disabled={submitted || disabled}
            onClick={() => handlePick(i)}
          />
        ))}
      </div>
      {!submitted && !disabled && (
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={picked === null}
          style={{ width: '100%', marginTop: 'var(--space-md)' }}
        >
          Check
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TrueFalseQuiz — True/False statement about the paragraph
// ---------------------------------------------------------------------------
function TrueFalseQuiz({ segment, onAnswer, disabled }) {
  const [picked, setPicked] = useState(null) // true | false | null
  const [submitted, setSubmitted] = useState(false)

  const payload = segment.quiz_payload || {}
  const statement = payload.statement || ''
  const correctAnswer = payload.correct === true || payload.correct === 'true'

  function handlePick(val) {
    if (submitted || disabled) return
    setPicked(val)
  }

  function handleSubmit() {
    if (picked === null || submitted) return
    setSubmitted(true)
    onAnswer(picked === correctAnswer)
  }

  const btnBase = {
    flex: 1, padding: '14px 12px', borderRadius: 'var(--radius-md)',
    fontSize: 14, fontWeight: 700, cursor: submitted || disabled ? 'default' : 'pointer',
    fontFamily: 'var(--font-display)',
    border: '2px solid',
    transition: 'all 150ms ease',
  }

  function tfStyle(val) {
    const isSelected = picked === val
    const isCorrect = submitted && val === correctAnswer
    const isWrong = submitted && isSelected && val !== correctAnswer
    return {
      ...btnBase,
      borderColor: isCorrect ? 'var(--color-success)' : isWrong ? 'var(--color-danger)' : isSelected ? 'var(--color-grass)' : 'var(--color-disabled)',
      background: isCorrect ? 'rgba(111,186,44,0.1)' : isWrong ? 'rgba(224,90,90,0.1)' : isSelected ? 'rgba(111,186,44,0.05)' : 'white',
      color: isCorrect ? 'var(--color-success)' : isWrong ? 'var(--color-danger)' : isSelected ? 'var(--color-grass)' : 'var(--color-body)',
    }
  }

  return (
    <div style={cardStyle}>
      <p style={promptStyle}>True or False?</p>
      <p style={{ fontSize: 14, color: 'var(--color-body)', lineHeight: 1.6, marginBottom: 'var(--space-lg)', fontStyle: 'italic' }}>
        "{statement}"
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        <button style={tfStyle(true)} onClick={() => handlePick(true)} disabled={submitted || disabled}>
          TRUE
        </button>
        <button style={tfStyle(false)} onClick={() => handlePick(false)} disabled={submitted || disabled}>
          FALSE
        </button>
      </div>
      {!submitted && !disabled && (
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={picked === null}
          style={{ width: '100%' }}
        >
          Check
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// WordMatchQuiz — Match words to definitions (click-to-pair)
// ---------------------------------------------------------------------------
function WordMatchQuiz({ segment, onAnswer, disabled }) {
  const [selectedWord, setSelectedWord] = useState(null)
  const [matches, setMatches] = useState({}) // { word: defIndex }
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState({}) // { word: true/false }

  const payload = segment.quiz_payload || {}
  const pairs = Array.isArray(payload.pairs) ? payload.pairs : []
  const words = pairs.map(p => p.word)

  const shuffledDefs = useMemo(() => {
    if (Array.isArray(payload.shuffled_defs)) return payload.shuffled_defs
    return pairs.map(p => p.definition).sort(() => Math.random() - 0.5)
  }, [pairs, payload.shuffled_defs])

  function handleWordClick(word) {
    if (submitted || disabled) return
    setSelectedWord(word === selectedWord ? null : word)
  }

  function handleDefClick(defIdx) {
    if (submitted || disabled || !selectedWord) return
    setMatches(prev => ({ ...prev, [selectedWord]: defIdx }))
    setSelectedWord(null)
  }

  function handleSubmit() {
    if (submitted) return
    setSubmitted(true)
    const res = {}
    let allCorrect = true
    for (const pair of pairs) {
      const matchedDefIdx = matches[pair.word]
      const isCorrect = matchedDefIdx !== undefined && shuffledDefs[matchedDefIdx] === pair.definition
      res[pair.word] = isCorrect
      if (!isCorrect) allCorrect = false
    }
    setResults(res)
    onAnswer(allCorrect)
  }

  const allMatched = Object.keys(matches).length === words.length

  return (
    <div style={cardStyle}>
      <p style={promptStyle}>Match each word to its meaning:</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
        {/* Words column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {words.map(w => {
            const matched = matches[w] !== undefined
            const isSelected = selectedWord === w
            const correct = submitted && results[w] === true
            const wrong = submitted && results[w] === false
            return (
              <button
                key={w}
                onClick={() => handleWordClick(w)}
                disabled={submitted || disabled}
                style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-md)',
                  border: `2px solid ${correct ? 'var(--color-success)' : wrong ? 'var(--color-danger)' : isSelected ? 'var(--color-grass)' : matched ? 'var(--color-grass)' : 'var(--color-disabled)'}`,
                  background: correct ? 'rgba(111,186,44,0.08)' : wrong ? 'rgba(224,90,90,0.08)' : isSelected ? 'rgba(111,186,44,0.06)' : 'white',
                  fontSize: 13, fontWeight: 600, cursor: submitted ? 'default' : 'pointer',
                  color: 'var(--color-title)',
                }}
              >
                {w}
              </button>
            )
          })}
        </div>
        {/* Definitions column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {shuffledDefs.map((def, di) => {
            const isUsed = Object.values(matches).includes(di)
            return (
              <button
                key={di}
                onClick={() => handleDefClick(di)}
                disabled={submitted || disabled || !selectedWord || isUsed}
                style={{
                  padding: '8px 12px', borderRadius: 'var(--radius-md)',
                  border: `2px solid ${isUsed ? 'var(--color-grass)' : 'var(--color-disabled)'}`,
                  background: isUsed ? 'rgba(111,186,44,0.04)' : 'white',
                  fontSize: 12, cursor: submitted || isUsed ? 'default' : 'pointer',
                  color: 'var(--color-body)', opacity: isUsed ? 0.7 : 1,
                  textAlign: 'left',
                }}
              >
                {def}
              </button>
            )
          })}
        </div>
      </div>
      {!submitted && !disabled && (
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!allMatched}
          style={{ width: '100%' }}
        >
          Check
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SentenceOrderQuiz — Drag-to-reorder (click-based for simplicity)
// ---------------------------------------------------------------------------
function SentenceOrderQuiz({ segment, onAnswer, disabled }) {
  const payload = segment.quiz_payload || {}
  const sentences = Array.isArray(payload.sentences) ? payload.sentences : []
  const correctOrder = Array.isArray(payload.correct_order) ? payload.correct_order : sentences.map((_, i) => i)

  const [order, setOrder] = useState(() => {
    // Start with a shuffled order
    const indices = sentences.map((_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
  })
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  function handleClick(posIdx) {
    if (submitted || disabled) return
    if (selectedIdx === null) {
      setSelectedIdx(posIdx)
    } else {
      // Swap
      setOrder(prev => {
        const next = [...prev]
        ;[next[selectedIdx], next[posIdx]] = [next[posIdx], next[selectedIdx]]
        return next
      })
      setSelectedIdx(null)
    }
  }

  function handleSubmit() {
    if (submitted) return
    setSubmitted(true)
    const isCorrect = order.every((val, idx) => val === correctOrder[idx])
    onAnswer(isCorrect)
  }

  return (
    <div style={cardStyle}>
      <p style={promptStyle}>Put the sentences in the correct order:</p>
      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 'var(--space-md)' }}>
        Tap two items to swap their positions
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        {order.map((sentIdx, posIdx) => {
          const isSelected = selectedIdx === posIdx
          const isCorrectPos = submitted && sentIdx === correctOrder[posIdx]
          const isWrongPos = submitted && sentIdx !== correctOrder[posIdx]
          return (
            <button
              key={posIdx}
              onClick={() => handleClick(posIdx)}
              disabled={submitted || disabled}
              style={{
                padding: '10px 14px', borderRadius: 'var(--radius-md)',
                border: `2px solid ${isCorrectPos ? 'var(--color-success)' : isWrongPos ? 'var(--color-danger)' : isSelected ? 'var(--color-grass)' : 'var(--color-disabled)'}`,
                background: isCorrectPos ? 'rgba(111,186,44,0.08)' : isWrongPos ? 'rgba(224,90,90,0.08)' : isSelected ? 'rgba(111,186,44,0.06)' : 'white',
                textAlign: 'left', cursor: submitted ? 'default' : 'pointer',
                fontSize: 13, color: 'var(--color-body)', fontFamily: 'var(--font-body)',
                display: 'flex', alignItems: 'center', gap: 'var(--space-sm)',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: isSelected ? 'var(--color-grass)' : 'var(--color-surface-soft)',
                color: isSelected ? 'white' : 'var(--color-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>
                {posIdx + 1}
              </span>
              {sentences[sentIdx]}
            </button>
          )
        })}
      </div>
      {!submitted && !disabled && (
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          style={{ width: '100%' }}
        >
          Check Order
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main export — dispatches to the correct quiz type
// ---------------------------------------------------------------------------
export default function ReadingQuiz({ segment, onAnswer, disabled }) {
  const qtype = segment?.qtype || 'comprehension'

  switch (qtype) {
    case 'vocabulary_cloze':
    case 'cloze':
      return <VocabClozeQuiz segment={segment} onAnswer={onAnswer} disabled={disabled} />
    case 'comprehension':
    case 'detail_mcq':
    case 'speaker_intent':
      return <ComprehensionQuiz segment={segment} onAnswer={onAnswer} disabled={disabled} />
    case 'true_false':
      return <TrueFalseQuiz segment={segment} onAnswer={onAnswer} disabled={disabled} />
    case 'word_match':
      return <WordMatchQuiz segment={segment} onAnswer={onAnswer} disabled={disabled} />
    case 'sentence_order':
      return <SentenceOrderQuiz segment={segment} onAnswer={onAnswer} disabled={disabled} />
    default:
      return <ComprehensionQuiz segment={segment} onAnswer={onAnswer} disabled={disabled} />
  }
}
