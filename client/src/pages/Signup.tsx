import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { errorMessage } from '../api/client.ts'
import { AuthLayout, FormError, FormField, SubmitButton } from '../components/AuthLayout.tsx'
import LoadingSpinner from '../components/LoadingSpinner.tsx'
import { useAuth } from '../hooks/useAuth.ts'

function Signup() {
  const { user, loading, signup } = useAuth()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <LoadingSpinner />
  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signup(name, email, password)
    } catch (err) {
      setError(errorMessage(err))
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start writing in under a minute. No credit card, no setup."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name" autoComplete="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        <FormField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          hint="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormError message={error} />
        <SubmitButton busy={submitting}>{submitting ? 'Creating account…' : 'Create account'}</SubmitButton>
      </form>
    </AuthLayout>
  )
}

export default Signup
