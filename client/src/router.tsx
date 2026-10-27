import { Navigate, createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute.tsx'
import Dashboard from './pages/Dashboard.tsx'
import Login from './pages/Login.tsx'
import Signup from './pages/Signup.tsx'

// A data router (createBrowserRouter) is required for useBlocker, which the
// editor uses to save or warn before navigating away.
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      {
        path: '/document/:id',
        // Loaded on demand: Tiptap is most of the bundle, and the login and
        // dashboard pages don't need it.
        lazy: async () => ({ Component: (await import('./pages/DocumentEditor.tsx')).default }),
      },
    ],
  },
  { path: '*', element: <Navigate to="/dashboard" replace /> },
])
