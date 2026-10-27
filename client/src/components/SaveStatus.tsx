import { AlertCircle, Check, Loader2 } from 'lucide-react'
import type { SaveStatus as Status } from '../hooks/useAutosave.ts'

function SaveStatus({ status, onRetry }: { status: Status; onRetry: () => void }) {
  return (
    <div aria-live="polite" className="flex shrink-0 items-center gap-1.5 text-sm">
      {status === 'saved' && (
        <span className="flex items-center gap-1.5 text-neutral-500">
          <Check className="size-4" aria-hidden="true" />
          Saved
        </span>
      )}
      {status === 'unsaved' && <span className="text-neutral-500">Unsaved changes</span>}
      {status === 'saving' && (
        <span className="flex items-center gap-1.5 text-neutral-500">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Saving…
        </span>
      )}
      {status === 'error' && (
        <span className="flex items-center gap-1.5 text-red-600">
          <AlertCircle className="size-4" aria-hidden="true" />
          Couldn't save
          <button type="button" onClick={onRetry} className="font-medium underline">
            Retry
          </button>
        </span>
      )}
      {status === 'conflict' && (
        <span className="flex items-center gap-1.5 text-amber-700">
          <AlertCircle className="size-4" aria-hidden="true" />
          Changed elsewhere
          <button type="button" onClick={() => window.location.reload()} className="font-medium underline">
            Reload
          </button>
        </span>
      )}
    </div>
  )
}

export default SaveStatus
