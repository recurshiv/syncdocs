import { CheckCircle2 } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Logo from './Logo.tsx'

const HIGHLIGHTS = [
  'Autosave that only says "Saved" when the server has your work',
  'Failed saves keep your edits and can be retried',
  'Private documents, visible only to you',
]

// Shared frame for the login and signup pages: a brand panel on large
// screens, and the form on its own on small screens.
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-indigo-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 -right-24 size-96 rounded-full bg-indigo-400/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-violet-500/30 blur-3xl" />

        <Link to="/" className="relative w-fit">
          <Logo inverted />
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight">
            Write freely.
            <br />
            Never lose a word.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((text) => (
              <li key={text} className="flex gap-3 text-indigo-50">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-indigo-200" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-200">For students, teachers, and anyone who writes.</p>
      </aside>

      <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-12 block w-fit lg:hidden">
            <Logo />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
          <p className="mt-1.5 text-sm text-neutral-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-sm text-neutral-600">{footer}</p>
        </div>
      </main>
    </div>
  )
}

export function FormField({ label, hint, ...inputProps }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>
      <input
        {...inputProps}
        className="block w-full rounded-lg border border-neutral-300 bg-white px-3.5 py-2.5 text-sm text-neutral-900 shadow-xs transition outline-none placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
      />
      {hint && <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span>}
    </label>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {message}
    </p>
  )
}

export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:ring-4 focus-visible:ring-indigo-500/30 focus-visible:outline-none disabled:opacity-60"
    >
      {children}
    </button>
  )
}
