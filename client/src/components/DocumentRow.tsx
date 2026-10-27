import { useState, type FormEvent } from 'react'
import { FileText, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { DocumentSummary } from '../types/document.ts'

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString()

function formatUpdated(iso: string) {
  const date = new Date(iso)
  return sameDay(date, new Date())
    ? `Today, ${date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

interface Props {
  document: DocumentSummary
  // Both resolve to true on success. The dashboard shows any error.
  onRename: (title: string) => Promise<boolean>
  onDelete: () => Promise<boolean>
}

function DocumentRow({ document, onRename, onDelete }: Props) {
  const [mode, setMode] = useState<'view' | 'rename' | 'confirm-delete'>('view')
  const [draft, setDraft] = useState(document.title)
  const [busy, setBusy] = useState(false)

  async function submitRename(event: FormEvent) {
    event.preventDefault()
    const title = draft.trim()
    if (!title || title === document.title) {
      setMode('view')
      return
    }
    setBusy(true)
    const ok = await onRename(title)
    setBusy(false)
    if (ok) setMode('view')
  }

  async function confirmDelete() {
    setBusy(true)
    // On success the row disappears, so only failure needs to reset state.
    if (!(await onDelete())) {
      setBusy(false)
      setMode('view')
    }
  }

  if (mode === 'rename') {
    return (
      <li className="px-4 py-3">
        <form onSubmit={submitRename} className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            aria-label="Document title"
            maxLength={200}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setMode('view')}
            className="min-w-0 flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <button type="submit" disabled={busy} className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
            Save
          </button>
          <button type="button" onClick={() => setMode('view')} className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100">
            Cancel
          </button>
        </form>
      </li>
    )
  }

  if (mode === 'confirm-delete') {
    return (
      <li className="flex flex-wrap items-center justify-between gap-3 bg-red-50 px-4 py-3">
        <span className="text-sm text-red-800">
          Delete <strong className="font-semibold">{document.title}</strong>? This can't be undone.
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={confirmDelete} disabled={busy} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60">
            {busy ? 'Deleting…' : 'Delete'}
          </button>
          <button type="button" onClick={() => setMode('view')} disabled={busy} className="rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-red-100">
            Cancel
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="group flex items-center gap-2 px-2 py-1 hover:bg-neutral-50">
      <Link to={`/document/${document.id}`} className="flex min-w-0 flex-1 items-start gap-3 rounded-md px-2 py-2">
        <FileText className="mt-0.5 size-5 shrink-0 text-indigo-500" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-neutral-900">{document.title}</span>
          {document.preview && <span className="block truncate text-sm text-neutral-500">{document.preview}</span>}
        </span>
        <time dateTime={document.updatedAt} className="hidden shrink-0 pt-0.5 text-sm text-neutral-500 sm:block">
          {formatUpdated(document.updatedAt)}
        </time>
      </Link>

      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={() => {
            setDraft(document.title)
            setMode('rename')
          }}
          aria-label={`Rename ${document.title}`}
          title="Rename"
          className="rounded-md p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setMode('confirm-delete')}
          aria-label={`Delete ${document.title}`}
          title="Delete"
          className="rounded-md p-2 text-neutral-500 hover:bg-red-100 hover:text-red-700"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

export default DocumentRow
