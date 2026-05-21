// =============================================================================
// LazyMount — Render `children` only when the placeholder enters the viewport.
//
// Why: CourseList renders ~70 cards with one YouTube thumbnail each. While the
// SVGs are cheap, the offscreen <img loading="lazy"> elements still produce a
// large initial DOM and force the browser to parse / style every card up
// front. Wrapping the card in <LazyMount> keeps offscreen entries as cheap
// fixed-height placeholders until they're about to be needed.
//
// Once visible (or once IntersectionObserver is unavailable, e.g. SSR/very old
// browsers), the children become permanently mounted — we never unmount, so
// scrolling back is instant and any internal state is preserved.
// =============================================================================
import { useEffect, useRef, useState } from 'react'

export default function LazyMount({
  children,
  // Estimated placeholder height so the page layout doesn't jump when many
  // cards mount in succession. Caller can override per-component.
  minHeight = 132,
  // Pre-load at this distance from the viewport so cards fade in before the
  // user actually scrolls them into view.
  rootMargin = '200px 0px',
  className,
  style,
  placeholderStyle,
}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(() => {
    // Fallback when IntersectionObserver isn't available — render eagerly.
    return typeof window === 'undefined' || typeof window.IntersectionObserver !== 'function'
  })

  useEffect(() => {
    if (shown) return
    const node = ref.current
    if (!node) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            io.disconnect()
            break
          }
        }
      },
      { rootMargin },
    )
    io.observe(node)
    return () => io.disconnect()
  }, [shown, rootMargin])

  if (shown) {
    // Once mounted we still keep `ref` so re-mounts (e.g. filter change) don't
    // strip the wrapper from the DOM tree.
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{ minHeight, ...style, ...placeholderStyle }}
      aria-hidden="true"
    />
  )
}
