import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { errorMessage } from '../api/client.ts'
import { AuthLayout, FormError, FormField, SubmitButton } from '../components/AuthLayout.tsx'
import LoadingSpinner from '../components/LoadingSpinner.tsx'
import { useAuth } from '../hooks/useAuth.ts'

function Login() {
  const { user, loading, login } = useAuth()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <LoadingSpinner />
  // Covers both "already logged in" and "just logged in successfully".
  if (user) return <Navigate to={from} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Log in"
      footer={
        <>
          New to SyncDocs?{' '}
          <Link to="/signup" className="font-medium text-indigo-600 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormError message={error} />
        <SubmitButton busy={submitting}>{submitting ? 'Logging in…' : 'Log in'}</SubmitButton>
      </form>
    </AuthLayout>
  )
}

export default Login
