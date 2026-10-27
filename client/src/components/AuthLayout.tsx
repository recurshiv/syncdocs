import { FileText } from 'lucide-react'
import type { InputHTMLAttributes, ReactNode } from 'react'

// Shared frame for the login and signup pages.
export function AuthLayout({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-2 text-lg font-semibold">
        <FileText className="size-6 text-indigo-600" aria-hidden="true" />
        SyncDocs
      </div>

      <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-6 text-xl font-semibold tracking-tight">{title}</h1>
        {children}
      </div>

      <p className="mt-6 text-sm text-neutral-600">{footer}</p>
    </div>
  )
}

export function FormField({ label, hint, ...inputProps }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      <input
        {...inputProps}
        className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      />
      {hint && <span className="mt-1 block text-xs text-neutral-500">{hint}</span>}
    </label>
  )
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  )
}

export function SubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
    >
      {children}
    </button>
  )
}
