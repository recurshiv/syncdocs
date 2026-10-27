import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client.ts'
import { useAuth } from '../hooks/useAuth.ts'
import Logo from './Logo.tsx'

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}

function Navbar() {
  const { user, logout } = useAuth()
  const [error, setError] = useState<string | null>(null)

  async function handleLogout() {
    setError(null)
    try {
      await logout()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-neutral-200/80 bg-white/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/dashboard">
          <Logo />
        </Link>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {error && <span className="text-xs text-red-600">{error}</span>}
          {user && (
            <span className="flex min-w-0 items-center gap-2.5">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
                aria-hidden="true"
              >
                {initials(user.name)}
              </span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm leading-tight font-medium text-neutral-900">{user.name}</span>
                <span className="block truncate text-xs leading-tight text-neutral-500">{user.email}</span>
              </span>
            </span>
          )}
          <span className="mx-1 hidden h-6 w-px bg-neutral-200 sm:block" aria-hidden="true" />
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
