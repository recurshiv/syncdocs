import { useCallback, useEffect, useState } from 'react'
import { FilePlus, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ApiError, errorMessage } from '../api/client.ts'
import { createDocument, deleteDocument, listDocuments, updateDocument } from '../api/documents.ts'
import DocumentRow from '../components/DocumentRow.tsx'
import LoadingSpinner from '../components/LoadingSpinner.tsx'
import Navbar from '../components/Navbar.tsx'
import type { DocumentSummary } from '../types/document.ts'

const byNewest = (a: DocumentSummary, b: DocumentSummary) => b.updatedAt.localeCompare(a.updatedAt)

function Dashboard() {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

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

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">My Documents</h1>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            <FilePlus className="size-4" aria-hidden="true" />
            {creating ? 'Creating…' : 'New Document'}
          </button>
        </div>

        {actionError && (
          <p role="alert" className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {actionError}
          </p>
        )}

        {loadError ? (
          <div className="rounded-xl border border-red-200 bg-white px-6 py-10 text-center">
            <p className="text-sm text-red-700">Couldn't load your documents: {loadError}</p>
            <button type="button" onClick={() => void load()} className="mt-3 text-sm font-medium text-indigo-600 hover:underline">
              Try again
            </button>
          </div>
        ) : documents === null ? (
          <LoadingSpinner label="Loading documents…" />
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
            <FileText className="mb-4 size-10 text-neutral-300" aria-hidden="true" />
            <h2 className="text-base font-medium text-neutral-900">No documents yet</h2>
            <p className="mt-1 max-w-sm text-sm text-neutral-500">
              Create your first document to start writing. Your documents will appear here, most recently edited first.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onRename={(title) => handleRename(doc, title)}
                onDelete={() => handleDelete(doc)}
              />
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

export default Dashboard
