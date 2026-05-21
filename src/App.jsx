import { Routes, Route, NavLink, Link, Navigate, useLocation } from 'react-router-dom'
import { useState, lazy, Suspense } from 'react'
import Home from './pages/Home'
import CourseList from './pages/CourseList'
import CourseDetail from './pages/CourseDetail'
import VideoLesson from './pages/VideoLesson'
import ReadingPractice from './pages/ReadingPractice'
import VocabPractice from './pages/VocabPractice'
import Achievements from './pages/Achievements'
import Credits from './pages/Credits'
import Login from './pages/Login'
import RequireAuth from './auth/RequireAuth'
// Admin 路由懒加载：普通用户从不访问 /admin/*，不该让它们出现在首屏 bundle。
// 配合 vite.config.js 的 manualChunks （admin-pages chunk）一起生效。
const RequireAdmin = lazy(() => import('./admin/RequireAdmin'))
const AdminCourseList = lazy(() => import('./admin/AdminCourseList'))
const AdminCourseEditor = lazy(() => import('./admin/AdminCourseEditor'))
const AdminRewardsList = lazy(() => import('./admin/AdminRewardsList'))
const AdminRewardsEditor = lazy(() => import('./admin/AdminRewardsEditor'))
const AdminQuestsList = lazy(() => import('./admin/AdminQuestsList'))
const AdminQuestsEditor = lazy(() => import('./admin/AdminQuestsEditor'))
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import VocabBook from './pages/VocabBook'
import VocabReview from './pages/VocabReview'
import StatsPage from './pages/StatsPage'
import NetworkStatus from './components/NetworkStatus'
import { useAuth } from './auth/AuthContext'

const AdminLoading = () => (
  <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)', fontSize: 14 }}>
    Loading admin…
  </div>
)

/* Pixel-art SVG icons for navigation */
const HomeIcon = (qoderProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={qoderProps?.style} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
    <path d="M3 12L12 4L21 12V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V12Z" fill="currentColor" opacity="0.2" data-qoder-id="qel-path-99662713" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-99662713&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;HomeIcon&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:11,&quot;column&quot;:5}}"/>
    <path d="M3 12L12 4L21 12M5 10V20H10V14H14V20H19V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-98662580" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-98662580&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;HomeIcon&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:12,&quot;column&quot;:5}}"/>
  </svg>
)

const BookIcon = (qoderProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={qoderProps?.style} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
    <path d="M4 4H8C9.10457 4 10 4.89543 10 6V20C10 18.8954 9.10457 18 8 18H4V4Z" fill="currentColor" opacity="0.2" data-qoder-id="qel-path-050f9818" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-050f9818&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;BookIcon&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:18,&quot;column&quot;:5}}"/>
    <path d="M4 4H8C9.10457 4 10 4.89543 10 6V20M4 4V18H8C9.10457 18 10 18.8954 10 20M4 4H4.5M10 20V6M10 20H14M10 6C10 4.89543 10.8954 4 12 4H20V18H14C12.8954 18 12 18.8954 12 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-080f9cd1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-080f9cd1&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;BookIcon&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:19,&quot;column&quot;:5}}"/>
  </svg>
)

const TrophyIcon = (qoderProps) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={qoderProps?.style} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
    <path d="M8 21H16M12 17V21M7 4H17V8C17 11.3137 14.7614 14 12 14C9.23858 14 7 11.3137 7 8V4Z" fill="currentColor" opacity="0.2" data-qoder-id="qel-path-e6f60eb8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-e6f60eb8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;TrophyIcon&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:25,&quot;column&quot;:5}}"/>
    <path d="M8 21H16M12 17V21M7 4H17V8C17 11.3137 14.7614 14 12 14C9.23858 14 7 11.3137 7 8V4ZM17 5H19C19.5523 5 20 5.44772 20 6V7C20 8.65685 18.6569 10 17 10M7 5H5C4.44772 5 4 5.44772 4 6V7C4 8.65685 5.34315 10 7 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-e7f6104b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-e7f6104b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;TrophyIcon&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:26,&quot;column&quot;:5}}"/>
  </svg>
)

/* Pixel-style Steve avatar */
const SteveAvatar = (qoderProps) => (
  <svg width="28" height="28" viewBox="0 0 16 16" className={["pixel-block", qoderProps?.className].filter(Boolean).join(" ")} xmlns="http://www.w3.org/2000/svg" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
    <rect x="3" y="0" width="10" height="4" fill="#6B4226" data-qoder-id="qel-rect-bf8b6ddd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-bf8b6ddd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:33,&quot;column&quot;:5}}"/>
    <rect x="2" y="4" width="12" height="4" fill="#C69C6D" data-qoder-id="qel-rect-bc8b6924" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-bc8b6924&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:34,&quot;column&quot;:5}}"/>
    <rect x="4" y="4" width="2" height="2" fill="#FFFFFF" data-qoder-id="qel-rect-bd8b6ab7" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-bd8b6ab7&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:35,&quot;column&quot;:5}}"/>
    <rect x="10" y="4" width="2" height="2" fill="#FFFFFF" data-qoder-id="qel-rect-ba8b65fe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-ba8b65fe&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:36,&quot;column&quot;:5}}"/>
    <rect x="5" y="4" width="1" height="1" fill="#3B2213" data-qoder-id="qel-rect-bb8b6791" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-bb8b6791&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:37,&quot;column&quot;:5}}"/>
    <rect x="10" y="4" width="1" height="1" fill="#3B2213" data-qoder-id="qel-rect-b88b62d8" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-b88b62d8&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:38,&quot;column&quot;:5}}"/>
    <rect x="6" y="6" width="4" height="1" fill="#C69C6D" data-qoder-id="qel-rect-b98b646b" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-b98b646b&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:39,&quot;column&quot;:5}}"/>
    <rect x="7" y="7" width="2" height="1" fill="#A0522D" data-qoder-id="qel-rect-b68b5fb2" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-b68b5fb2&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:40,&quot;column&quot;:5}}"/>
    <rect x="4" y="8" width="8" height="4" fill="#00A8A8" data-qoder-id="qel-rect-b78b6145" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-b78b6145&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:41,&quot;column&quot;:5}}"/>
    <rect x="4" y="12" width="3" height="4" fill="#2C2C8C" data-qoder-id="qel-rect-b8892441" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-b8892441&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:42,&quot;column&quot;:5}}"/>
    <rect x="9" y="12" width="3" height="4" fill="#2C2C8C" data-qoder-id="qel-rect-b78922ae" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-b78922ae&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;SteveAvatar&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:43,&quot;column&quot;:5}}"/>
  </svg>
)

/* Logout icon */
const LogoutIcon = (qoderProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={qoderProps?.style} className={qoderProps?.className} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
    <path d="M15 12H4M4 12L8 8M4 12L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-8f83cfab" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-8f83cfab&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;LogoutIcon&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:53,&quot;column&quot;:5}}"/>
    <path d="M11 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" data-qoder-id="qel-path-9483d78a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-9483d78a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;LogoutIcon&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:54,&quot;column&quot;:5}}"/>
  </svg>
)

/* Vocab Book icon */
const VocabIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1z" fill="currentColor" opacity="0.2" />
    <path d="M5 4h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zM4 8h16M8 4v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 12h4M12 15h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
  </svg>
)

/* Stats chart icon */
const StatsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <rect x="4" y="14" width="4" height="6" rx="1" fill="currentColor" opacity="0.2" />
    <rect x="10" y="8" width="4" height="12" rx="1" fill="currentColor" opacity="0.2" />
    <rect x="16" y="4" width="4" height="16" rx="1" fill="currentColor" opacity="0.2" />
    <path d="M4 14h4v6H4zM10 8h4v12h-4zM16 4h4v16h-4z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function App(qoderProps) {
  return (
    <>
    <NetworkStatus />
    <Routes data-qoder-id="qel-routes-52f01edd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-routes-52f01edd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;routes&quot;,&quot;loc&quot;:{&quot;line&quot;:60,&quot;column&quot;:5}}">
      <Route path="/login" element={<Login />}  data-qoder-id="qel-route-68bedcb4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-route-68bedcb4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;route&quot;,&quot;loc&quot;:{&quot;line&quot;:61,&quot;column&quot;:7}}"/>
      {/* Public routes: accessible without login */}
      <Route path="/*" element={<AppLayout {...(qoderProps || {})} />} />
    </Routes>
    </>
  )
}

function AppLayout(qoderProps) {
  const location = useLocation()
  const { session, profile, loading, signOut } = useAuth()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const isGuest = !session

  // Show a minimal loading state while auth session is resolving to prevent
  // the UI from flashing Guest → Logged-in on page refresh.
  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', fontFamily: 'var(--font-display)', fontSize: 14 }}>
        Loading...
      </div>
    )
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  // For guests, use sensible defaults; for logged-in users, read profile.
  const displayName = isGuest ? 'Guest' : (profile?.displayName || 'Adventurer')
  const level = isGuest ? 0 : (profile?.level ?? 1)
  const xpPercent = isGuest ? 0 : (profile?.xpPercent ?? 0)
  const streak = isGuest ? 0 : (profile?.streak ?? 0)

  const openConfirm = () => setConfirmOpen(true)
  const closeConfirm = () => {
    if (signingOut) return
    setConfirmOpen(false)
  }

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
      // RequireAuth will redirect to /login automatically once session becomes null.
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[auth] sign out failed', err)
    } finally {
      setSigningOut(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className={["app-container", qoderProps?.className].filter(Boolean).join(" ")} data-component="app-shell" style={qoderProps?.style} data-qoder-id={qoderProps?.["data-qoder-id"]} data-qoder-source={qoderProps?.["data-qoder-source"]}>
      {/* Skip to content link for keyboard / screen-reader users */}
      <a href="#main-content" className="skip-link">Skip to content</a>
      {/* Top Status Bar */}
      <header className="top-bar" data-component="top-bar" data-qoder-id="qel-top-bar-109a2529" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-top-bar-109a2529&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;top-bar&quot;,&quot;loc&quot;:{&quot;line&quot;:58,&quot;column&quot;:7}}">
        <Link to={isGuest ? '/login' : '/profile'} className="top-bar-left" style={{ textDecoration: 'none', color: 'inherit' }} data-qoder-id="qel-top-bar-left-8c4fd6d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-top-bar-left-8c4fd6d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;top-bar-left&quot;,&quot;loc&quot;:{&quot;line&quot;:59,&quot;column&quot;:9}}">
          <div className="avatar" data-qoder-id="qel-avatar-2a048489" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-avatar-2a048489&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;avatar&quot;,&quot;loc&quot;:{&quot;line&quot;:60,&quot;column&quot;:11}}">
            <SteveAvatar  data-qoder-id="qel-steveavatar-2c0d260c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-steveavatar-2c0d260c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;steveavatar&quot;,&quot;loc&quot;:{&quot;line&quot;:61,&quot;column&quot;:13}}"/>
          </div>
          <div data-qoder-id="qel-div-8307b92f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8307b92f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:63,&quot;column&quot;:11}}">
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '15px', color: 'var(--color-title)' }} data-qoder-id="qel-div-8807c10e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8807c10e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:64,&quot;column&quot;:13}}">
              {displayName}
            </div>
            <div className="level-badge" data-qoder-id="qel-level-badge-aa6f124c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-level-badge-aa6f124c&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;level-badge&quot;,&quot;loc&quot;:{&quot;line&quot;:67,&quot;column&quot;:13}}">
              <span data-qoder-id="qel-span-d77cd663" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-d77cd663&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:68,&quot;column&quot;:15}}">{`LV ${level}`}</span>
              <div className="xp-bar-mini" data-qoder-id="qel-xp-bar-mini-21896cb5" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-xp-bar-mini-21896cb5&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;xp-bar-mini&quot;,&quot;loc&quot;:{&quot;line&quot;:69,&quot;column&quot;:15}}">
                <div className="xp-bar-mini-fill" style={{ width: `${xpPercent}%` }}  data-qoder-id="qel-xp-bar-mini-fill-6eb16e58" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-xp-bar-mini-fill-6eb16e58&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;xp-bar-mini-fill&quot;,&quot;loc&quot;:{&quot;line&quot;:70,&quot;column&quot;:17}}"/>
              </div>
            </div>
          </div>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }} data-qoder-id="qel-div-8709fe12" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-8709fe12&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:75,&quot;column&quot;:9}}">
          {isGuest ? (
            <Link to="/login" className="btn btn-primary" style={{ fontSize: 13, padding: '6px 16px' }}>Sign In</Link>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-grass-wash)', padding: '6px 12px', borderRadius: 'var(--radius-pill)', fontSize: '13px', fontWeight: 700, color: 'var(--color-emerald)' }} data-qoder-id="qel-div-8209f633">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L10 6H15L11 9L12.5 14L8 11L3.5 14L5 9L1 6H6L8 1Z" fill="var(--color-gold)"/></svg>
                {`${streak} Day Streak`}
              </div>
              <button
                type="button"
                className="top-bar-logout"
                onClick={openConfirm}
                aria-label="Sign out"
                title="Sign out">
                <LogoutIcon />
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="app-content" data-qoder-id="qel-app-content-a452c868" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-app-content-a452c868&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;app-content&quot;,&quot;loc&quot;:{&quot;line&quot;:84,&quot;column&quot;:7}}">
        <Routes data-qoder-id="qel-routes-cbf31bef" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-routes-cbf31bef&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;routes&quot;,&quot;loc&quot;:{&quot;line&quot;:85,&quot;column&quot;:9}}">
          {/* ── Public routes (guest-accessible) ── */}
          <Route path="/courses" element={<CourseList />} />
          <Route path="/course/:id" element={<CourseDetail />} />
          <Route path="/video/:id" element={<VideoLesson />} />
          <Route path="/reading/:id" element={<ReadingPractice />} />
          <Route path="/vocab/:id" element={<VocabPractice />} />
          <Route path="/credits" element={<Credits />} />
          {/* ── Auth-required routes ── */}
          <Route path="/" element={isGuest ? <Navigate to="/courses" replace /> : <RequireAuth><Home /></RequireAuth>} />
          <Route path="/achievements" element={<RequireAuth><Achievements /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/vocab-book" element={<RequireAuth><VocabBook /></RequireAuth>} />
          <Route path="/vocab-review" element={<RequireAuth><VocabReview /></RequireAuth>} />
          <Route path="/stats" element={<RequireAuth><StatsPage /></RequireAuth>} />
          <Route path="/admin" element={<Suspense fallback={<AdminLoading />}><RequireAdmin><AdminCourseList /></RequireAdmin></Suspense>} />
          <Route path="/admin/course/new" element={<Suspense fallback={<AdminLoading />}><RequireAdmin><AdminCourseEditor /></RequireAdmin></Suspense>} />
          <Route path="/admin/course/:id" element={<Suspense fallback={<AdminLoading />}><RequireAdmin><AdminCourseEditor /></RequireAdmin></Suspense>} />
          <Route path="/admin/rewards" element={<Suspense fallback={<AdminLoading />}><RequireAdmin><AdminRewardsList /></RequireAdmin></Suspense>} />
          <Route path="/admin/reward/new" element={<Suspense fallback={<AdminLoading />}><RequireAdmin><AdminRewardsEditor /></RequireAdmin></Suspense>} />
          <Route path="/admin/reward/:id" element={<Suspense fallback={<AdminLoading />}><RequireAdmin><AdminRewardsEditor /></RequireAdmin></Suspense>} />
          <Route path="/admin/quests" element={<Suspense fallback={<AdminLoading />}><RequireAdmin><AdminQuestsList /></RequireAdmin></Suspense>} />
          <Route path="/admin/quest/new" element={<Suspense fallback={<AdminLoading />}><RequireAdmin><AdminQuestsEditor /></RequireAdmin></Suspense>} />
          <Route path="/admin/quest/:id" element={<Suspense fallback={<AdminLoading />}><RequireAdmin><AdminQuestsEditor /></RequireAdmin></Suspense>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Footer with attribution + Credits link */}
      <footer data-component="app-footer" style={{
        padding: 'var(--space-md) var(--space-lg)',
        textAlign: 'center',
        fontSize: 11,
        color: 'var(--color-muted)',
        borderTop: '1px solid var(--color-surface-soft)',
      }} data-qoder-id="qel-app-footer-a5fb4b7e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-app-footer-a5fb4b7e&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;app-footer&quot;,&quot;loc&quot;:{&quot;line&quot;:165,&quot;column&quot;:7}}">
        Content from{' '}
        <a href="https://minecraft.wiki/" target="_blank" rel="noreferrer" style={{ color: 'var(--color-muted)' }} data-qoder-id="qel-a-7b835a93" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-a-7b835a93&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;a&quot;,&quot;loc&quot;:{&quot;line&quot;:173,&quot;column&quot;:9}}">
          Minecraft Wiki
        </a>{' '}(CC BY-SA 4.0) &amp;{' '}
        <a href="https://www.youtube.com/@englishfromthegroundup" target="_blank" rel="noreferrer" style={{ color: 'var(--color-muted)' }} data-qoder-id="qel-a-7a835900" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-a-7a835900&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;a&quot;,&quot;loc&quot;:{&quot;line&quot;:176,&quot;column&quot;:9}}">
          English from the Ground Up
        </a>
        {' · '}
        <NavLink to="/credits" style={{ color: 'var(--color-grass)' }} data-qoder-id="qel-navlink-e87fcd25" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-navlink-e87fcd25&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;navlink&quot;,&quot;loc&quot;:{&quot;line&quot;:180,&quot;column&quot;:9}}">Full credits</NavLink>
      </footer>

      {/* Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Main navigation" data-component="bottom-nav" data-qoder-id="qel-bottom-nav-0830b818" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bottom-nav-0830b818&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;bottom-nav&quot;,&quot;loc&quot;:{&quot;line&quot;:95,&quot;column&quot;:7}}">
        <NavLink to={isGuest ? '/courses' : '/'} aria-label="Home" className={`nav-item ${isActive('/') ? 'active' : ''}`} data-qoder-id="qel-navlink-a853ac77" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-navlink-a853ac77&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;navlink&quot;,&quot;loc&quot;:{&quot;line&quot;:96,&quot;column&quot;:9}}">
          <span className="nav-icon" data-qoder-id="qel-nav-icon-5ae4e899" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-nav-icon-5ae4e899&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;nav-icon&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:11}}"><HomeIcon  data-qoder-id="qel-homeicon-062ff589" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-homeicon-062ff589&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;homeicon&quot;,&quot;loc&quot;:{&quot;line&quot;:97,&quot;column&quot;:38}}"/></span>
          <span data-qoder-id="qel-span-e57f2b04" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e57f2b04&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:98,&quot;column&quot;:11}}">Home</span>
        </NavLink>
        <NavLink to="/courses" aria-label="Courses" className={`nav-item ${isActive('/courses') ? 'active' : ''}`} data-qoder-id="qel-navlink-9c539993" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-navlink-9c539993&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;navlink&quot;,&quot;loc&quot;:{&quot;line&quot;:100,&quot;column&quot;:9}}">
          <span className="nav-icon" data-qoder-id="qel-nav-icon-56e2a3b6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-nav-icon-56e2a3b6&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;nav-icon&quot;,&quot;loc&quot;:{&quot;line&quot;:101,&quot;column&quot;:11}}"><BookIcon  data-qoder-id="qel-bookicon-1326157a" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-bookicon-1326157a&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;bookicon&quot;,&quot;loc&quot;:{&quot;line&quot;:101,&quot;column&quot;:38}}"/></span>
          <span data-qoder-id="qel-span-e181634f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-e181634f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:11}}">Courses</span>
        </NavLink>
        <NavLink to="/vocab-book" aria-label="Vocabulary" className={`nav-item ${isActive('/vocab-book') ? 'active' : ''}`}>
          <span className="nav-icon"><VocabIcon /></span>
          <span>Words</span>
        </NavLink>
        <NavLink to="/stats" aria-label="Statistics" className={`nav-item ${isActive('/stats') ? 'active' : ''}`}>
          <span className="nav-icon"><StatsIcon /></span>
          <span>Stats</span>
        </NavLink>
        <NavLink to="/achievements" aria-label="Rewards" className={`nav-item ${isActive('/achievements') ? 'active' : ''}`} data-qoder-id="qel-navlink-2656b168" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-navlink-2656b168&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;navlink&quot;,&quot;loc&quot;:{&quot;line&quot;:104,&quot;column&quot;:9}}">
          <span className="nav-icon" data-qoder-id="qel-nav-icon-5ae2aa02" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-nav-icon-5ae2aa02&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;nav-icon&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:11}}"><TrophyIcon  data-qoder-id="qel-trophyicon-3c617450" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-trophyicon-3c617450&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;trophyicon&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:38}}"/></span>
          <span data-qoder-id="qel-span-dd815d03" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-span-dd815d03&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;App&quot;,&quot;elementRole&quot;:&quot;span&quot;,&quot;loc&quot;:{&quot;line&quot;:106,&quot;column&quot;:11}}">Rewards</span>
        </NavLink>
      </nav>

      {/* Sign-out Confirm Modal */}
      {confirmOpen && (
        <div
          className="logout-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-modal-title"
          onClick={closeConfirm}
         data-qoder-id="qel-logout-modal-backdrop-467d3d4f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-logout-modal-backdrop-467d3d4f&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;logout-modal-backdrop&quot;,&quot;loc&quot;:{&quot;line&quot;:178,&quot;column&quot;:9}}">
          <div className="logout-modal" onClick={(e) => e.stopPropagation()} data-qoder-id="qel-logout-modal-9d801c67" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-logout-modal-9d801c67&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;logout-modal&quot;,&quot;loc&quot;:{&quot;line&quot;:185,&quot;column&quot;:11}}">
            <div className="logout-modal-icon" aria-hidden data-qoder-id="qel-logout-modal-icon-9521b408" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-logout-modal-icon-9521b408&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;logout-modal-icon&quot;,&quot;loc&quot;:{&quot;line&quot;:186,&quot;column&quot;:13}}">
              <LogoutIcon  data-qoder-id="qel-logouticon-22ef00ba" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-logouticon-22ef00ba&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;logouticon&quot;,&quot;loc&quot;:{&quot;line&quot;:187,&quot;column&quot;:15}}"/>
            </div>
            <h3 id="logout-modal-title" className="logout-modal-title" data-qoder-id="qel-logout-modal-title-30d165cd" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-logout-modal-title-30d165cd&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;logout-modal-title&quot;,&quot;loc&quot;:{&quot;line&quot;:189,&quot;column&quot;:13}}">Sign out?</h3>
            <p className="logout-modal-text" data-qoder-id="qel-logout-modal-text-8c8054c3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-logout-modal-text-8c8054c3&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;logout-modal-text&quot;,&quot;loc&quot;:{&quot;line&quot;:190,&quot;column&quot;:13}}">
              You are signed in as <strong data-qoder-id="qel-strong-bd693164" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-strong-bd693164&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;strong&quot;,&quot;loc&quot;:{&quot;line&quot;:191,&quot;column&quot;:36}}">{displayName}</strong>. Your progress is safe — you can sign back in any time.
            </p>
            <div className="logout-modal-actions" data-qoder-id="qel-logout-modal-actions-a08fe770" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-logout-modal-actions-a08fe770&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;logout-modal-actions&quot;,&quot;loc&quot;:{&quot;line&quot;:193,&quot;column&quot;:13}}">
              <button
                type="button"
                className="logout-modal-btn logout-modal-btn-ghost"
                onClick={closeConfirm}
                disabled={signingOut}
               data-qoder-id="qel-logout-modal-btn-4c19bb91" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-logout-modal-btn-4c19bb91&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;logout-modal-btn&quot;,&quot;loc&quot;:{&quot;line&quot;:194,&quot;column&quot;:15}}">
                Cancel
              </button>
              <button
                type="button"
                className="logout-modal-btn logout-modal-btn-danger"
                onClick={handleSignOut}
                disabled={signingOut}
                autoFocus
               data-qoder-id="qel-logout-modal-btn-4d19bd24" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-logout-modal-btn-4d19bd24&quot;,&quot;filePath&quot;:&quot;react-vite/src/App.jsx&quot;,&quot;componentName&quot;:&quot;AppLayout&quot;,&quot;elementRole&quot;:&quot;logout-modal-btn&quot;,&quot;loc&quot;:{&quot;line&quot;:202,&quot;column&quot;:15}}">
                {signingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
