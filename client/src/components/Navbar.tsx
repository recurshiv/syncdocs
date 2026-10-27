import { useState } from 'react'
import { FileText, LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { errorMessage } from '../api/client.ts'
import { useAuth } from '../hooks/useAuth.ts'

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
    <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-neutral-900">
          <FileText className="size-5 text-indigo-600" aria-hidden="true" />
          SyncDocs
        </Link>

        <div className="flex min-w-0 items-center gap-3">
          {error && <span className="text-xs text-red-600">{error}</span>}
          <span className="hidden truncate text-sm text-neutral-600 sm:inline">{user?.name}</span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
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
