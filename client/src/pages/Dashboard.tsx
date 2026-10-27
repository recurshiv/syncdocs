import { useCallback, useEffect, useState } from 'react'
import { FilePlus, FileText, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ApiError, errorMessage } from '../api/client.ts'
import { createDocument, deleteDocument, listDocuments, updateDocument } from '../api/documents.ts'
import DocumentCard from '../components/DocumentCard.tsx'
import LoadingSpinner from '../components/LoadingSpinner.tsx'
import Navbar from '../components/Navbar.tsx'
import { useAuth } from '../hooks/useAuth.ts'
import type { DocumentSummary } from '../types/document.ts'

const byNewest = (a: DocumentSummary, b: DocumentSummary) => b.updatedAt.localeCompare(a.updatedAt)

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    try {
      setDocuments(await listDocuments())
      setLoadError(null)
    } catch (err) {
      setLoadError(errorMessage(err))
    }
  }, [])

  // Initial load. The cancel flag ignores a response that arrives after unmount.
  useEffect(() => {
    let cancelled = false
    listDocuments()
      .then((docs) => !cancelled && setDocuments(docs))
      .catch((err) => !cancelled && setLoadError(errorMessage(err)))
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreate() {
    setActionError(null)
    setCreating(true)
    try {
      const doc = await createDocument()
      navigate(`/document/${doc.id}`)
    } catch (err) {
      setActionError(errorMessage(err))
      setCreating(false)
    }
  }

  async function handleRename(doc: DocumentSummary, title: string) {
    setActionError(null)
    try {
      const updated = await updateDocument(doc.id, { title, baseRevision: doc.revision })
      setDocuments((docs) =>
        docs!
          .map((d) => (d.id === doc.id ? { ...d, title: updated.title, revision: updated.revision, updatedAt: updated.updatedAt } : d))
          .sort(byNewest),
      )
      return true
    } catch (err) {
      setActionError(errorMessage(err))
      // A conflict or missing document means our list is out of date.
      if (err instanceof ApiError && (err.status === 409 || err.status === 404)) void load()
      return false
    }
  }

  async function handleDelete(doc: DocumentSummary) {
    setActionError(null)
    try {
      await deleteDocument(doc.id)
      setDocuments((docs) => docs!.filter((d) => d.id !== doc.id))
      return true
    } catch (err) {
      setActionError(errorMessage(err))
      if (err instanceof ApiError && err.status === 404) void load()
      return false
    }
  }

  // Search filters the loaded list by title and preview text.
  const normalizedQuery = query.trim().toLowerCase()
  const visible = documents?.filter(
    (d) => !normalizedQuery || d.title.toLowerCase().includes(normalizedQuery) || d.preview.toLowerCase().includes(normalizedQuery),
  )

  const newButton = (
    <button
      type="button"
      onClick={handleCreate}
      disabled={creating}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60"
    >
      <FilePlus className="size-4" aria-hidden="true" />
      {creating ? 'Creating…' : 'New Document'}
    </button>
  )

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              {greeting()}
              {user ? `, ${user.name.split(' ')[0]}` : ''}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-neutral-900">My Documents</h1>
            {documents && documents.length > 0 && (
              <p className="mt-1 text-sm text-neutral-500">
                {documents.length} {documents.length === 1 ? 'document' : 'documents'} · most recently edited first
              </p>
            )}
          </div>
          {newButton}
        </div>

        {documents && documents.length > 0 && (
          <div className="relative mt-8 max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              type="search"
              aria-label="Search documents"
              placeholder="Search by title or content"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white py-2.5 pr-3 pl-10 text-sm shadow-xs outline-none placeholder:text-neutral-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
            />
          </div>
        )}

        {actionError && (
          <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
            {actionError}
          </p>
        )}

        <div className="mt-8">
          {loadError ? (
            <div className="rounded-2xl border border-red-200 bg-white px-6 py-12 text-center">
              <p className="text-sm text-red-700">Couldn't load your documents: {loadError}</p>
              <button type="button" onClick={() => void load()} className="mt-3 text-sm font-semibold text-indigo-600 hover:underline">
                Try again
              </button>
            </div>
          ) : documents === null ? (
            <LoadingSpinner label="Loading documents…" />
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-neutral-200 bg-white px-6 py-20 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FileText className="size-7" aria-hidden="true" />
              </span>
              <h2 className="mt-5 text-lg font-semibold text-neutral-900">No documents yet</h2>
              <p className="mt-1.5 max-w-sm text-sm text-neutral-500">
                Create your first document to start writing. Everything you type is saved automatically.
              </p>
              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="mt-6 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-60"
              >
                Create your first document
              </button>
            </div>
          ) : visible!.length === 0 ? (
            <p className="py-16 text-center text-sm text-neutral-500">No documents match “{query.trim()}”.</p>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible!.map((doc) => (
                <DocumentCard key={doc.id} document={doc} onRename={(title) => handleRename(doc, title)} onDelete={() => handleDelete(doc)} />
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  )
}

export default Dashboard
