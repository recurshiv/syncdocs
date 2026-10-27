import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.ts'
import LoadingSpinner from './LoadingSpinner.tsx'

// Wraps pages that need a logged-in user. This only improves navigation:
// the real protection is the server rejecting requests without a session.
function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner />

  if (!user) {
    // Remember where the user was going, so login can send them back there.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default ProtectedRoute
