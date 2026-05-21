// =============================================================================
// PixelWaveform — Minecraft-style 16-bar pixel waveform for the listening stage.
// Pure SVG, no real audio analysis. Drives bar heights from a deterministic
// pseudo-random function of (time, barIndex) so it looks "alive" without us
// ever touching the YouTube audio stream (cross-origin anyway).
//
// active=true  → animated; bars dance every ~120ms.
// active=false → flat low bars (idle silhouette).
// =============================================================================
import { useEffect, useState } from 'react'

const BAR_COUNT = 16
const BAR_WIDTH = 6
const BAR_GAP = 4
const BAR_MAX_HEIGHT = 60
const BAR_MIN_HEIGHT = 4

// Deterministic per-bar height seed so the waveform feels organic but doesn't
// cause every bar to spike together.
function barHeight(t, i, active) {
  if (!active) return BAR_MIN_HEIGHT
  // Layered sine waves at different phases per bar -> visually rich.
  const phase = i * 0.42
  const wave = Math.sin(t * 0.012 + phase) * 0.55
            + Math.sin(t * 0.027 + phase * 1.7) * 0.30
            + Math.sin(t * 0.041 + phase * 2.3) * 0.15
  // wave is now in roughly [-1, 1]. Map to [0, 1] then scale.
  const norm = Math.max(0, (wave + 1) * 0.5)
  return BAR_MIN_HEIGHT + norm * (BAR_MAX_HEIGHT - BAR_MIN_HEIGHT)
}

export default function PixelWaveform({ active, size = 120, ...qoderProps }) {
  const [tick, setTick] = useState(0)

  // Drive ticks with setInterval rather than rAF: a 120ms cadence is plenty
  // for a chunky pixel look and won't burn the GPU.
  useEffect(() => {
    if (!active) return undefined
    const id = setInterval(() => {
      setTick((t) => t + 1)
    }, 120)
    return () => clearInterval(id)
  }, [active])

  const totalWidth = BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP
  const t = Date.now() // baked-in animation phase
  const _ = tick // re-render trigger

  return (
    <svg
      width={size}
      height={size * 0.6}
      viewBox={`0 0 ${totalWidth} ${BAR_MAX_HEIGHT}`}
      role="img"
      aria-label={active ? 'audio waveform playing' : 'audio waveform idle'}
      style={{ ...({ display: 'block', shapeRendering: 'crispEdges' }), ...(qoderProps?.style) }}
     data-qoder-id="qel-svg-bbb40862" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-bbb40862&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PixelWaveform.jsx&quot;,&quot;componentName&quot;:&quot;PixelWaveform&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:50,&quot;column&quot;:5}}" className={qoderProps?.className}>
      {Array.from({ length: BAR_COUNT }).map((__, i) => {
        const h = barHeight(t, i, active)
        const x = i * (BAR_WIDTH + BAR_GAP)
        const y = (BAR_MAX_HEIGHT - h) / 2
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={BAR_WIDTH}
            height={h}
            fill={active ? 'white' : 'rgba(255,255,255,0.45)'}
           data-qoder-id="qel-rect-180db83f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-180db83f&quot;,&quot;filePath&quot;:&quot;react-vite/src/components/PixelWaveform.jsx&quot;,&quot;componentName&quot;:&quot;PixelWaveform&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:63,&quot;column&quot;:11}}"/>
        )
      })}
    </svg>
  )
}
