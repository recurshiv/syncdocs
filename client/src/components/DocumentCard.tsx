import { useState, type FormEvent } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
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

// One document on the dashboard: a miniature page preview with title,
// last-edited time, and rename/delete actions.
function DocumentCard({ document, onRename, onDelete }: Props) {
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
    // On success the card disappears, so only failure needs to reset state.
    if (!(await onDelete())) {
      setBusy(false)
      setMode('view')
    }
  }

  return (
    <li className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md">
      <Link to={`/document/${document.id}`} className="block bg-neutral-100/80 px-6 pt-5" tabIndex={-1} aria-hidden="true">
        <div className="h-32 overflow-hidden rounded-t-md bg-white px-4 pt-4 shadow-sm ring-1 ring-neutral-200/70">
          <p className="truncate text-[11px] font-semibold text-neutral-800">{document.title}</p>
          {document.preview ? (
            <p className="mt-1.5 line-clamp-5 text-[10px] leading-[1.45] text-neutral-500">{document.preview}</p>
          ) : (
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-11/12 rounded bg-neutral-100" />
              <div className="h-1.5 w-4/5 rounded bg-neutral-100" />
              <div className="h-1.5 w-2/3 rounded bg-neutral-100" />
            </div>
          )}
        </div>
      </Link>

      {mode === 'rename' ? (
        <form onSubmit={submitRename} className="flex flex-col gap-2 border-t border-neutral-200 p-3">
          <input
            autoFocus
            aria-label="Document title"
            maxLength={200}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Escape' && setMode('view')}
            className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMode('view')} className="rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
              Save
            </button>
          </div>
        </form>
      ) : mode === 'confirm-delete' ? (
        <div className="flex flex-col gap-3 border-t border-red-200 bg-red-50 p-3">
          <span className="text-sm text-red-800">
            Delete <strong className="font-semibold">{document.title}</strong>? This can't be undone.
          </span>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMode('view')} disabled={busy} className="rounded-lg px-3 py-1.5 text-sm text-neutral-700 hover:bg-red-100">
              Cancel
            </button>
            <button type="button" onClick={confirmDelete} disabled={busy} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60">
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-neutral-200 py-2.5 pr-2 pl-4">
          <Link to={`/document/${document.id}`} className="min-w-0 flex-1 after:absolute after:inset-0 after:content-['']">
            <span className="block truncate text-sm font-semibold text-neutral-900">{document.title}</span>
            <time dateTime={document.updatedAt} className="block text-xs text-neutral-500">
              Edited {formatUpdated(document.updatedAt)}
            </time>
          </Link>

          {/* z-10 keeps the buttons above the card-wide link overlay. */}
          <div className="relative z-10 flex shrink-0 gap-0.5 opacity-100 transition sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
            <button
              type="button"
              onClick={() => {
                setDraft(document.title)
                setMode('rename')
              }}
              aria-label={`Rename ${document.title}`}
              title="Rename"
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <Pencil className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setMode('confirm-delete')}
              aria-label={`Delete ${document.title}`}
              title="Delete"
              className="rounded-lg p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </li>
  )
}

export default DocumentCard
