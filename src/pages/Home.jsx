import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useToast } from '../ui/Toast'
import OnboardingModal, { isOnboardingDone } from '../components/OnboardingModal'
import { fetchLearnedVocabWords } from '../lib/courses'
import { countDueWords } from '../lib/srs'

/* Pixel-art decorative elements */
const PixelSword = (qoderProps) => (
  <svg width="32" height="32" viewBox="0 0 16 16" className={["pixel-block", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ imageRendering: 'pixelated' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
    <rect x="13" y="0" width="2" height="2" fill="#A0A0A0" data-qoder-id="qel-rect-4edc2d9f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-4edc2d9f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelSword&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:6,&quot;column&quot;:5}}"/>
    <rect x="11" y="2" width="2" height="2" fill="#A0A0A0" data-qoder-id="qel-rect-4ddc2c0c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-4ddc2c0c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelSword&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:7,&quot;column&quot;:5}}"/>
    <rect x="9" y="4" width="2" height="2" fill="#A0A0A0" data-qoder-id="qel-rect-4cdc2a79" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-4cdc2a79&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelSword&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:8,&quot;column&quot;:5}}"/>
    <rect x="7" y="6" width="2" height="2" fill="#A0A0A0" data-qoder-id="qel-rect-4bdc28e6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-4bdc28e6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelSword&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:9,&quot;column&quot;:5}}"/>
    <rect x="5" y="8" width="2" height="2" fill="#8B6914" data-qoder-id="qel-rect-4adc2753" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-4adc2753&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelSword&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:10,&quot;column&quot;:5}}"/>
    <rect x="3" y="10" width="2" height="2" fill="#8B6914" data-qoder-id="qel-rect-49dc25c0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-49dc25c0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelSword&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:11,&quot;column&quot;:5}}"/>
    <rect x="4" y="8" width="1" height="1" fill="#6B4226" data-qoder-id="qel-rect-58dc3d5d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-58dc3d5d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelSword&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:12,&quot;column&quot;:5}}"/>
    <rect x="6" y="10" width="1" height="1" fill="#6B4226" data-qoder-id="qel-rect-57dc3bca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-57dc3bca&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelSword&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:13,&quot;column&quot;:5}}"/>
  </svg>
)

const PixelPickaxe = (qoderProps) => (
  <svg width="32" height="32" viewBox="0 0 16 16" className={["pixel-block", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ imageRendering: 'pixelated' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
    <rect x="10" y="0" width="2" height="2" fill="#4FC3F7" data-qoder-id="qel-rect-a5dc3fcb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a5dc3fcb&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelPickaxe&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:19,&quot;column&quot;:5}}"/>
    <rect x="12" y="0" width="2" height="2" fill="#4FC3F7" data-qoder-id="qel-rect-a6dc415e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a6dc415e&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelPickaxe&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:20,&quot;column&quot;:5}}"/>
    <rect x="14" y="0" width="2" height="2" fill="#4FC3F7" data-qoder-id="qel-rect-a7dc42f1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a7dc42f1&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelPickaxe&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:21,&quot;column&quot;:5}}"/>
    <rect x="12" y="2" width="2" height="2" fill="#4FC3F7" data-qoder-id="qel-rect-a8dc4484" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a8dc4484&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelPickaxe&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:22,&quot;column&quot;:5}}"/>
    <rect x="10" y="4" width="2" height="2" fill="#8B6914" data-qoder-id="qel-rect-a9dc4617" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a9dc4617&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelPickaxe&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:23,&quot;column&quot;:5}}"/>
    <rect x="8" y="6" width="2" height="2" fill="#8B6914" data-qoder-id="qel-rect-aadc47aa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-aadc47aa&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelPickaxe&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:24,&quot;column&quot;:5}}"/>
    <rect x="6" y="8" width="2" height="2" fill="#8B6914" data-qoder-id="qel-rect-abdc493d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-abdc493d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelPickaxe&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:25,&quot;column&quot;:5}}"/>
    <rect x="4" y="10" width="2" height="2" fill="#8B6914" data-qoder-id="qel-rect-9cdc31a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-9cdc31a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelPickaxe&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:26,&quot;column&quot;:5}}"/>
    <rect x="2" y="12" width="2" height="2" fill="#8B6914" data-qoder-id="qel-rect-9ddc3333" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-9ddc3333&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelPickaxe&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:27,&quot;column&quot;:5}}"/>
  </svg>
)

const PixelHeart = (qoderProps) => (
  <svg width="24" height="24" viewBox="0 0 12 12" className={["pixel-block", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ imageRendering: 'pixelated' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
    <rect x="1" y="2" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-ad4e88c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-ad4e88c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:33,&quot;column&quot;:5}}"/>
    <rect x="3" y="1" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-aa4e840c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-aa4e840c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:34,&quot;column&quot;:5}}"/>
    <rect x="3" y="3" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-ab4e859f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-ab4e859f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:35,&quot;column&quot;:5}}"/>
    <rect x="1" y="4" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-a84e80e6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a84e80e6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:36,&quot;column&quot;:5}}"/>
    <rect x="5" y="2" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-a94e8279" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a94e8279&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:37,&quot;column&quot;:5}}"/>
    <rect x="7" y="1" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-a64e7dc0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a64e7dc0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:38,&quot;column&quot;:5}}"/>
    <rect x="7" y="3" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-a74e7f53" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a74e7f53&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:39,&quot;column&quot;:5}}"/>
    <rect x="9" y="2" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-b44e93ca" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-b44e93ca&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:40,&quot;column&quot;:5}}"/>
    <rect x="3" y="5" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-b54e955d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-b54e955d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:41,&quot;column&quot;:5}}"/>
    <rect x="5" y="4" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-325198bb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-325198bb&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:42,&quot;column&quot;:5}}"/>
    <rect x="7" y="5" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-31519728" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-31519728&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:43,&quot;column&quot;:5}}"/>
    <rect x="5" y="6" width="2" height="2" fill="#E05A5A" data-qoder-id="qel-rect-34519be1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-34519be1&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;PixelHeart&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:44,&quot;column&quot;:5}}"/>
  </svg>
)

// Greeting based on local hour: 5-11 Morning, 12-17 Afternoon, else Evening.
function getGreeting(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 12) return 'Good Morning'
  if (h >= 12 && h < 18) return 'Good Afternoon'
  return 'Good Evening'
}

// Static quest definitions removed in Task 6 — quest catalog now comes from
// public.quests via useAuth().quests (see AuthContext.refreshQuests).

// Visual mapping from DB tokens to CSS / SVG. Keeping styling concerns in
// the front-end avoids polluting the DB schema with presentation details.
const TILE_BG = {
  'tile-blue': 'var(--tile-blue)',
  'tile-green': 'var(--tile-green)',
  'tile-yellow': 'var(--tile-yellow)',
  'tile-purple': 'var(--tile-purple)',
  'tile-orange': 'var(--tile-orange)',
}
const LABEL_COLOR = {
  'tile-blue': 'var(--tile-blue)',
  'tile-green': 'var(--color-success)',
  'tile-yellow': '#A0822D',
  'tile-purple': 'var(--tile-purple)',
  'tile-orange': 'var(--tile-orange)',
}
const ICON_PATHS = {
  play: 'M5 3L19 12L5 21V3Z',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z',
  star: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z',
  lock: 'M12 2C13.1 2 14 2.9 14 4V8L17 10V12L14 11V15L15.5 16V17.5L12 16.5L8.5 17.5V16L10 15V11L7 12V10L10 8V4C10 2.9 10.9 2 12 2Z',
  headphones: 'M3 18V12C3 7.03 7.03 3 12 3s9 4.03 9 9v6M5 18a2 2 0 01-2-2v-2a2 2 0 012-2h1v6H5zM19 18a2 2 0 002-2v-2a2 2 0 00-2-2h-1v6h1z',
  book: 'M4 4h4c1.1 0 2 .9 2 2v14c0-1.1-.9-2-2-2H4V4zm16 0h-4c-1.1 0-2 .9-2 2v14c0-1.1.9-2 2-2h4V4z',
  diamond: 'M12 2L2 9l10 13 10-13L12 2zm0 3.5L18 9l-6 8-6-8 6-3.5z',
}
const ICON_FILL = { play: 'white', grid: 'white', star: '#725D42', lock: 'white', headphones: 'white', book: 'white', diamond: 'white' }

// Achievement icon token -> rendered pixel-art component. Tokens are stored
// in public.achievements.icon (e.g. 'heart' / 'pickaxe' / 'sword'); unknown
// tokens fall back to PixelHeart so the UI never crashes on a new value.
const ACHIEVEMENT_ICON = {
  heart: <PixelHeart  data-qoder-id="qel-pixelheart-7d2b0350" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pixelheart-7d2b0350&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;pixelheart&quot;,&quot;loc&quot;:{&quot;line&quot;:86,&quot;column&quot;:10}}"/>,
  pickaxe: <PixelPickaxe  data-qoder-id="qel-pixelpickaxe-5a2f7d47" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pixelpickaxe-5a2f7d47&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;pixelpickaxe&quot;,&quot;loc&quot;:{&quot;line&quot;:87,&quot;column&quot;:12}}"/>,
  sword: <PixelSword  data-qoder-id="qel-pixelsword-3f9e47a4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pixelsword-3f9e47a4&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;pixelsword&quot;,&quot;loc&quot;:{&quot;line&quot;:88,&quot;column&quot;:10}}"/>,
}
// Achievement color token -> CSS var. Independent from quest TILE_BG so the
// design system can evolve the two surfaces separately.
const COLOR_TOKEN = {
  'tile-pink': 'var(--tile-pink)',
  'tile-teal': 'var(--tile-teal)',
  'tile-orange': 'var(--tile-orange)',
  'tile-blue': 'var(--tile-blue)',
  'tile-green': 'var(--tile-green)',
  'tile-yellow': 'var(--tile-yellow)',
  'tile-purple': 'var(--tile-purple)',
}

function QuestCard({ quest, isClaimed, isLocked, ...qoderProps }) {
  const bg = TILE_BG[quest.color_token] || 'var(--tile-blue)'
  const labelColor = LABEL_COLOR[quest.color_token] || bg
  const iconPath = ICON_PATHS[quest.icon_token] || ICON_PATHS.play
  const iconFill = ICON_FILL[quest.icon_token] || 'white'
  return (
    <div className={["card", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({
      cursor: isLocked ? 'default' : 'pointer',
      position: 'relative',
      overflow: 'hidden',
      opacity: isLocked ? 0.7 : (isClaimed ? 0.55 : 1),
    }), ...(qoderProps?.style) }} data-qoder-id="qel-card-37079713" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-37079713&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:88,&quot;column&quot;:5}}">
      <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:bg, borderRadius:'var(--radius-lg) var(--radius-lg) 0 0' }} data-qoder-id="qel-div-130b97cf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-130b97cf&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:94,&quot;column&quot;:7}}"/>
      <div style={{ display:'flex', alignItems:'center', gap:'var(--space-sm)', marginBottom:'var(--space-sm)' }} data-qoder-id="qel-div-120b963c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-120b963c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:7}}">
        <div style={{ width:36, height:36, borderRadius:'var(--radius-sm)', background:bg, display:'flex', alignItems:'center', justifyContent:'center' }} data-qoder-id="qel-div-150b9af5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-150b9af5&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:9}}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill={iconFill} data-qoder-id="qel-svg-e44d5b86" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-e44d5b86&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:11}}"><path d={iconPath} data-qoder-id="qel-path-c053c44d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-c053c44d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:75}}"/></svg>
        </div>
        <span style={{ fontSize:'11px', fontWeight:700, color:labelColor, textTransform:'uppercase', letterSpacing:'0.06em' }} data-qoder-id="qel-span-5f41c2ec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5f41c2ec&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:99,&quot;column&quot;:9}}">{quest.kind}</span>
      </div>
      <h4 style={{ marginBottom:'6px', fontSize:'15px' }} data-qoder-id="qel-h4-5caf0c48" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h4-5caf0c48&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;h4&quot;,&quot;loc&quot;:{&quot;line&quot;:101,&quot;column&quot;:7}}">{quest.title}</h4>
      <p style={{ fontSize:'13px', color:'var(--color-muted)', marginBottom:'var(--space-sm)' }} data-qoder-id="qel-p-7ea75f5b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-7ea75f5b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:7}}">{quest.description}</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }} data-qoder-id="qel-div-170ddcb2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-170ddcb2&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:103,&quot;column&quot;:7}}">
        {isLocked ? (
          <span style={{ fontSize:'12px', fontWeight:700, color:'var(--color-muted)', background:'var(--color-surface-soft)', padding:'3px 8px', borderRadius:'var(--radius-pill)' }} data-qoder-id="qel-span-61307cf1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-61307cf1&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:11}}">{`Unlocks at Lv ${quest.unlock_level}`}</span>
        ) : (
          <span style={{ fontSize:'12px', fontWeight:700, color:'var(--color-xp)', background:'rgba(123,31,162,0.08)', padding:'3px 8px', borderRadius:'var(--radius-pill)' }} data-qoder-id="qel-span-62307e84" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-62307e84&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:107,&quot;column&quot;:11}}">
            {isClaimed ? '✓ Claimed' : `+${quest.xp_reward} XP`}
          </span>
        )}
        {isLocked ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--color-muted)" data-qoder-id="qel-svg-e23c0f3f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-e23c0f3f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:112,&quot;column&quot;:11}}"><path d="M12 2C9.24 2 7 4.24 7 7V10H5V22H19V10H17V7C17 4.24 14.76 2 12 2ZM12 4C13.66 4 15 5.34 15 7V10H9V7C9 5.34 10.34 4 12 4Z" data-qoder-id="qel-path-404c3f08" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-404c3f08&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:112,&quot;column&quot;:85}}"/></svg>
        ) : (
          <span style={{ fontSize:'11px', color:'var(--color-muted)' }} data-qoder-id="qel-span-6530833d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-6530833d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;QuestCard&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:11}}">{quest.duration_min ? `${quest.duration_min} min` : ''}</span>
        )}
      </div>
    </div>
  )
}

export default function Home(qoderProps) {
  const {
    profile, todayCompletions, weekDots,
    quests, achievements, userUnlocks, claimQuest,
    questsLoaded, achievementsLoaded,
    bootstrapError, clearBootstrapError,
    courses, coursesLoaded,
    authUser,
  } = useAuth()
  const toast = useToast()
  // First-login onboarding flag: only render the modal when the user has
  // never completed it AND we have a hydrated profile + courses catalog
  // (otherwise step 2 has no recommendation to show).
  const [showOnboarding, setShowOnboarding] = useState(() => !isOnboardingDone())
  // Surface bootstrap errors as toast (single channel — clearBootstrapError
  // resets the flag so a subsequent refresh failure can fire again).
  useEffect(() => {
    if (!bootstrapError) return
    toast.error(bootstrapError)
    clearBootstrapError()
  }, [bootstrapError, toast, clearBootstrapError])
  // RequireAuth guarantees profile is loaded; no email-prefix fallback needed.
  const displayName = profile?.displayName || 'Adventurer'
  const level = profile?.level ?? 1
  const xp = profile?.xp ?? 0
  const xpToNext = profile?.xpToNext ?? 100
  const xpPercent = profile?.xpPercent ?? 0
  const streak = profile?.streak ?? 0
  const greeting = getGreeting()
  const claimedIds = new Set((todayCompletions || []).map((c) => c.quest_id))
  const isClaimed = (id) => claimedIds.has(id)

  // ── SRS due count (local-first) ───────────────────────────────────────
  // Pulls the user's learned vocab set, then asks the SRS lib how many of
  // those words are due right now. Cheap (one cached fetch + Map walk).
  const [srsDue, setSrsDue] = useState(0)
  useEffect(() => {
    let cancelled = false
    const uid = authUser?.id
    if (!uid) return
    fetchLearnedVocabWords(uid).then((set) => {
      if (cancelled) return
      setSrsDue(countDueWords(uid, set))
    }).catch(() => { /* ignore */ })
    return () => { cancelled = true }
  }, [authUser?.id, todayCompletions])

  // ── Daily quest rotation ──────────────────────────────────────────────
  // Deterministic: all users see the same subset on a given UTC day.
  // For each kind (listen/read/vocab/quiz) we pick ONE quest from the
  // unlocked pool, cycling by day-of-epoch. Plus one locked "teaser".
  const dailyQuests = useMemo(() => {
    if (!quests || quests.length === 0) return []
    // Stable day index (UTC): same value for every user worldwide.
    const dayIndex = Math.floor(Date.now() / 86400000)

    // Partition into unlocked vs locked
    const byKind = {}   // kind -> sorted quest[]
    const locked = []
    quests.forEach((q) => {
      if (q.unlock_level > level) {
        locked.push(q)
      } else {
        if (!byKind[q.kind]) byKind[q.kind] = []
        byKind[q.kind].push(q)
      }
    })

    // Sort each pool by sort_order for deterministic cycling
    Object.values(byKind).forEach((arr) => arr.sort((a, b) => a.sort_order - b.sort_order))

    // Pick one per kind
    const picked = []
    for (const kind of ['listen', 'read', 'vocab', 'quiz']) {
      const pool = byKind[kind] || []
      if (pool.length > 0) {
        picked.push(pool[dayIndex % pool.length])
      }
    }

    // Add the lowest-unlock-level locked quest as a teaser
    locked.sort((a, b) => a.unlock_level - b.unlock_level || a.sort_order - b.sort_order)
    if (locked.length > 0) picked.push(locked[0])

    return picked.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  }, [quests, level])
  // "Today's XP" badge shows ONLY XP earned today (sum of today's completions).
  // The progress bar and Level below stay on cumulative profile.xp because
  // leveling-up is a long-term arc, not a daily reset.
  const todayXp = (todayCompletions || []).reduce((sum, c) => sum + (Number(c.xp_awarded) || 0), 0)
  // "X quests waiting" = unlocked & not yet claimed today (excludes locked rows).
  const pendingCount = dailyQuests.filter((q) => q.unlock_level <= level && !isClaimed(q.id)).length
  // Achievement unlock state: derived from useAuth().userUnlocks. Used by the
  // Recent Achievements preview to dim locked badges and tag unlocked ones.
  const unlockedSet = new Set((userUnlocks || []).map((u) => u.achievement_id))
  // Recent Achievements ranking: show user's most recently unlocked badges
  // first (sorted by unlocked_at desc), then pad up to 3 slots with locked
  // catalog items (already in sort_order). The grid is always 3 cells so the
  // section never collapses while data is bootstrapping.
  const unlockedAtById = new Map((userUnlocks || []).map((u) => [u.achievement_id, u.unlocked_at]))
  const recentAchievements = (() => {
    const list = achievements || []
    const unlocked = list
      .filter((a) => unlockedAtById.has(a.id))
      .sort((a, b) => new Date(unlockedAtById.get(b.id)) - new Date(unlockedAtById.get(a.id)))
    if (unlocked.length >= 3) return unlocked.slice(0, 3)
    const locked = list.filter((a) => !unlockedAtById.has(a.id)) // already sort_order asc
    return [...unlocked, ...locked.slice(0, 3 - unlocked.length)]
  })()

  // Fire-and-forget; claimQuest is idempotent (DB unique constraint protects
  // against double-credit), so it is safe to call alongside <Link> navigation.
  // Wraps every claim with toast feedback so the user gets immediate confirmation.
  const claimWithToast = (q) => {
    if (claimedIds.has(q.id)) return // short-circuit: no toast on re-click
    claimQuest(q)
      .then(() => toast.success(`+${q.xp_reward} XP earned!`))
      .catch((err) => {
        console.error('[home] claim failed', err)
        toast.error('Failed to claim \u2014 try again')
      })
  }

  // Smart Start Learning CTA: pick the first unlocked + unclaimed quest with
  // a route as the next thing to do. Falls back to the Courses index when
  // everything for today is claimed (so the button never feels dead).
  const nextQuest = dailyQuests
    .filter((q) => q.unlock_level <= level && !isClaimed(q.id) && !!q.route)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
  const ctaTo = nextQuest?.route || '/courses'
  const ctaLabel = nextQuest ? 'Continue Quest' : 'Start Learning'
  const onCtaClick = () => { if (nextQuest) claimWithToast(nextQuest) }

  return (
    <div data-component="home-page" style={{ ...({ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {showOnboarding && coursesLoaded && (
        <OnboardingModal
          courses={courses}
          onClose={() => setShowOnboarding(false)}
        />
      )}
      {/* Welcome Hero Section */}
      <section data-component="welcome-hero" style={{
        background: 'linear-gradient(135deg, var(--color-grass-wash) 0%, var(--color-surface) 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-xl)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-xl)',
        position: 'relative',
        overflow: 'hidden'
      }} data-qoder-id="qel-welcome-hero-dbd6ea0a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-welcome-hero-dbd6ea0a&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;welcome-hero&quot;,&quot;loc&quot;:{&quot;line&quot;:52,&quot;column&quot;:7}}">
        {/* Pixel decoration */}
        <div style={{ position: 'absolute', top: 12, right: 20, opacity: 0.15 }} data-qoder-id="qel-div-98547a15" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-98547a15&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:63,&quot;column&quot;:9}}">
          <PixelSword  data-qoder-id="qel-pixelsword-55abfa7a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pixelsword-55abfa7a&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;pixelsword&quot;,&quot;loc&quot;:{&quot;line&quot;:64,&quot;column&quot;:11}}"/>
        </div>
        <div style={{ position: 'absolute', bottom: 12, right: 60, opacity: 0.12 }} data-qoder-id="qel-div-965476ef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-965476ef&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:66,&quot;column&quot;:9}}">
          <PixelPickaxe  data-qoder-id="qel-pixelpickaxe-ed25bd38" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-pixelpickaxe-ed25bd38&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;pixelpickaxe&quot;,&quot;loc&quot;:{&quot;line&quot;:67,&quot;column&quot;:11}}"/>
        </div>

        {/* Character illustration area */}
        <div style={{
          width: 100, height: 100, borderRadius: 'var(--radius-lg)',
          background: 'var(--color-grass)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 0 0 var(--color-grass-active)',
          flexShrink: 0
        }} data-qoder-id="qel-div-9c548061" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9c548061&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:71,&quot;column&quot;:9}}">
          <svg width="64" height="64" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} data-qoder-id="qel-svg-6c5862ad" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-6c5862ad&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:78,&quot;column&quot;:11}}">
            <rect x="4" y="0" width="8" height="4" fill="#6B4226" data-qoder-id="qel-rect-3de28012" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-3de28012&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:79,&quot;column&quot;:13}}"/>
            <rect x="3" y="4" width="10" height="4" fill="#C69C6D" data-qoder-id="qel-rect-3ce27e7f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-3ce27e7f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:13}}"/>
            <rect x="5" y="4" width="2" height="2" fill="#FFF" data-qoder-id="qel-rect-3be27cec" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-3be27cec&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:81,&quot;column&quot;:13}}"/>
            <rect x="9" y="4" width="2" height="2" fill="#FFF" data-qoder-id="qel-rect-3ae27b59" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-3ae27b59&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:82,&quot;column&quot;:13}}"/>
            <rect x="5" y="5" width="1" height="1" fill="#3B2213" data-qoder-id="qel-rect-39e279c6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-39e279c6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:83,&quot;column&quot;:13}}"/>
            <rect x="10" y="5" width="1" height="1" fill="#3B2213" data-qoder-id="qel-rect-38e27833" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-38e27833&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:84,&quot;column&quot;:13}}"/>
            <rect x="7" y="7" width="2" height="1" fill="#A0522D" data-qoder-id="qel-rect-37e276a0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-37e276a0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:13}}"/>
            <rect x="4" y="8" width="8" height="4" fill="#00A8A8" data-qoder-id="qel-rect-46e28e3d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-46e28e3d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:86,&quot;column&quot;:13}}"/>
            <rect x="4" y="12" width="3" height="4" fill="#2C2C8C" data-qoder-id="qel-rect-45e28caa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-45e28caa&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:87,&quot;column&quot;:13}}"/>
            <rect x="9" y="12" width="3" height="4" fill="#2C2C8C" data-qoder-id="qel-rect-38e0399c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-38e0399c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:88,&quot;column&quot;:13}}"/>
            <rect x="2" y="8" width="2" height="4" fill="#C69C6D" data-qoder-id="qel-rect-39e03b2f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-39e03b2f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:89,&quot;column&quot;:13}}"/>
            <rect x="12" y="8" width="2" height="4" fill="#C69C6D" data-qoder-id="qel-rect-3ae03cc2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-3ae03cc2&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:90,&quot;column&quot;:13}}"/>
          </svg>
        </div>

        <div style={{ flex: 1 }} data-qoder-id="qel-div-92456619" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-92456619&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:94,&quot;column&quot;:9}}">
          <h2 style={{ marginBottom: 'var(--space-sm)' }} data-qoder-id="qel-h2-dca08720" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h2-dca08720&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;h2&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:11}}">{greeting}, {displayName}!</h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-md)', fontSize: '15px' }} data-qoder-id="qel-p-f7d2321b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-f7d2321b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:11}}">
            {pendingCount > 0
              ? `Ready to mine some English words today? You have ${pendingCount} ${pendingCount === 1 ? 'quest' : 'quests'} waiting.`
              : `All quests claimed for today \u2014 see you tomorrow!`}
          </p>
          <Link to={ctaTo} onClick={onCtaClick} style={{ textDecoration: 'none' }} data-qoder-id="qel-link-0bd006b6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-0bd006b6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:99,&quot;column&quot;:11}}">
            <button className="btn btn-primary" data-qoder-id="qel-btn-4ace667b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-btn-4ace667b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;btn&quot;,&quot;loc&quot;:{&quot;line&quot;:100,&quot;column&quot;:13}}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" data-qoder-id="qel-svg-de55448c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-de55448c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:101,&quot;column&quot;:15}}">
                <path d="M5 3L19 12L5 21V3Z" fill="currentColor" data-qoder-id="qel-path-223e58fd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-223e58fd&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:17}}"/>
              </svg>
              {ctaLabel}
            </button>
          </Link>
        </div>
      </section>

      {/* Daily Progress Section */}
      <section data-component="daily-progress" style={{ display: 'flex', gap: 'var(--space-md)' }} data-qoder-id="qel-daily-progress-c8588c23" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-daily-progress-c8588c23&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;daily-progress&quot;,&quot;loc&quot;:{&quot;line&quot;:111,&quot;column&quot;:7}}">
        {/* XP Progress */}
        <div className="card" style={{ flex: 1 }} data-qoder-id="qel-card-6862d2a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-6862d2a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:113,&quot;column&quot;:9}}">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }} data-qoder-id="qel-div-234d0621" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-234d0621&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:11}}">
            <h4 data-qoder-id="qel-h4-9701ea3a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h4-9701ea3a&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;h4&quot;,&quot;loc&quot;:{&quot;line&quot;:115,&quot;column&quot;:13}}">Today's XP</h4>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-grass)', background: 'var(--color-grass-wash)', padding: '4px 10px', borderRadius: 'var(--radius-pill)' }} data-qoder-id="qel-span-ae5d12eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-ae5d12eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:116,&quot;column&quot;:13}}">
              +{todayXp} XP
            </span>
          </div>
          <div className="progress-bar" style={{ marginBottom: 'var(--space-sm)' }} data-qoder-id="qel-progress-bar-ef55a194" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-progress-bar-ef55a194&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;progress-bar&quot;,&quot;loc&quot;:{&quot;line&quot;:120,&quot;column&quot;:11}}">
            <div className="progress-fill" style={{ width: `${xpPercent}%`, background: 'linear-gradient(90deg, var(--color-grass), var(--color-grass-hover))' }}  data-qoder-id="qel-progress-fill-470865f9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-progress-fill-470865f9&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;progress-fill&quot;,&quot;loc&quot;:{&quot;line&quot;:121,&quot;column&quot;:13}}"/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-muted)' }} data-qoder-id="qel-div-264d0ada" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-264d0ada&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:123,&quot;column&quot;:11}}">
            <span data-qoder-id="qel-span-aa5d0c9f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-aa5d0c9f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:124,&quot;column&quot;:13}}">{xp} / {xpToNext} XP</span>
            <span data-qoder-id="qel-span-a95d0b0c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-a95d0b0c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:125,&quot;column&quot;:13}}">Level {level}</span>
          </div>
        </div>

        {/* Streak Card */}
        <div className="card" style={{ width: 160, textAlign: 'center' }} data-qoder-id="qel-card-6d651919" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-6d651919&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:130,&quot;column&quot;:9}}">
          <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--color-gold)', fontFamily: 'var(--font-display)' }} data-qoder-id="qel-div-9c49f305" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9c49f305&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:131,&quot;column&quot;:11}}">{streak}</div>
          <div style={{ fontSize: '13px', color: 'var(--color-muted)', fontWeight: 600 }} data-qoder-id="qel-div-9949ee4c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9949ee4c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:132,&quot;column&quot;:11}}">Day Streak</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginTop: 'var(--space-sm)' }} aria-hidden="true" data-qoder-id="qel-div-1862bb1f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1862bb1f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:301,&quot;column&quot;:11}}">
            {(() => {
              // ISO weekday label row: Monday-first (Mon=0..Sun=6). Today's
              // column is bolded + grass-tinted so the user sees their
              // current position at a glance.
              const today = (new Date().getUTCDay() + 6) % 7
              return ['M','T','W','T','F','S','S'].map((ch, i) => (
                <div key={`label-${i}`} style={{
                  width: 14, fontSize: 10, textAlign: 'center',
                  fontWeight: i === today ? 800 : 600,
                  color: i === today ? 'var(--color-grass)' : 'var(--color-muted)',
                }} data-qoder-id="qel-div-1962bcb2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1962bcb2&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:308,&quot;column&quot;:17}}">{ch}</div>
              ))
            })()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '3px', marginTop: '4px' }} data-qoder-id="qel-div-9a49efdf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9a49efdf&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:133,&quot;column&quot;:11}}">
            {/* 7 dots: Mon..Sun of the current ISO week. Lit if the user
                completed at least one quest on that day (UTC). */}
            {(weekDots || [false,false,false,false,false,false,false]).map((lit, i) => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: 4,
                background: lit ? 'var(--color-gold)' : 'var(--color-surface-soft)'
              }}  data-qoder-id="qel-div-9749eb26" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9749eb26&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:135,&quot;column&quot;:15}}"/>
            ))}
          </div>
        </div>
      </section>

      {/* SRS review strip — only renders when there are due words. Routes to
          /vocab-review for the local-first review queue. */}
      {srsDue > 0 && (
        <section data-component="srs-review-strip">
          <Link
            to="/vocab-review"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 'var(--space-md)',
              padding: '12px 16px',
              background: 'linear-gradient(90deg, var(--color-grass-wash), var(--color-surface))',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-grass)',
              textDecoration: 'none', color: 'var(--color-title)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ fontSize: 22 }}>🔁</span>
              <div>
                <div style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                  color: 'var(--color-title)',
                }}>
                  {srsDue} {srsDue === 1 ? 'word' : 'words'} due to review
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-muted)' }}>
                  Quick spaced-repetition session
                </div>
              </div>
            </div>
            <span style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13,
              color: '#fff', background: 'var(--color-grass)',
              padding: '6px 14px', borderRadius: 'var(--radius-pill)',
            }}>
              Review →
            </span>
          </Link>
        </section>
      )}

      {/* Recommended Courses */}
      <section data-component="recommended-courses" data-qoder-id="qel-recommended-courses-fb9cdbac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-recommended-courses-fb9cdbac&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;recommended-courses&quot;,&quot;loc&quot;:{&quot;line&quot;:145,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }} data-qoder-id="qel-div-9549e800" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-9549e800&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:146,&quot;column&quot;:9}}">
          <h3 data-qoder-id="qel-h3-2912a911" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h3-2912a911&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;h3&quot;,&quot;loc&quot;:{&quot;line&quot;:147,&quot;column&quot;:11}}">Today's Quests</h3>
          <Link to="/courses" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-grass)', textDecoration: 'none' }} data-qoder-id="qel-link-11d48d56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-11d48d56&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:148,&quot;column&quot;:11}}">
            View All
          </Link>
        </div>

        <div className="recommended-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }} data-qoder-id="qel-div-a449ff9d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-a449ff9d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:153,&quot;column&quot;:9}}">
          {/* Quest cards — fully data-driven from public.quests via useAuth().quests.
              - quest.route present  -> wrap in <Link> + fire-and-forget claimQuest on click
              - quest.route absent   -> <div onClick=claimQuest> (in-place quest)
              - unlock_level > level -> render as locked (non-interactive)
              While quests are still loading we render 4 grey skeleton cards so
              the grid never collapses to a flash of empty space. questsLoaded
              flips to true in refreshQuests' finally{} regardless of outcome. */}
          {!questsLoaded ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-${i}`} aria-hidden="true" style={{
                height: 120,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-soft)',
                opacity: 0.4,
              }}  data-qoder-id="qel-div-1f62c624" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1f62c624&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:323,&quot;column&quot;:15}}"/>
            ))
          ) : dailyQuests.map((q) => {
            const claimed = isClaimed(q.id)
            const locked  = q.unlock_level > level
            const card = <QuestCard quest={q} isClaimed={claimed} isLocked={locked}  data-qoder-id="qel-questcard-09152e77" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-questcard-09152e77&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;questcard&quot;,&quot;loc&quot;:{&quot;line&quot;:260,&quot;column&quot;:26}}"/>
            if (locked) return <div key={q.id} data-qoder-id="qel-div-1562b666" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1562b666&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:261,&quot;column&quot;:32}}">{card}</div>
            const onClick = () => claimWithToast(q)
            if (q.route) {
              return (
                <Link key={q.id} to={q.route} onClick={onClick} style={{ textDecoration: 'none' }} data-qoder-id="qel-link-0cb1f335" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-0cb1f335&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:268,&quot;column&quot;:17}}">
                  {card}
                </Link>
              )
            }
            return (
              <div
                key={q.id}
                role="button"
                tabIndex={claimed ? -1 : 0}
                aria-label={`Claim ${q.title}, ${q.xp_reward} XP`}
                onClick={onClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
                style={{ cursor: claimed ? 'default' : 'pointer' }}
               data-qoder-id="qel-div-11d35c90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-11d35c90&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:369,&quot;column&quot;:15}}">{card}</div>
            )
          })}
        </div>
      </section>

      {/* Recent Achievements Preview
        - Data source: useAuth().achievements (catalog) + useAuth().userUnlocks
          (this user's unlocked rows). Both are refreshed on bootstrap, on
          auth change, and after every claimQuest (via evaluateAndUnlock).
        - We display the first 3 items by sort_order. Unlocked items render
          with full opacity; locked ones are dimmed to 0.4. Icons are mapped
          via ACHIEVEMENT_ICON; unknown tokens fall back to PixelHeart.
      */}
      <section data-component="recent-achievements" className="card-flat" style={{ background: 'var(--color-surface-soft)', borderRadius: 'var(--radius-xl)', padding: 'var(--space-lg)' }} data-qoder-id="qel-recent-achievements-ec33c338" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-recent-achievements-ec33c338&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;recent-achievements&quot;,&quot;loc&quot;:{&quot;line&quot;:286,&quot;column&quot;:7}}">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }} data-qoder-id="qel-div-15d362dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-15d362dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:287,&quot;column&quot;:9}}">
          <h4 data-qoder-id="qel-h4-44b2a4fb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h4-44b2a4fb&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;h4&quot;,&quot;loc&quot;:{&quot;line&quot;:288,&quot;column&quot;:11}}">Recent Achievements</h4>
          <Link to="/achievements" style={{ fontSize: '12px', color: 'var(--color-grass)', fontWeight: 600, textDecoration: 'none' }} data-qoder-id="qel-link-6ff6ed1e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-6ff6ed1e&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:289,&quot;column&quot;:11}}">See All</Link>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-md)' }} data-qoder-id="qel-div-18d36795" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-18d36795&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:291,&quot;column&quot;:9}}">
          {!achievementsLoaded ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={`ach-skeleton-${i}`} aria-hidden="true" style={{
                flex: 1,
                height: 96,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface)',
                opacity: 0.4,
              }}  data-qoder-id="qel-div-1dd36f74" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-1dd36f74&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:364,&quot;column&quot;:15}}"/>
            ))
          ) : recentAchievements.map((badge) => {
            const unlocked = unlockedSet.has(badge.id)
            const icon = ACHIEVEMENT_ICON[badge.icon] || ACHIEVEMENT_ICON.heart
            const bg = COLOR_TOKEN[badge.color_token] || 'var(--tile-pink)'
            return (
              <div key={badge.id} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                padding: 'var(--space-md)', borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface)', flex: 1, textAlign: 'center'
              }} data-qoder-id="qel-div-11d35c90" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-11d35c90&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:297,&quot;column&quot;:15}}">
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: unlocked ? 1 : 0.4
                }} data-qoder-id="qel-div-12d35e23" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-12d35e23&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:302,&quot;column&quot;:17}}">
                  {icon}
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-title)' }} data-qoder-id="qel-span-5d3fed2a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5d3fed2a&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:309,&quot;column&quot;:17}}">{badge.name}</span>
                <span style={{ fontSize: '11px', color: unlocked ? 'var(--color-success)' : 'var(--color-muted)' }} data-qoder-id="qel-span-5e3feebd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-5e3feebd&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Home.jsx&quot;,&quot;componentName&quot;:&quot;Home&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:310,&quot;column&quot;:17}}">
                  {unlocked ? '✓ Unlocked' : badge.description}
                </span>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
