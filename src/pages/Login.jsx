import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { supabase } from '../lib/supabase'
import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  validatePasswordMatch,
} from '../lib/validation'

function mapAuthError(err) {
  const msg = err?.message || ''
  if (/invalid login credentials/i.test(msg)) return 'Wrong email or password.'
  if (/user already registered/i.test(msg)) return 'This email is already registered.'
  if (/email not confirmed/i.test(msg)) return 'Please verify your email before signing in.'
  if (/password.*at least/i.test(msg)) return 'Password must be at least 8 characters.'
  return msg || 'Something went wrong. Please try again.'
}

export default function Login(qoderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { session, authUser, loading: authLoading, signIn, signUp } = useAuth()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup' | 'forgot'
  const [resetSent, setResetSent] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [verifySent, setVerifySent] = useState(false)

  // Show "please verify your email" hint when redirected here from RequireAuth
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('verify') === '1') {
      setInfo('Please check your inbox and click the verification link to continue.')
    }
  }, [location.search])

  // Already signed in (and verified) -> bounce to home
  useEffect(() => {
    if (!authLoading && session && authUser?.email_confirmed_at) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [authLoading, session, authUser, location.state, navigate])

  function switchMode(next) {
    setMode(next)
    setError('')
    setInfo('')
    setVerifySent(false)
    setResetSent(false)
  }

  function validate() {
    const emailErr = validateEmail(email)
    if (emailErr) return emailErr
    if (mode === 'forgot') return '' // only email needed
    const passErr = validatePassword(password)
    if (passErr) return passErr
    if (mode === 'signup') {
      const nameErr = validateDisplayName(displayName)
      if (nameErr) return nameErr
      const matchErr = validatePasswordMatch(password, confirmPassword)
      if (matchErr) return matchErr
    }
    return ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    const v = validate()
    if (v) {
      setError(v)
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'forgot') {
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        })
        setResetSent(true)
        setInfo(`Password reset link sent to ${email.trim()}. Check your inbox.`)
      } else if (mode === 'signin') {
        await signIn({ email: email.trim(), password })
        // navigation happens in the effect once session is set
      } else {
        await signUp({
          email: email.trim(),
          password,
          displayName: displayName.trim(),
        })
        setVerifySent(true)
        setInfo(
          `We have sent a verification link to ${email.trim()}. Click it to activate your account.`
        )
      }
    } catch (err) {
      setError(mapAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={["login-page", qoderProps?.className].filter(Boolean).join(" ")} data-qoder-id="qel-login-page-48394208" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-page-48394208&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-page&quot;,&quot;loc&quot;:{&quot;line&quot;:98,&quot;column&quot;:5}}" style={qoderProps?.style}>
      <div className="login-card" data-qoder-id="qel-login-card-8a3539f0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-card-8a3539f0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-card&quot;,&quot;loc&quot;:{&quot;line&quot;:99,&quot;column&quot;:7}}">
        <div className="login-brand" data-qoder-id="qel-login-brand-dc72af94" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-brand-dc72af94&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-brand&quot;,&quot;loc&quot;:{&quot;line&quot;:100,&quot;column&quot;:9}}">
          <div className="login-logo" aria-hidden data-qoder-id="qel-login-logo-7e19e153" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-logo-7e19e153&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-logo&quot;,&quot;loc&quot;:{&quot;line&quot;:101,&quot;column&quot;:11}}">
            <svg width="48" height="48" viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} data-qoder-id="qel-svg-a31481e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-a31481e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:102,&quot;column&quot;:13}}">
              <rect x="0" y="0" width="16" height="16" fill="var(--color-grass)"  data-qoder-id="qel-rect-c25cc051" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-c25cc051&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:103,&quot;column&quot;:15}}"/>
              <rect x="0" y="0" width="16" height="3" fill="var(--color-grass-active)"  data-qoder-id="qel-rect-c15cbebe" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-c15cbebe&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:104,&quot;column&quot;:15}}"/>
              <rect x="2" y="6" width="3" height="3" fill="var(--color-dirt)"  data-qoder-id="qel-rect-bc5cb6df" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-bc5cb6df&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:105,&quot;column&quot;:15}}"/>
              <rect x="11" y="9" width="3" height="3" fill="var(--color-dirt)"  data-qoder-id="qel-rect-bb5cb54c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-bb5cb54c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:106,&quot;column&quot;:15}}"/>
              <rect x="6" y="11" width="3" height="2" fill="var(--color-dirt)"  data-qoder-id="qel-rect-5f0520bc" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-rect-5f0520bc&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;rect&quot;,&quot;loc&quot;:{&quot;line&quot;:107,&quot;column&quot;:15}}"/>
            </svg>
          </div>
          <h1 className="login-title" data-qoder-id="qel-login-title-7a2c5efa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-title-7a2c5efa&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-title&quot;,&quot;loc&quot;:{&quot;line&quot;:110,&quot;column&quot;:11}}">CraftWords</h1>
          <p className="login-subtitle" data-qoder-id="qel-login-subtitle-5ba67c54" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-subtitle-5ba67c54&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-subtitle&quot;,&quot;loc&quot;:{&quot;line&quot;:111,&quot;column&quot;:11}}">Learn English the Minecraft way.</p>
        </div>

        {mode === 'forgot' ? (
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '18px',
            fontWeight: 700,
            color: 'var(--color-title)',
            textAlign: 'center',
            margin: '0 0 var(--space-md) 0',
          }}>Reset Password</h2>
        ) : (
        <div className="login-tabs" role="tablist" data-qoder-id="qel-login-tabs-92765e54" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-tabs-92765e54&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-tabs&quot;,&quot;loc&quot;:{&quot;line&quot;:114,&quot;column&quot;:9}}">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={`login-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => switchMode('signin')}
           data-qoder-id="qel-button-f6c27f9c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-f6c27f9c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:115,&quot;column&quot;:11}}">
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`login-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
           data-qoder-id="qel-button-f7c2812f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-button-f7c2812f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;button&quot;,&quot;loc&quot;:{&quot;line&quot;:124,&quot;column&quot;:11}}">
            Sign Up
          </button>
        </div>
        )}

        {verifySent || resetSent ? (
          <div className="login-verify" data-qoder-id="qel-login-verify-eb8c93e4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-verify-eb8c93e4&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-verify&quot;,&quot;loc&quot;:{&quot;line&quot;:136,&quot;column&quot;:11}}">
            <div className="login-verify-icon" aria-hidden data-qoder-id="qel-login-verify-icon-557ac5a3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-verify-icon-557ac5a3&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-verify-icon&quot;,&quot;loc&quot;:{&quot;line&quot;:137,&quot;column&quot;:13}}">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" data-qoder-id="qel-svg-1952377c" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-svg-1952377c&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;svg&quot;,&quot;loc&quot;:{&quot;line&quot;:138,&quot;column&quot;:15}}">
                <path
                  d="M4 6h16v12H4z"
                  stroke="var(--color-grass)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                 data-qoder-id="qel-path-485f1d45" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-485f1d45&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:139,&quot;column&quot;:17}}"/>
                <path
                  d="M4 6l8 7 8-7"
                  stroke="var(--color-grass)"
                  strokeWidth="2"
                  strokeLinejoin="round"
                 data-qoder-id="qel-path-495ce041" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-path-495ce041&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;path&quot;,&quot;loc&quot;:{&quot;line&quot;:145,&quot;column&quot;:17}}"/>
              </svg>
            </div>
            <h2 className="login-verify-title" data-qoder-id="qel-login-verify-title-746260e0" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-verify-title-746260e0&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-verify-title&quot;,&quot;loc&quot;:{&quot;line&quot;:153,&quot;column&quot;:13}}">{resetSent ? 'Check your email' : 'Check your email'}</h2>
            <p className="login-verify-text" data-qoder-id="qel-login-verify-text-bf0b3d20" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-verify-text-bf0b3d20&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-verify-text&quot;,&quot;loc&quot;:{&quot;line&quot;:154,&quot;column&quot;:13}}">{info}</p>
            <button
              type="button"
              className="login-button login-button-ghost"
              onClick={() => switchMode('signin')}
             data-qoder-id="qel-login-button-6254b532" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-button-6254b532&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-button&quot;,&quot;loc&quot;:{&quot;line&quot;:155,&quot;column&quot;:13}}">
              Back to Sign In
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit} noValidate data-qoder-id="qel-login-form-86d085b3" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-form-86d085b3&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-form&quot;,&quot;loc&quot;:{&quot;line&quot;:164,&quot;column&quot;:11}}">
            {mode === 'forgot' && (
              <p style={{ fontSize: '14px', color: 'var(--color-body)', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>
            )}

            {mode === 'signup' && (
              <label className="login-field" data-qoder-id="qel-login-field-6747b1a6" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-field-6747b1a6&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-field&quot;,&quot;loc&quot;:{&quot;line&quot;:166,&quot;column&quot;:15}}">
                <span className="login-label" data-qoder-id="qel-login-label-b99a9209" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-label-b99a9209&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-label&quot;,&quot;loc&quot;:{&quot;line&quot;:167,&quot;column&quot;:17}}">Display Name</span>
                <input
                  type="text"
                  className="login-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Steve"
                  maxLength={20}
                  autoComplete="nickname"
                  required
                 data-qoder-id="qel-login-input-0396534e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-input-0396534e&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-input&quot;,&quot;loc&quot;:{&quot;line&quot;:168,&quot;column&quot;:17}}"/>
              </label>
            )}

            <label className="login-field" data-qoder-id="qel-login-field-7447c61d" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-field-7447c61d&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-field&quot;,&quot;loc&quot;:{&quot;line&quot;:181,&quot;column&quot;:13}}">
              <span className="login-label" data-qoder-id="qel-login-label-c29aa034" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-label-c29aa034&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-label&quot;,&quot;loc&quot;:{&quot;line&quot;:182,&quot;column&quot;:15}}">Email</span>
              <input
                type="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
               data-qoder-id="qel-login-input-8093467e" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-input-8093467e&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-input&quot;,&quot;loc&quot;:{&quot;line&quot;:183,&quot;column&quot;:15}}"/>
            </label>

            {mode !== 'forgot' && (
            <label className="login-field" data-qoder-id="qel-login-field-6745730f" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-field-6745730f&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-field&quot;,&quot;loc&quot;:{&quot;line&quot;:194,&quot;column&quot;:13}}">
              <span className="login-label" data-qoder-id="qel-login-label-33978080" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-label-33978080&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-label&quot;,&quot;loc&quot;:{&quot;line&quot;:195,&quot;column&quot;:15}}">Password</span>
              <input
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                minLength={8}
                required
               data-qoder-id="qel-login-input-7f9344eb" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-input-7f9344eb&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-input&quot;,&quot;loc&quot;:{&quot;line&quot;:196,&quot;column&quot;:15}}"/>
            </label>
            )}

            {mode === 'signin' && (
              <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '4px' }}>
                <button
                  type="button"
                  className="login-link"
                  onClick={() => switchMode('forgot')}
                  style={{ fontSize: '13px' }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {mode === 'signup' && (
              <label className="login-field" data-qoder-id="qel-login-field-62456b30" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-field-62456b30&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-field&quot;,&quot;loc&quot;:{&quot;line&quot;:209,&quot;column&quot;:15}}">
                <span className="login-label" data-qoder-id="qel-login-label-3a978b85" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-label-3a978b85&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-label&quot;,&quot;loc&quot;:{&quot;line&quot;:210,&quot;column&quot;:17}}">Confirm Password</span>
                <input
                  type="password"
                  className="login-input"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                 data-qoder-id="qel-login-input-829349a4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-input-829349a4&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-input&quot;,&quot;loc&quot;:{&quot;line&quot;:211,&quot;column&quot;:17}}"/>
              </label>
            )}

            {error && <div className="login-alert login-alert-error" data-qoder-id="qel-login-alert-31979824" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-alert-31979824&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-alert&quot;,&quot;loc&quot;:{&quot;line&quot;:224,&quot;column&quot;:23}}">{error}</div>}
            {info && !error && <div className="login-alert login-alert-info" data-qoder-id="qel-login-alert-289789f9" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-alert-289789f9&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-alert&quot;,&quot;loc&quot;:{&quot;line&quot;:225,&quot;column&quot;:32}}">{info}</div>}

            <button type="submit" className="login-button" disabled={submitting} data-qoder-id="qel-login-button-645279c1" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-button-645279c1&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-button&quot;,&quot;loc&quot;:{&quot;line&quot;:227,&quot;column&quot;:13}}">
              {submitting
                ? 'Please wait...'
                : mode === 'forgot'
                ? 'Send Reset Link'
                : mode === 'signin'
                ? 'Continue'
                : 'Create Account'}
            </button>

            <p className="login-footnote" data-qoder-id="qel-login-footnote-99cb4987" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-footnote-99cb4987&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-footnote&quot;,&quot;loc&quot;:{&quot;line&quot;:235,&quot;column&quot;:13}}">
              {mode === 'forgot' ? (
                <>
                  Remember your password?{' '}
                  <button type="button" className="login-link" onClick={() => switchMode('signin')}>
                    Sign in
                  </button>
                </>
              ) : mode === 'signin' ? (
                <>
                  New to CraftWords?{' '}
                  <button type="button" className="login-link" onClick={() => switchMode('signup')} data-qoder-id="qel-login-link-3e4dfaaa" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-link-3e4dfaaa&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-link&quot;,&quot;loc&quot;:{&quot;line&quot;:239,&quot;column&quot;:19}}">
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button type="button" className="login-link" onClick={() => switchMode('signin')} data-qoder-id="qel-login-link-3d4df917" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-login-link-3d4df917&quot;,&quot;filePath&quot;:&quot;react-vite/src/pages/Login.jsx&quot;,&quot;componentName&quot;:&quot;Login&quot;,&quot;elementRole&quot;:&quot;login-link&quot;,&quot;loc&quot;:{&quot;line&quot;:246,&quot;column&quot;:19}}">
                    Sign in
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
