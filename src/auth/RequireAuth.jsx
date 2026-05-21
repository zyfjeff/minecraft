import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export default function RequireAuth({ children, ...qoderProps }) {
  const { session, authUser, profile, loading, profileLoading } = useAuth()
  const location = useLocation()

  // Wait for either the auth bootstrap OR the profile fetch so that downstream
  // components never render with a half-loaded user (which causes the display
  // name to flicker between email-prefix fallback and the real display_name).
  const stillLoading =
    loading ||
    (session && authUser?.email_confirmed_at && !profile && profileLoading)

  if (stillLoading) {
    return (
      <div
        style={{ ...({
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-muted)',
          fontFamily: 'var(--font-display)',
          fontSize: 14,
        }), ...(qoderProps?.style) }}
       data-qoder-id="qel-div-caa7e7d4" data-qoder-source="{&quot;qoderId&quot;:&quot;qel-div-caa7e7d4&quot;,&quot;filePath&quot;:&quot;react-vite/src/auth/RequireAuth.jsx&quot;,&quot;componentName&quot;:&quot;RequireAuth&quot;,&quot;elementRole&quot;:&quot;div&quot;,&quot;loc&quot;:{&quot;line&quot;:10,&quot;column&quot;:7}}" className={qoderProps?.className}>
        Loading...
      </div>
    )
  }

  if (!session) {
    // Guest users trying to access auth-required pages are redirected to /login
    // with the intended destination preserved in state.from for post-login redirect.
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!authUser?.email_confirmed_at) {
    return <Navigate to="/login?verify=1" replace state={{ from: location }} />
  }

  return children
}
