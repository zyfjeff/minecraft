import { useEffect } from 'react'

// VocabPopover — a centered modal-style card showing a single vocab entry.
// Clicking the backdrop or pressing Escape closes it.
//
// Used by VideoLesson + ReadingPractice when the user taps a highlight word.
// We use a modal over an inline anchored popover because the lesson cards
// already pack a lot of vertical content; a centered card avoids worrying
// about clipping inside scrollable timelines.
//
// Props:
//   word    string   — the canonical lowercase form (used as fallback title)
//   entry   object?  — vocab row from public.vocab; may be null when the word
//                      isn't in the dictionary yet (e.g. seed coverage gap)
//   onClose ()=>void — required
export default function VocabPopover({ word, entry, onClose }) {
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!word && !entry) return null
  const display = entry?.word || word

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Definition of ${display}`}
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 'var(--space-lg)',
      }}
     data-qoder-id="qel-div-7825dc44" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7825dc44&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:29,&quot;column&quot;:5}}">
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-lg)',
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          position: 'relative',
        }}
       data-qoder-id="qel-div-7b25e0fd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7b25e0fd&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:45,&quot;column&quot;:7}}">
        {/* Close (×) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 'var(--space-md)',
            right: 'var(--space-md)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            background: 'var(--color-surface-soft)',
            color: 'var(--color-muted)',
            cursor: 'pointer',
            fontSize: 16,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
         data-qoder-id="qel-close-724cacb4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-close-724cacb4&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;close&quot;,&quot;loc&quot;:{&quot;line&quot;:58,&quot;column&quot;:9}}">
          ×
        </button>

        {/* Header: word + part of speech */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }} data-qoder-id="qel-div-7525d78b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7525d78b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:84,&quot;column&quot;:9}}">
          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            fontWeight: 800,
            color: 'var(--color-title)',
            margin: 0,
          }} data-qoder-id="qel-h3-7574198a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h3-7574198a&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;h3&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:11}}">
            {display}
          </h3>
          {entry?.pos ? (
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--color-grass-active)',
              background: 'var(--color-grass-wash)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-pill)',
              textTransform: 'lowercase',
              letterSpacing: '0.04em',
            }} data-qoder-id="qel-span-d8e1c2c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d8e1c2c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:13}}">
              {entry.pos}
            </span>
          ) : null}
        </div>

        {/* Body */}
        {entry ? (
          <>
            {entry.definition_en ? (
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-body)', margin: 0, marginBottom: 'var(--space-sm)' }} data-qoder-id="qel-p-c78ccfda" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-c78ccfda&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:15}}">
                {entry.definition_en}
              </p>
            ) : null}
            {entry.definition_zh ? (
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--color-muted)', margin: 0, marginBottom: 'var(--space-md)' }} data-qoder-id="qel-p-ba8cbb63" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-ba8cbb63&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:119,&quot;column&quot;:15}}">
                {entry.definition_zh}
              </p>
            ) : null}
            {(entry.example_en || entry.example_zh) ? (
              <div style={{
                background: 'var(--color-cream)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md)',
                borderLeft: '3px solid var(--color-grass)',
              }} data-qoder-id="qel-div-7025cfac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7025cfac&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:124,&quot;column&quot;:15}}">
                {entry.example_en ? (
                  <p style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--color-title)', margin: 0, marginBottom: entry.example_zh ? 4 : 0 }} data-qoder-id="qel-p-089c3c88" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-089c3c88&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:131,&quot;column&quot;:19}}">
                    “{entry.example_en}”
                  </p>
                ) : null}
                {entry.example_zh ? (
                  <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: 0 }} data-qoder-id="qel-p-099c3e1b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-099c3e1b&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:136,&quot;column&quot;:19}}">
                    {entry.example_zh}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }} data-qoder-id="qel-p-0a9c3fae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-0a9c3fae&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/VocabPopover.jsx&quot;,&quot;componentName&quot;:&quot;VocabPopover&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:144,&quot;column&quot;:11}}">
            No dictionary entry for “{display}” yet.
          </p>
        )}
      </div>
    </div>
  )
}
