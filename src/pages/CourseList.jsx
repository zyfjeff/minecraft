import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { computeCoursePercent } from '../lib/courses'
import { resolveThumbnailKey } from '../lib/courseThumbnails'
import LazyMount from '../components/LazyMount'

// Number of slots in the "For You" recommendation strip at the top of the page.
// Three cards is a sweet spot: enough variety to feel curated, few enough that
// the strip stays above the fold on most phones (≤1 row tall).
const RECOMMEND_SLOTS = 3

// Index threshold below which a card is rendered eagerly. The first batch is
// always painted on first frame so users see content immediately; later cards
// stream in via IntersectionObserver as the user scrolls.
const EAGER_RENDER_COUNT = 8

// Map course.kind -> top-accent color token (matches the original mock palette).
const KIND_COLOR = {
  listening: 'var(--tile-blue)',
  reading: 'var(--tile-green)',
  vocabulary: 'var(--tile-yellow)',
}

// Map course.kind -> text color used by the type chip above each card title.
const KIND_TAG_COLOR = {
  listening: 'var(--tile-blue)',
  reading: 'var(--color-success)',
  vocabulary: '#A0822D',
}

// Skeleton card placeholder, rendered while courses catalog is loading.
function SkeletonCard(qoderProps) {
  return (
    <div className={["card", qoderProps?.className].filter(Boolean).join(" ")} style={{ ...({ position: 'relative', overflow: 'hidden' }), ...(qoderProps?.style) }} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--color-surface-soft)' }}  data-qoder-id="qel-div-7db22321" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7db22321&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;SkeletonCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:24,&quot;column&quot;:7}}"/>
      <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }} data-qoder-id="qel-div-7cb2218e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7cb2218e&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;SkeletonCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:25,&quot;column&quot;:7}}">
        <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-md)', background: 'var(--color-surface-soft)', flexShrink: 0 }}  data-qoder-id="qel-div-7fb22647" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7fb22647&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;SkeletonCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:26,&quot;column&quot;:9}}"/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }} data-qoder-id="qel-div-7eb224b4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-7eb224b4&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;SkeletonCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:27,&quot;column&quot;:9}}">
          <div style={{ width: '40%', height: 8, background: 'var(--color-surface-soft)', borderRadius: 4 }}  data-qoder-id="qel-div-81b2296d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-81b2296d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;SkeletonCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:28,&quot;column&quot;:11}}"/>
          <div style={{ width: '90%', height: 12, background: 'var(--color-surface-soft)', borderRadius: 4 }}  data-qoder-id="qel-div-80b227da" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-80b227da&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;SkeletonCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:29,&quot;column&quot;:11}}"/>
          <div style={{ width: '70%', height: 10, background: 'var(--color-surface-soft)', borderRadius: 4 }}  data-qoder-id="qel-div-73b21363" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-73b21363&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;SkeletonCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:30,&quot;column&quot;:11}}"/>
        </div>
      </div>
      <div style={{ marginTop: 'var(--space-sm)', height: 6, background: 'var(--color-surface-soft)', borderRadius: 3 }}  data-qoder-id="qel-div-72b211d0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-72b211d0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;SkeletonCard&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:33,&quot;column&quot;:7}}"/>
    </div>
  )
}

/* Pixel thumbnails for course cards */
const PixelThumbnails = {
  creeper: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} data-qoder-id="qel-svg-d6a8527f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-d6a8527f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:66,&quot;column&quot;:5}}">
      <rect width="16" height="16" fill="#4CAF50" data-qoder-id="qel-rect-39739202" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-39739202&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:67,&quot;column&quot;:7}}"/>
      <rect x="3" y="3" width="4" height="4" fill="#1B5E20" data-qoder-id="qel-rect-3a739395" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-3a739395&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:68,&quot;column&quot;:7}}"/>
      <rect x="9" y="3" width="4" height="4" fill="#1B5E20" data-qoder-id="qel-rect-33738890" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-33738890&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:69,&quot;column&quot;:7}}"/>
      <rect x="6" y="7" width="4" height="2" fill="#1B5E20" data-qoder-id="qel-rect-34738a23" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-34738a23&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:70,&quot;column&quot;:7}}"/>
      <rect x="5" y="9" width="6" height="4" fill="#1B5E20" data-qoder-id="qel-rect-35738bb6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-35738bb6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:71,&quot;column&quot;:7}}"/>
      <rect x="5" y="9" width="2" height="4" fill="#1B5E20" data-qoder-id="qel-rect-36738d49" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-36738d49&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:72,&quot;column&quot;:7}}"/>
      <rect x="9" y="9" width="2" height="4" fill="#1B5E20" data-qoder-id="qel-rect-3f739b74" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-3f739b74&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:73,&quot;column&quot;:7}}"/>
    </svg>
  ),
  sword: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} data-qoder-id="qel-svg-dea85f17" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-dea85f17&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:77,&quot;column&quot;:5}}">
      <rect x="12" y="0" width="2" height="2" fill="#4FC3F7" data-qoder-id="qel-rect-3cec458d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-3cec458d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:78,&quot;column&quot;:7}}"/>
      <rect x="10" y="2" width="2" height="2" fill="#4FC3F7" data-qoder-id="qel-rect-3bec43fa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-3bec43fa&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:79,&quot;column&quot;:7}}"/>
      <rect x="8" y="4" width="2" height="2" fill="#4FC3F7" data-qoder-id="qel-rect-3aec4267" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-3aec4267&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:80,&quot;column&quot;:7}}"/>
      <rect x="6" y="6" width="2" height="2" fill="#B0BEC5" data-qoder-id="qel-rect-39ec40d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-39ec40d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:81,&quot;column&quot;:7}}"/>
      <rect x="4" y="8" width="2" height="2" fill="#8B6914" data-qoder-id="qel-rect-38ec3f41" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-38ec3f41&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:82,&quot;column&quot;:7}}"/>
      <rect x="2" y="10" width="2" height="2" fill="#8B6914" data-qoder-id="qel-rect-37ec3dae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-37ec3dae&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:83,&quot;column&quot;:7}}"/>
      <rect x="3" y="9" width="1" height="1" fill="#6B4226" data-qoder-id="qel-rect-36ec3c1b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-36ec3c1b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:84,&quot;column&quot;:7}}"/>
      <rect x="5" y="7" width="1" height="1" fill="#6B4226" data-qoder-id="qel-rect-35ec3a88" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-35ec3a88&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:7}}"/>
    </svg>
  ),
  villager: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} data-qoder-id="qel-svg-31f985c5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-31f985c5&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:89,&quot;column&quot;:5}}">
      <rect x="4" y="0" width="8" height="3" fill="#8B6914" data-qoder-id="qel-rect-33ec3762" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-33ec3762&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:90,&quot;column&quot;:7}}"/>
      <rect x="3" y="3" width="10" height="5" fill="#C69C6D" data-qoder-id="qel-rect-a2ef24b6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a2ef24b6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:91,&quot;column&quot;:7}}"/>
      <rect x="5" y="4" width="2" height="2" fill="#4A3520" data-qoder-id="qel-rect-a3ef2649" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a3ef2649&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:92,&quot;column&quot;:7}}"/>
      <rect x="9" y="4" width="2" height="2" fill="#4A3520" data-qoder-id="qel-rect-a0ef2190" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a0ef2190&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:93,&quot;column&quot;:7}}"/>
      <rect x="6" y="7" width="4" height="2" fill="#C69C6D" data-qoder-id="qel-rect-a1ef2323" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a1ef2323&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:94,&quot;column&quot;:7}}"/>
      <rect x="4" y="9" width="8" height="5" fill="#5D4037" data-qoder-id="qel-rect-a6ef2b02" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a6ef2b02&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:7}}"/>
      <rect x="3" y="9" width="2" height="4" fill="#C69C6D" data-qoder-id="qel-rect-a7ef2c95" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a7ef2c95&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:7}}"/>
      <rect x="11" y="9" width="2" height="4" fill="#C69C6D" data-qoder-id="qel-rect-a4ef27dc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a4ef27dc&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:7}}"/>
    </svg>
  ),
  biome: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} data-qoder-id="qel-svg-a2fc763f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-a2fc763f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:101,&quot;column&quot;:5}}">
      <rect width="16" height="8" fill="#87CEEB" data-qoder-id="qel-rect-aaef314e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-aaef314e&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:7}}"/>
      <rect y="8" width="16" height="4" fill="#4CAF50" data-qoder-id="qel-rect-abef32e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-abef32e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:103,&quot;column&quot;:7}}"/>
      <rect y="12" width="16" height="4" fill="#795548" data-qoder-id="qel-rect-a8f16cbf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a8f16cbf&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:104,&quot;column&quot;:7}}"/>
      <rect x="3" y="4" width="2" height="4" fill="#4E342E" data-qoder-id="qel-rect-a7f16b2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a7f16b2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:7}}"/>
      <rect x="2" y="2" width="4" height="3" fill="#2E7D32" data-qoder-id="qel-rect-aaf16fe5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-aaf16fe5&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:106,&quot;column&quot;:7}}"/>
      <rect x="10" y="5" width="2" height="3" fill="#4E342E" data-qoder-id="qel-rect-a9f16e52" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a9f16e52&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:107,&quot;column&quot;:7}}"/>
      <rect x="9" y="3" width="4" height="3" fill="#2E7D32" data-qoder-id="qel-rect-a4f16673" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a4f16673&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:108,&quot;column&quot;:7}}"/>
    </svg>
  ),
  mob: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} data-qoder-id="qel-svg-a0feb1b0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-a0feb1b0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:112,&quot;column&quot;:5}}">
      <rect x="4" y="2" width="8" height="6" fill="#2C2C2C" data-qoder-id="qel-rect-a6f16999" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a6f16999&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:113,&quot;column&quot;:7}}"/>
      <rect x="4" y="4" width="3" height="3" fill="#A020F0" data-qoder-id="qel-rect-a5f16806" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a5f16806&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:7}}"/>
      <rect x="9" y="4" width="3" height="3" fill="#A020F0" data-qoder-id="qel-rect-b0f17957" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-b0f17957&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:115,&quot;column&quot;:7}}"/>
      <rect x="4" y="8" width="8" height="5" fill="#2C2C2C" data-qoder-id="qel-rect-aff177c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-aff177c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:116,&quot;column&quot;:7}}"/>
      <rect x="4" y="13" width="3" height="3" fill="#2C2C2C" data-qoder-id="qel-rect-9ee013e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-9ee013e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:117,&quot;column&quot;:7}}"/>
      <rect x="9" y="13" width="3" height="3" fill="#2C2C2C" data-qoder-id="qel-rect-9fe01573" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-9fe01573&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:118,&quot;column&quot;:7}}"/>
    </svg>
  ),
  redstone: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} data-qoder-id="qel-svg-9ded63d6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-9ded63d6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:122,&quot;column&quot;:5}}">
      <rect width="16" height="16" fill="#424242" data-qoder-id="qel-rect-a1e01899" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a1e01899&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:123,&quot;column&quot;:7}}"/>
      <rect x="2" y="7" width="12" height="2" fill="#D32F2F" data-qoder-id="qel-rect-a2e01a2c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a2e01a2c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:124,&quot;column&quot;:7}}"/>
      <rect x="7" y="2" width="2" height="12" fill="#D32F2F" data-qoder-id="qel-rect-a3e01bbf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a3e01bbf&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:125,&quot;column&quot;:7}}"/>
      <rect x="4" y="4" width="2" height="2" fill="#FF5252" data-qoder-id="qel-rect-a4e01d52" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a4e01d52&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:126,&quot;column&quot;:7}}"/>
      <rect x="10" y="10" width="2" height="2" fill="#FF5252" data-qoder-id="qel-rect-a5e01ee5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a5e01ee5&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:127,&quot;column&quot;:7}}"/>
    </svg>
  ),
  enchant: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} data-qoder-id="qel-svg-a3ed6d48" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-a3ed6d48&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:131,&quot;column&quot;:5}}">
      <rect x="3" y="3" width="10" height="10" fill="#4A148C" data-qoder-id="qel-rect-a7e0220b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a7e0220b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:132,&quot;column&quot;:7}}"/>
      <rect x="5" y="5" width="6" height="6" fill="#7B1FA2" data-qoder-id="qel-rect-a4e25be9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a4e25be9&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:133,&quot;column&quot;:7}}"/>
      <rect x="7" y="4" width="2" height="1" fill="#E1BEE7" data-qoder-id="qel-rect-a3e25a56" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a3e25a56&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:134,&quot;column&quot;:7}}"/>
      <rect x="7" y="11" width="2" height="1" fill="#E1BEE7" data-qoder-id="qel-rect-a2e258c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a2e258c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:135,&quot;column&quot;:7}}"/>
      <rect x="4" y="7" width="1" height="2" fill="#E1BEE7" data-qoder-id="qel-rect-a1e25730" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a1e25730&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:136,&quot;column&quot;:7}}"/>
      <rect x="11" y="7" width="1" height="2" fill="#E1BEE7" data-qoder-id="qel-rect-a8e26235" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a8e26235&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:137,&quot;column&quot;:7}}"/>
      <rect x="7" y="7" width="2" height="2" fill="#FFEB3B" data-qoder-id="qel-rect-a7e260a2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a7e260a2&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:138,&quot;column&quot;:7}}"/>
    </svg>
  ),
  blocks: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} data-qoder-id="qel-svg-a3efabdf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-a3efabdf&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:142,&quot;column&quot;:5}}">
      <rect x="0" y="0" width="8" height="8" fill="#795548" data-qoder-id="qel-rect-a5e25d7c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a5e25d7c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:143,&quot;column&quot;:7}}"/>
      <rect x="8" y="0" width="8" height="8" fill="#E0E0E0" data-qoder-id="qel-rect-ace26881" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-ace26881&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:144,&quot;column&quot;:7}}"/>
      <rect x="0" y="8" width="8" height="8" fill="#FFC107" data-qoder-id="qel-rect-abe266ee" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-abe266ee&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:145,&quot;column&quot;:7}}"/>
      <rect x="8" y="8" width="8" height="8" fill="#4CAF50" data-qoder-id="qel-rect-aae4a3f2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-aae4a3f2&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:146,&quot;column&quot;:7}}"/>
      <rect x="1" y="1" width="2" height="2" fill="#5D4037" data-qoder-id="qel-rect-abe4a585" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-abe4a585&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:147,&quot;column&quot;:7}}"/>
      <rect x="9" y="1" width="2" height="2" fill="#BDBDBD" data-qoder-id="qel-rect-a8e4a0cc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-a8e4a0cc&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;Unknown&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:148,&quot;column&quot;:7}}"/>
    </svg>
  ),
  /* ── Themed reading-course thumbnails ── */
  r_cave: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#3E2723"/>
      <rect x="4" y="3" width="8" height="10" fill="#1A1A1A"/>
      <rect x="5" y="4" width="6" height="9" fill="#0D0D0D"/>
      <rect x="3" y="5" width="1" height="2" fill="#5D4037"/>
      <rect x="12" y="4" width="1" height="3" fill="#5D4037"/>
      <rect x="7" y="6" width="2" height="4" fill="#8B6914"/>
      <rect x="7" y="5" width="2" height="1" fill="#FF9800"/>
      <rect x="6" y="4" width="1" height="1" fill="#FFEB3B"/>
      <rect x="9" y="4" width="1" height="1" fill="#FFEB3B"/>
    </svg>
  ),
  r_barn: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="6" width="12" height="8" fill="#C62828"/>
      <rect x="3" y="3" width="10" height="3" fill="#D32F2F"/>
      <rect x="7" y="1" width="2" height="2" fill="#EF5350"/>
      <rect x="6" y="8" width="4" height="6" fill="#5D4037"/>
      <rect x="3" y="7" width="3" height="3" fill="#EF9A9A"/>
      <rect x="10" y="7" width="3" height="3" fill="#EF9A9A"/>
      <rect x="7" y="8" width="2" height="1" fill="#3E2723"/>
    </svg>
  ),
  r_sheep: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="4" width="10" height="7" fill="#F5F5F5"/>
      <rect x="2" y="5" width="2" height="5" fill="#EEEEEE"/>
      <rect x="12" y="5" width="2" height="5" fill="#EEEEEE"/>
      <rect x="4" y="3" width="3" height="3" fill="#BDBDBD"/>
      <rect x="4" y="4" width="1" height="1" fill="#212121"/>
      <rect x="6" y="4" width="1" height="1" fill="#212121"/>
      <rect x="4" y="11" width="2" height="3" fill="#BDBDBD"/>
      <rect x="10" y="11" width="2" height="3" fill="#BDBDBD"/>
    </svg>
  ),
  r_minecart: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="12" width="12" height="2" fill="#795548"/>
      <rect x="1" y="13" width="2" height="1" fill="#9E9E9E"/>
      <rect x="13" y="13" width="2" height="1" fill="#9E9E9E"/>
      <rect x="3" y="5" width="10" height="7" fill="#757575"/>
      <rect x="4" y="6" width="8" height="5" fill="#9E9E9E"/>
      <rect x="5" y="7" width="6" height="3" fill="#616161"/>
      <rect x="2" y="11" width="1" height="2" fill="#BDBDBD"/>
      <rect x="13" y="11" width="1" height="2" fill="#BDBDBD"/>
    </svg>
  ),
  r_cherry: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="7" y="8" width="2" height="6" fill="#5D4037"/>
      <rect x="3" y="2" width="10" height="7" fill="#F48FB1"/>
      <rect x="4" y="1" width="8" height="2" fill="#F06292"/>
      <rect x="5" y="3" width="6" height="5" fill="#EC407A"/>
      <rect x="2" y="4" width="2" height="3" fill="#F8BBD0"/>
      <rect x="12" y="3" width="2" height="4" fill="#F8BBD0"/>
    </svg>
  ),
  r_fish: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#1565C0"/>
      <rect x="3" y="6" width="8" height="4" fill="#FF9800"/>
      <rect x="5" y="5" width="4" height="1" fill="#FFB74D"/>
      <rect x="5" y="10" width="4" height="1" fill="#FFB74D"/>
      <rect x="11" y="5" width="2" height="2" fill="#FF9800"/>
      <rect x="11" y="9" width="2" height="2" fill="#FF9800"/>
      <rect x="1" y="7" width="2" height="2" fill="#F57C00"/>
      <rect x="9" y="7" width="1" height="1" fill="#212121"/>
      <rect x="4" y="3" width="1" height="1" fill="#90CAF9"/>
      <rect x="10" y="12" width="1" height="1" fill="#90CAF9"/>
    </svg>
  ),
  r_house: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="8" y="1" width="1" height="2" fill="#4CAF50"/>
      <rect x="3" y="3" width="11" height="3" fill="#4CAF50"/>
      <rect x="5" y="2" width="7" height="2" fill="#388E3C"/>
      <rect x="3" y="6" width="11" height="8" fill="#8D6E63"/>
      <rect x="4" y="7" width="3" height="3" fill="#FFECB3"/>
      <rect x="10" y="7" width="3" height="3" fill="#FFECB3"/>
      <rect x="7" y="9" width="3" height="5" fill="#5D4037"/>
      <rect x="8" y="10" width="1" height="1" fill="#FFC107"/>
    </svg>
  ),
  r_bamboo: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#E8F5E9"/>
      <rect x="3" y="0" width="2" height="16" fill="#4CAF50"/>
      <rect x="7" y="0" width="2" height="16" fill="#66BB6A"/>
      <rect x="11" y="0" width="2" height="16" fill="#43A047"/>
      <rect x="3" y="4" width="2" height="1" fill="#2E7D32"/>
      <rect x="7" y="7" width="2" height="1" fill="#388E3C"/>
      <rect x="11" y="3" width="2" height="1" fill="#1B5E20"/>
      <rect x="11" y="10" width="2" height="1" fill="#1B5E20"/>
      <rect x="5" y="2" width="2" height="2" fill="#81C784"/>
      <rect x="9" y="5" width="2" height="2" fill="#A5D6A7"/>
      <rect x="1" y="6" width="2" height="2" fill="#81C784"/>
    </svg>
  ),
  r_portal: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#1A1A1A"/>
      <rect x="3" y="1" width="10" height="14" fill="#311B92"/>
      <rect x="3" y="1" width="2" height="14" fill="#37474F"/>
      <rect x="11" y="1" width="2" height="14" fill="#37474F"/>
      <rect x="3" y="1" width="10" height="2" fill="#37474F"/>
      <rect x="3" y="13" width="10" height="2" fill="#37474F"/>
      <rect x="5" y="3" width="6" height="10" fill="#7C4DFF"/>
      <rect x="6" y="5" width="4" height="6" fill="#B388FF"/>
      <rect x="7" y="7" width="2" height="2" fill="#E8EAF6"/>
    </svg>
  ),
  r_diamond: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#37474F"/>
      <rect x="6" y="2" width="4" height="2" fill="#4DD0E1"/>
      <rect x="4" y="4" width="8" height="2" fill="#26C6DA"/>
      <rect x="3" y="6" width="10" height="2" fill="#00BCD4"/>
      <rect x="4" y="8" width="8" height="2" fill="#00ACC1"/>
      <rect x="5" y="10" width="6" height="2" fill="#0097A7"/>
      <rect x="6" y="12" width="4" height="1" fill="#00838F"/>
      <rect x="7" y="13" width="2" height="1" fill="#006064"/>
      <rect x="7" y="4" width="2" height="2" fill="#80DEEA"/>
      <rect x="5" y="6" width="2" height="2" fill="#80DEEA"/>
    </svg>
  ),
  r_horse: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="5" width="10" height="5" fill="#8D6E63"/>
      <rect x="10" y="2" width="4" height="4" fill="#795548"/>
      <rect x="13" y="3" width="1" height="1" fill="#212121"/>
      <rect x="10" y="1" width="2" height="2" fill="#5D4037"/>
      <rect x="14" y="4" width="1" height="2" fill="#A1887F"/>
      <rect x="4" y="10" width="2" height="4" fill="#6D4C41"/>
      <rect x="10" y="10" width="2" height="4" fill="#6D4C41"/>
      <rect x="2" y="4" width="2" height="6" fill="#A1887F"/>
      <rect x="11" y="2" width="3" height="1" fill="#3E2723"/>
    </svg>
  ),
  r_stronghold: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#78909C"/>
      <rect x="0" y="0" width="4" height="4" fill="#607D8B"/>
      <rect x="8" y="0" width="4" height="4" fill="#607D8B"/>
      <rect x="4" y="4" width="4" height="4" fill="#546E7A"/>
      <rect x="12" y="4" width="4" height="4" fill="#546E7A"/>
      <rect x="0" y="8" width="4" height="4" fill="#546E7A"/>
      <rect x="8" y="8" width="4" height="4" fill="#607D8B"/>
      <rect x="4" y="12" width="4" height="4" fill="#607D8B"/>
      <rect x="12" y="12" width="4" height="4" fill="#546E7A"/>
      <rect x="6" y="5" width="4" height="6" fill="#263238"/>
      <rect x="7" y="4" width="2" height="1" fill="#37474F"/>
    </svg>
  ),
  r_ender: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#1A0033"/>
      <rect x="4" y="4" width="8" height="8" fill="#1B5E20"/>
      <rect x="5" y="5" width="6" height="6" fill="#2E7D32"/>
      <rect x="6" y="6" width="4" height="4" fill="#4CAF50"/>
      <rect x="7" y="7" width="2" height="2" fill="#212121"/>
      <rect x="3" y="2" width="1" height="1" fill="#CE93D8"/>
      <rect x="12" y="3" width="1" height="1" fill="#CE93D8"/>
      <rect x="2" y="12" width="1" height="1" fill="#CE93D8"/>
      <rect x="13" y="11" width="1" height="1" fill="#CE93D8"/>
      <rect x="7" y="1" width="1" height="1" fill="#BA68C8"/>
    </svg>
  ),
  r_pickaxe: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="2" width="6" height="2" fill="#90A4AE"/>
      <rect x="3" y="3" width="2" height="2" fill="#78909C"/>
      <rect x="9" y="3" width="2" height="2" fill="#78909C"/>
      <rect x="7" y="4" width="2" height="2" fill="#B0BEC5"/>
      <rect x="7" y="6" width="2" height="8" fill="#8D6E63"/>
      <rect x="6" y="8" width="1" height="1" fill="#6D4C41"/>
      <rect x="9" y="8" width="1" height="1" fill="#6D4C41"/>
    </svg>
  ),
  r_chest: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="4" width="12" height="10" fill="#8D6E63"/>
      <rect x="3" y="5" width="10" height="4" fill="#A1887F"/>
      <rect x="3" y="9" width="10" height="4" fill="#795548"/>
      <rect x="2" y="8" width="12" height="2" fill="#6D4C41"/>
      <rect x="7" y="7" width="2" height="3" fill="#FFC107"/>
      <rect x="7" y="8" width="2" height="1" fill="#FFD54F"/>
      <rect x="2" y="3" width="12" height="2" fill="#6D4C41"/>
    </svg>
  ),
  /* ── Vocabulary-only thumbnails (v_*) ──
   * Each vocabulary course gets a distinct pixel icon so the Vocabulary list
   * does not visually collide with Reading. */
  v_hostile: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="2" width="10" height="12" fill="#2E7D32"/>
      <rect x="3" y="2" width="10" height="2" fill="#1B5E20"/>
      <rect x="4" y="5" width="3" height="3" fill="#212121"/>
      <rect x="9" y="5" width="3" height="3" fill="#212121"/>
      <rect x="5" y="6" width="1" height="1" fill="#FF1744"/>
      <rect x="10" y="6" width="1" height="1" fill="#FF1744"/>
      <rect x="5" y="10" width="6" height="2" fill="#1B5E20"/>
      <rect x="6" y="11" width="1" height="1" fill="#212121"/>
      <rect x="8" y="11" width="1" height="1" fill="#212121"/>
      <rect x="10" y="11" width="1" height="1" fill="#212121"/>
    </svg>
  ),
  v_animal: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="3" y="4" width="10" height="8" fill="#F48FB1"/>
      <rect x="3" y="4" width="10" height="2" fill="#EC407A"/>
      <rect x="2" y="5" width="1" height="3" fill="#F8BBD0"/>
      <rect x="13" y="5" width="1" height="3" fill="#F8BBD0"/>
      <rect x="5" y="7" width="2" height="2" fill="#212121"/>
      <rect x="9" y="7" width="2" height="2" fill="#212121"/>
      <rect x="6" y="10" width="1" height="1" fill="#AD1457"/>
      <rect x="9" y="10" width="1" height="1" fill="#AD1457"/>
      <rect x="4" y="12" width="2" height="2" fill="#F06292"/>
      <rect x="10" y="12" width="2" height="2" fill="#F06292"/>
    </svg>
  ),
  v_tools: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="2" y="6" width="12" height="8" fill="#FF7043"/>
      <rect x="2" y="6" width="12" height="2" fill="#E64A19"/>
      <rect x="6" y="3" width="4" height="3" fill="#BF360C"/>
      <rect x="7" y="4" width="2" height="2" fill="#FF8A65"/>
      <rect x="3" y="9" width="4" height="2" fill="#90A4AE"/>
      <rect x="3" y="8" width="2" height="1" fill="#CFD8DC"/>
      <rect x="9" y="9" width="4" height="2" fill="#FFC107"/>
      <rect x="11" y="8" width="2" height="1" fill="#FFD54F"/>
      <rect x="7" y="12" width="2" height="2" fill="#5D4037"/>
    </svg>
  ),
  v_resources: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#37474F"/>
      <rect x="1" y="1" width="6" height="6" fill="#FFC107"/>
      <rect x="2" y="2" width="3" height="3" fill="#FFD54F"/>
      <rect x="9" y="1" width="6" height="6" fill="#26C6DA"/>
      <rect x="10" y="2" width="3" height="3" fill="#80DEEA"/>
      <rect x="1" y="9" width="6" height="6" fill="#43A047"/>
      <rect x="2" y="10" width="3" height="3" fill="#A5D6A7"/>
      <rect x="9" y="9" width="6" height="6" fill="#D32F2F"/>
      <rect x="10" y="10" width="3" height="3" fill="#FF8A80"/>
    </svg>
  ),
  v_food: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="5" width="8" height="9" fill="#E53935"/>
      <rect x="3" y="6" width="1" height="6" fill="#C62828"/>
      <rect x="12" y="6" width="1" height="6" fill="#C62828"/>
      <rect x="5" y="4" width="6" height="2" fill="#EF5350"/>
      <rect x="5" y="6" width="3" height="3" fill="#FF8A80"/>
      <rect x="7" y="2" width="1" height="3" fill="#5D4037"/>
      <rect x="8" y="1" width="3" height="2" fill="#43A047"/>
      <rect x="10" y="3" width="1" height="1" fill="#2E7D32"/>
    </svg>
  ),
  v_nature: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#B3E5FC"/>
      <rect x="11" y="1" width="4" height="4" fill="#FFEB3B"/>
      <rect x="12" y="2" width="2" height="2" fill="#FFF176"/>
      <rect x="0" y="7" width="6" height="4" fill="#607D8B"/>
      <rect x="1" y="6" width="4" height="1" fill="#455A64"/>
      <rect x="2" y="5" width="2" height="1" fill="#90A4AE"/>
      <rect x="5" y="8" width="7" height="3" fill="#78909C"/>
      <rect x="7" y="6" width="3" height="2" fill="#90A4AE"/>
      <rect x="0" y="11" width="16" height="3" fill="#43A047"/>
      <rect x="0" y="14" width="16" height="2" fill="#5D4037"/>
    </svg>
  ),
  v_dimension: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#0D0D0D"/>
      <rect x="1" y="1" width="7" height="7" fill="#7C4DFF"/>
      <rect x="2" y="2" width="5" height="5" fill="#B388FF"/>
      <rect x="3" y="3" width="3" height="3" fill="#311B92"/>
      <rect x="8" y="8" width="7" height="7" fill="#FBC02D"/>
      <rect x="9" y="9" width="5" height="5" fill="#FFEE58"/>
      <rect x="10" y="10" width="3" height="3" fill="#F57F17"/>
      <rect x="7" y="7" width="2" height="2" fill="#FFFFFF"/>
    </svg>
  ),
  v_crafting: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="1" y="1" width="14" height="14" fill="#5D4037"/>
      <rect x="2" y="2" width="4" height="4" fill="#A1887F"/>
      <rect x="6" y="2" width="4" height="4" fill="#8D6E63"/>
      <rect x="10" y="2" width="4" height="4" fill="#A1887F"/>
      <rect x="2" y="6" width="4" height="4" fill="#8D6E63"/>
      <rect x="6" y="6" width="4" height="4" fill="#A1887F"/>
      <rect x="10" y="6" width="4" height="4" fill="#8D6E63"/>
      <rect x="2" y="10" width="4" height="4" fill="#A1887F"/>
      <rect x="6" y="10" width="4" height="4" fill="#8D6E63"/>
      <rect x="10" y="10" width="4" height="4" fill="#A1887F"/>
      <rect x="6" y="6" width="4" height="4" fill="#FFC107"/>
      <rect x="7" y="7" width="2" height="2" fill="#FFEB3B"/>
    </svg>
  ),
  v_action: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#FFF3E0"/>
      <rect x="7" y="1" width="3" height="3" fill="#FFB74D"/>
      <rect x="6" y="4" width="5" height="4" fill="#1E88E5"/>
      <rect x="4" y="5" width="2" height="1" fill="#1E88E5"/>
      <rect x="11" y="6" width="2" height="1" fill="#1E88E5"/>
      <rect x="5" y="8" width="3" height="4" fill="#1976D2"/>
      <rect x="9" y="8" width="3" height="4" fill="#1976D2"/>
      <rect x="4" y="12" width="2" height="2" fill="#FFB74D"/>
      <rect x="11" y="12" width="3" height="2" fill="#FFB74D"/>
      <rect x="0" y="7" width="3" height="1" fill="#FFA726"/>
      <rect x="0" y="9" width="4" height="1" fill="#FFA726"/>
      <rect x="0" y="11" width="3" height="1" fill="#FFA726"/>
    </svg>
  ),
  v_adjective: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#ECEFF1"/>
      <rect x="2" y="3" width="12" height="10" fill="#FAFAFA"/>
      <rect x="2" y="3" width="12" height="2" fill="#CFD8DC"/>
      <rect x="3" y="6" width="3" height="3" fill="#E53935"/>
      <rect x="7" y="6" width="3" height="3" fill="#43A047"/>
      <rect x="11" y="6" width="2" height="3" fill="#1E88E5"/>
      <rect x="3" y="10" width="3" height="2" fill="#FFC107"/>
      <rect x="7" y="10" width="3" height="2" fill="#8E24AA"/>
      <rect x="11" y="10" width="2" height="2" fill="#FF7043"/>
      <rect x="6" y="1" width="4" height="2" fill="#90A4AE"/>
    </svg>
  ),
  // 火把：棕色木柄 + 橙红色火焰 + 黄色高光（Adventure & Survival）
  v_adventure: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="7" y="8" width="2" height="7" fill="#6D4C41"/>
      <rect x="7" y="14" width="2" height="1" fill="#3E2723"/>
      <rect x="6" y="7" width="4" height="2" fill="#8D6E63"/>
      <rect x="5" y="4" width="6" height="4" fill="#FF6F00"/>
      <rect x="6" y="3" width="4" height="3" fill="#FF8F00"/>
      <rect x="6" y="2" width="2" height="2" fill="#FBC02D"/>
      <rect x="7" y="1" width="1" height="2" fill="#FFEE58"/>
      <rect x="4" y="6" width="1" height="1" fill="#E65100"/>
      <rect x="11" y="6" width="1" height="1" fill="#E65100"/>
      <rect x="7" y="5" width="2" height="1" fill="#FFFFFF"/>
    </svg>
  ),
  // 砖墙 + 锥子（Building & Crafting）
  v_building: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect width="16" height="16" fill="#FFF3E0"/>
      <rect x="1" y="7" width="14" height="8" fill="#BF5F4A"/>
      <rect x="1" y="7" width="14" height="1" fill="#8D6E63"/>
      <rect x="1" y="10" width="14" height="1" fill="#8D6E63"/>
      <rect x="1" y="13" width="14" height="1" fill="#8D6E63"/>
      <rect x="4" y="8" width="1" height="2" fill="#8D6E63"/>
      <rect x="9" y="8" width="1" height="2" fill="#8D6E63"/>
      <rect x="2" y="11" width="1" height="2" fill="#8D6E63"/>
      <rect x="7" y="11" width="1" height="2" fill="#8D6E63"/>
      <rect x="12" y="11" width="1" height="2" fill="#8D6E63"/>
      <rect x="10" y="2" width="3" height="1" fill="#9E9E9E"/>
      <rect x="9" y="3" width="5" height="2" fill="#BDBDBD"/>
      <rect x="11" y="5" width="1" height="2" fill="#5D4037"/>
    </svg>
  ),
  // 地球：蓝色海洋 + 绿色陆地（Nature & World）
  v_world: (
    <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
      <rect x="4" y="2" width="8" height="1" fill="#1976D2"/>
      <rect x="3" y="3" width="10" height="1" fill="#1E88E5"/>
      <rect x="2" y="4" width="12" height="8" fill="#2196F3"/>
      <rect x="3" y="12" width="10" height="1" fill="#1E88E5"/>
      <rect x="4" y="13" width="8" height="1" fill="#1976D2"/>
      <rect x="4" y="5" width="3" height="2" fill="#43A047"/>
      <rect x="5" y="4" width="2" height="1" fill="#43A047"/>
      <rect x="9" y="6" width="4" height="3" fill="#43A047"/>
      <rect x="10" y="5" width="2" height="1" fill="#43A047"/>
      <rect x="3" y="9" width="2" height="2" fill="#43A047"/>
      <rect x="7" y="10" width="3" height="2" fill="#43A047"/>
      <rect x="11" y="10" width="2" height="1" fill="#43A047"/>
      <rect x="5" y="6" width="1" height="1" fill="#FFFFFF"/>
    </svg>
  )
}

// Thumbnail resolution is centralized in `src/lib/courseThumbnails.js` so that
// reading/vocabulary courses without a hand-curated entry still pick a themed
// icon based on their id/title keywords (instead of all collapsing to blocks).

const StarRating = ({ level, ...qoderProps }) => (
  <div className={["stars", qoderProps?.className].filter(Boolean).join(" ")} style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
    {[1,2,3].map(s => (
      <svg key={s} className={`star ${s <= level ? 'star-filled' : 'star-empty'}`} width="14" height="14" viewBox="0 0 24 24" data-qoder-id="qel-svg-bc049587" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-bc049587&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;StarRating&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:156,&quot;column&quot;:7}}">
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill="currentColor" data-qoder-id="qel-path-f697a396" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-f697a396&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;StarRating&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:157,&quot;column&quot;:9}}"/>
      </svg>
    ))}
  </div>
)

export default function CourseList(qoderProps) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const { courses, coursesLoaded, userCourseProgress, profile } = useAuth()

  const filters = [
    { id: 'all', label: 'All Courses' },
    { id: 'listening', label: 'Listening' },
    { id: 'reading', label: 'Reading' },
    { id: 'vocabulary', label: 'Vocabulary' }
  ]

  const filteredCourses = (courses || []).filter(c => {
    if (activeFilter !== 'all' && c.kind !== activeFilter) return false
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      return (c.title || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)
    }
    return true
  })

  const userLevel = profile?.level ?? 1

  // ─────────────── "For You" recommendation engine ─────────────────────
  // Light-weight scoring (runs in-memory on the already-loaded catalog, no
  // extra requests). Strategy:
  //   1) Resume-first: courses with progress in (0, 100) get a big boost.
  //   2) Diversity: bias towards kinds the user has touched LEAST so a
  //      listening-heavy user gets pushed towards reading/vocabulary.
  //   3) Level fit: prefer courses unlocked at or just below the user's level.
  //   4) Tie-break by lower difficulty (newcomer-friendly).
  // Excluded: locked courses, fully completed courses.
  const recommended = useMemo(() => {
    if (!coursesLoaded || !Array.isArray(courses) || courses.length === 0) return []

    // Count kinds the user has interacted with (any progress > 0).
    const kindCounts = {}
    for (const c of courses) {
      const r = userCourseProgress?.[c.id]
      const p = computeCoursePercent(c.lessons_count, r)
      if (p > 0) kindCounts[c.kind] = (kindCounts[c.kind] || 0) + 1
    }

    const scored = []
    for (const c of courses) {
      const locked = (c.unlock_level || 1) > userLevel
      if (locked) continue
      const r = userCourseProgress?.[c.id]
      const progress = computeCoursePercent(c.lessons_count, r)
      if (progress === 100) continue

      let score = 0
      if (progress > 0) score += 50 // resume-first signal
      const kindCount = kindCounts[c.kind] || 0
      score += Math.max(0, 5 - kindCount) * 4 // diversity bonus
      const levelGap = userLevel - (c.unlock_level || 1)
      if (levelGap >= 0 && levelGap <= 2) score += 10 // sweet-spot level
      score -= (c.difficulty || 1) * 0.5 // newcomer tiebreaker
      scored.push({ course: c, score, progress })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.slice(0, RECOMMEND_SLOTS)
  }, [courses, coursesLoaded, userCourseProgress, userLevel])

  // The strip is only useful when the user has not narrowed the list themselves.
  const showRecommendStrip =
    activeFilter === 'all' && !searchQuery.trim() && recommended.length > 0

  return (
    <div data-component="course-list-page" style={{ ...({ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }), ...(qoderProps?.style) }} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Page Header */}
      <div data-qoder-id="qel-div-5ca20828" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5ca20828&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:158,&quot;column&quot;:7}}">
        <h2 style={{ marginBottom: 'var(--space-sm)' }} data-qoder-id="qel-h2-d1fa66df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h2-d1fa66df&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;h2&quot;,&quot;loc&quot;:{&quot;line&quot;:159,&quot;column&quot;:9}}">Explore Courses</h2>
        <p style={{ fontSize: '14px', color: 'var(--color-muted)' }} data-qoder-id="qel-p-efbe3eb6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-efbe3eb6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:160,&quot;column&quot;:9}}">
          Learn English through Minecraft adventures
        </p>
      </div>

      {/* For You strip — only shown on the unfiltered, unsearched view */}
      {showRecommendStrip && (
        <div data-component="recommend-strip" style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-md)',
          boxShadow: 'var(--shadow-card)',
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            marginBottom: 'var(--space-sm)',
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-title)', letterSpacing: '0.02em' }}>
              For You
            </h3>
            <span style={{ fontSize: 11, color: 'var(--color-muted)', fontWeight: 600 }}>
              Picked from your level &amp; progress
            </span>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${recommended.length}, minmax(0, 1fr))`,
            gap: 'var(--space-sm)',
          }}>
            {recommended.map(({ course, progress }) => {
              const route = `/course/${course.id}`
              const accentColor = KIND_COLOR[course.kind] || 'var(--tile-blue)'
              const isResume = progress > 0
              return (
                <Link
                  key={course.id}
                  to={route}
                  style={{
                    display: 'flex', flexDirection: 'column',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--color-surface-soft)',
                    borderLeft: `4px solid ${accentColor}`,
                    color: 'var(--color-title)',
                    textDecoration: 'none',
                    minHeight: 64,
                    gap: 4,
                  }}
                >
                  <span style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: isResume ? 'var(--color-grass-active)' : 'var(--color-muted)',
                  }}>
                    {isResume ? `Continue · ${progress}%` : course.kind}
                  </span>
                  <span style={{
                    fontSize: 13, fontWeight: 700, lineHeight: 1.25,
                    overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {course.title || course.id}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div style={{ position: 'relative' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <circle cx="11" cy="11" r="7" stroke="var(--color-muted)" strokeWidth="2" />
          <path d="M16 16L21 21" stroke="var(--color-muted)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 12px 10px 36px',
            borderRadius: 'var(--radius-lg)',
            border: '2px solid var(--color-surface-soft)',
            background: 'var(--color-surface)',
            fontSize: 14,
            fontFamily: 'var(--font-body)',
            color: 'var(--color-title)',
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--color-grass)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--color-surface-soft)'}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              border: 'none', background: 'var(--color-surface-soft)', borderRadius: '50%',
              width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, fontSize: 12, color: 'var(--color-muted)', lineHeight: 1,
            }}
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div data-component="filter-chips" style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }} data-qoder-id="qel-filter-chips-52ed0fac" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-filter-chips-52ed0fac&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;filter-chips&quot;,&quot;loc&quot;:{&quot;line&quot;:166,&quot;column&quot;:7}}">
        {filters.map(f => (
          <button
            key={f.id}
            className={`chip ${activeFilter === f.id ? 'chip-active' : 'chip-inactive'}`}
            onClick={() => setActiveFilter(f.id)}
           data-qoder-id="qel-button-b76acf65" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-b76acf65&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:168,&quot;column&quot;:11}}">
            {f.label}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      <div data-component="course-grid" className="course-grid" data-qoder-id="qel-course-grid-7ec60c7f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-course-grid-7ec60c7f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;course-grid&quot;,&quot;loc&quot;:{&quot;line&quot;:179,&quot;column&quot;:7}}">
        {!coursesLoaded ? (
          [0, 1, 2, 3].map(i => <SkeletonCard key={i}  data-qoder-id="qel-skeletoncard-3a9aa9e1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-skeletoncard-3a9aa9e1&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;skeletoncard&quot;,&quot;loc&quot;:{&quot;line&quot;:185,&quot;column&quot;:33}}"/>)
        ) : filteredCourses.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: 'var(--space-lg)',
            textAlign: 'center',
            color: 'var(--color-muted)',
            fontSize: '13px'
          }} data-qoder-id="qel-div-61954414" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-61954414&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:187,&quot;column&quot;:11}}">
            No courses available yet — check back soon!
          </div>
        ) : (
          filteredCourses.map((course, idx) => {
            const progressRow = userCourseProgress?.[course.id]
            const progress = computeCoursePercent(course.lessons_count, progressRow)
            const locked = (course.unlock_level || 1) > userLevel
            const route = `/course/${course.id}`
            const accentColor = KIND_COLOR[course.kind] || 'var(--tile-blue)'
            const tagColor = KIND_TAG_COLOR[course.kind] || 'var(--tile-blue)'
            const xp = course.xp_reward || 0
            const duration = `${course.est_minutes || 5} min`
            const thumbnail = resolveThumbnailKey(course)
            const isComplete = progress === 100 && !locked
            const card = (
              <Link
                key={course.id}
                to={route}
                style={{ textDecoration: 'none', pointerEvents: locked ? 'none' : 'auto' }}
                aria-disabled={locked || undefined}
               data-qoder-id="qel-link-091be99d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-link-091be99d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;link&quot;,&quot;loc&quot;:{&quot;line&quot;:209,&quot;column&quot;:15}}">
                <div className="card" style={{
                  cursor: locked ? 'default' : 'pointer',
                  opacity: locked ? 0.55 : 1,
                  position: 'relative',
                  overflow: 'hidden'
                }} data-qoder-id="qel-card-4c337605" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-card-4c337605&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;card&quot;,&quot;loc&quot;:{&quot;line&quot;:215,&quot;column&quot;:17}}">
                  {/* Color accent top */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 4,
                    background: accentColor,
                    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
                  }}  data-qoder-id="qel-div-5e953f5b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5e953f5b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:222,&quot;column&quot;:19}}"/>

                  {/* Thumbnail + Info */}
                  <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-start' }} data-qoder-id="qel-div-5d953dc8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5d953dc8&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:229,&quot;column&quot;:19}}">
                    <div style={{
                      width: 56, height: 56, borderRadius: 'var(--radius-md)',
                      background: 'var(--color-surface-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      overflow: 'hidden'
                    }} data-qoder-id="qel-div-5c953c35" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5c953c35&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:230,&quot;column&quot;:21}}">
                      {course.kind === 'listening' && course.yt_video_id ? (
                        <img
                          src={`https://i.ytimg.com/vi/${course.yt_video_id}/hqdefault.jpg`}
                          alt={course.title}
                          loading="lazy"
                          width={56}
                          height={56}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            // Fallback to mqdefault if hqdefault is unavailable; final
                            // fallback to the pixel-art thumbnail by hiding the img.
                            const el = e.currentTarget
                            if (!el.dataset.fallback) {
                              el.dataset.fallback = '1'
                              el.src = `https://i.ytimg.com/vi/${course.yt_video_id}/mqdefault.jpg`
                            } else {
                              el.style.display = 'none'
                            }
                          }}
                        />
                      ) : (
                        PixelThumbnails[thumbnail] || PixelThumbnails.blocks
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }} data-qoder-id="qel-div-5b953aa2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5b953aa2&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:238,&quot;column&quot;:21}}">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }} data-qoder-id="qel-div-5e9300c4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5e9300c4&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:239,&quot;column&quot;:23}}">
                        <span style={{
                          fontSize: '10px', fontWeight: 700,
                          color: tagColor,
                          textTransform: 'uppercase', letterSpacing: '0.06em'
                        }} data-qoder-id="qel-span-12c93f3b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-12c93f3b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:240,&quot;column&quot;:25}}">
                          {course.kind}
                        </span>
                        <StarRating level={course.difficulty || 1}  data-qoder-id="qel-starrating-9cec3a68" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-starrating-9cec3a68&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;starrating&quot;,&quot;loc&quot;:{&quot;line&quot;:247,&quot;column&quot;:25}}"/>
                      </div>
                      <h4 style={{ fontSize: '14px', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} data-qoder-id="qel-h4-9aa62f11" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-h4-9aa62f11&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;h4&quot;,&quot;loc&quot;:{&quot;line&quot;:249,&quot;column&quot;:23}}">
                        {course.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--color-muted)', marginBottom: 'var(--space-sm)' }} data-qoder-id="qel-p-e79b9fdc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-p-e79b9fdc&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;p&quot;,&quot;loc&quot;:{&quot;line&quot;:252,&quot;column&quot;:23}}">
                        {course.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress + Meta */}
                  <div style={{ marginTop: 'var(--space-sm)' }} data-qoder-id="qel-div-5b92fc0b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5b92fc0b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:259,&quot;column&quot;:19}}">
                    {progress > 0 && !locked && (
                      <div style={{ marginBottom: 'var(--space-sm)' }} data-qoder-id="qel-div-5c92fd9e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5c92fd9e&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:261,&quot;column&quot;:23}}">
                        <div className="progress-bar" style={{ height: 6 }} data-qoder-id="qel-progress-bar-9b9f4bf1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-progress-bar-9b9f4bf1&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;progress-bar&quot;,&quot;loc&quot;:{&quot;line&quot;:262,&quot;column&quot;:25}}">
                          <div className="progress-fill" style={{
                            width: `${progress}%`,
                            background: progress === 100 ? 'var(--color-success)' : 'var(--color-grass)'
                          }}  data-qoder-id="qel-progress-fill-09d95c18" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-progress-fill-09d95c18&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;progress-fill&quot;,&quot;loc&quot;:{&quot;line&quot;:263,&quot;column&quot;:27}}"/>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} data-qoder-id="qel-div-5792f5bf" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-5792f5bf&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:270,&quot;column&quot;:21}}">
                      <span style={{
                        fontSize: '11px', fontWeight: 700,
                        color: locked ? 'var(--color-muted)' : 'var(--color-xp)',
                        background: locked ? 'var(--color-surface-soft)' : 'rgba(123,31,162,0.08)',
                        padding: '2px 8px', borderRadius: 'var(--radius-pill)'
                      }} data-qoder-id="qel-span-9fa8d950" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-9fa8d950&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:271,&quot;column&quot;:23}}">
                        {locked ? `Lv.${course.unlock_level} required` : `+${xp} XP`}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--color-muted)' }} data-qoder-id="qel-span-a0a8dae3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-a0a8dae3&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:279,&quot;column&quot;:23}}">
                        {duration}
                      </span>
                    </div>
                  </div>

                  {/* Lock overlay */}
                  {locked && (
                    <div style={{ position: 'absolute', top: 12, right: 12 }} data-qoder-id="qel-div-4e01835a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-4e01835a&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:287,&quot;column&quot;:21}}">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-muted)" data-qoder-id="qel-svg-5835dda1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-5835dda1&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:288,&quot;column&quot;:23}}">
                        <path d="M12 2C9.24 2 7 4.24 7 7V10H5V22H19V10H17V7C17 4.24 14.76 2 12 2ZM12 4C13.66 4 15 5.34 15 7V10H9V7C9 5.34 10.34 4 12 4Z"  data-qoder-id="qel-path-c1e2a77e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-c1e2a77e&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:289,&quot;column&quot;:25}}"/>
                      </svg>
                    </div>
                  )}

                  {/* Completed badge */}
                  {isComplete && (
                    <div style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 24, height: 24, borderRadius: '50%',
                      background: 'var(--color-success)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} data-qoder-id="qel-div-49017b7b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-49017b7b&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:296,&quot;column&quot;:21}}">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" data-qoder-id="qel-svg-5b35e25a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-5b35e25a&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:302,&quot;column&quot;:23}}">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"  data-qoder-id="qel-path-c0e2a5eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-c0e2a5eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/CourseList.jsx&quot;,&quot;componentName&quot;:&quot;CourseList&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:303,&quot;column&quot;:25}}"/>
                      </svg>
                    </div>
                  )}
                </div>
              </Link>
            )
            // Render the first viewport's worth of cards eagerly; everything
            // else is gated behind a viewport-intersect placeholder so the
            // initial paint stays light even with 60+ entries.
            if (idx < EAGER_RENDER_COUNT) return <div key={course.id}>{card}</div>
            return (
              <LazyMount key={course.id} minHeight={132}>
                {card}
              </LazyMount>
            )
          })
        )}
      </div>
    </div>
  )
}
