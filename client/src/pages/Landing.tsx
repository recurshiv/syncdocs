import { AlertCircle, Bold, Check, GitCompareArrows, Italic, List, Lock, RotateCcw, Save } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner.tsx'
import Logo from '../components/Logo.tsx'
import { useAuth } from '../hooks/useAuth.ts'

const FEATURES = [
  {
    icon: Save,
    title: 'Autosave you can trust',
    text: 'Your document saves as you type. "Saved" only appears once the server has confirmed your latest edits.',
  },
  {
    icon: RotateCcw,
    title: 'Recovers from failures',
    text: 'If a save fails, your edits stay put and you can retry. Leaving with unsaved work warns you first.',
  },
  {
    icon: GitCompareArrows,
    title: 'No silent overwrites',
    text: 'Edited the same document in another tab? Outdated saves are rejected instead of replacing newer work.',
  },
  {
    icon: Lock,
    title: 'Private by default',
    text: 'Every document belongs to its owner. Access is checked on the server for every request.',
  },
]

// A static illustration of the editor for the hero section.
function EditorPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-indigo-200/60 via-violet-200/40 to-transparent blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xl shadow-indigo-900/10">
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
          <span className="text-sm font-medium text-neutral-800">Week 3 · Lesson plan</span>
          <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <Check className="size-3" aria-hidden="true" /> Saved
          </span>
        </div>
        <div className="flex gap-1 border-b border-neutral-100 px-3 py-2 text-neutral-500">
          {[Bold, Italic, List].map((Icon, i) => (
            <span key={i} className={`rounded-md p-1.5 ${i === 0 ? 'bg-indigo-50 text-indigo-600' : ''}`}>
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
          ))}
        </div>
        <div className="space-y-3 px-8 py-7 text-left">
          <p className="text-xl font-bold text-neutral-900">Introduction to fractions</p>
          <p className="text-sm leading-6 text-neutral-600">
            <strong className="text-neutral-800">Goal:</strong> students can compare fractions with different denominators.
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-600">
            <li>Warm-up: pizza slices (10 min)</li>
            <li>Number line activity (15 min)</li>
          </ul>
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            Connection lost. Your edits are kept and will be saved when you retry.
          </div>
        </div>
      </div>
    </div>
  )
}

function Landing() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingSpinner />
  if (user) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-white">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
            Log in
          </Link>
          <Link to="/signup" className="rounded-lg bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-800">
            Get started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-2 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              For students, teachers, and writers
            </span>
            <h1 className="mt-5 text-4xl leading-[1.1] font-bold tracking-tight text-neutral-900 sm:text-5xl">
              Documents that never <span className="text-indigo-600">lose your work.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-neutral-600">
              Write notes, lesson plans, and assignments in a clean editor that saves as you type and tells you the truth
              about what's saved.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Start writing for free
              </Link>
              <Link to="/login" className="rounded-lg border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-50">
                I have an account
              </Link>
            </div>
          </div>
          <EditorPreview />
        </section>

        <section className="border-t border-neutral-100 bg-neutral-50/70">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-neutral-200 bg-white p-6">
                <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-semibold text-neutral-900">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-neutral-500 sm:px-6">
        <Logo />
        <span>Built with MongoDB, Express, React, and Node.js</span>
      </footer>
    </div>
  )
}

export default Landing
