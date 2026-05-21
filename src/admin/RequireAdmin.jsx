// RequireAdmin — route guard that relies on server-side admin_users table.
// Source of truth: public.is_admin() RPC; AuthContext exposes isAdmin/isAdminLoaded.
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function RequireAdmin({ children }) {
  const { authUser, isAdmin, isAdminLoaded } = useAuth()
  // Wait until the admin status check completes to avoid flicker-redirect.
  if (authUser && !isAdminLoaded) {
    return (
      <div style={{ padding: 24, fontFamily: 'monospace', color: '#555' }}>
        Checking admin access…
      </div>
    )
  }
  if (!isAdmin) {
    return <Navigate to="/" replace />
  }
  return children
}
