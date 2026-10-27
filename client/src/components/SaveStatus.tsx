import { AlertCircle, Check, Loader2 } from 'lucide-react'
import type { SaveStatus as Status } from '../hooks/useAutosave.ts'

const pill = 'flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium'

function SaveStatus({ status, onRetry }: { status: Status; onRetry: () => void }) {
  return (
    <div aria-live="polite" className="flex shrink-0 items-center">
      {status === 'saved' && (
        <span className={`${pill} bg-emerald-50 text-emerald-700`}>
          <Check className="size-3.5" aria-hidden="true" />
          Saved
        </span>
      )}
      {status === 'unsaved' && <span className={`${pill} bg-neutral-100 text-neutral-600`}>Unsaved changes</span>}
      {status === 'saving' && (
        <span className={`${pill} bg-indigo-50 text-indigo-700`}>
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          Saving…
        </span>
      )}
      {status === 'error' && (
        <span className={`${pill} bg-red-50 text-red-700`}>
          <AlertCircle className="size-3.5" aria-hidden="true" />
          Couldn't save
          <button type="button" onClick={onRetry} className="ml-0.5 font-semibold underline underline-offset-2">
            Retry
          </button>
        </span>
      )}
      {status === 'conflict' && (
        <span className={`${pill} bg-amber-50 text-amber-800`}>
          <AlertCircle className="size-3.5" aria-hidden="true" />
          Changed elsewhere
          <button type="button" onClick={() => window.location.reload()} className="ml-0.5 font-semibold underline underline-offset-2">
            Reload
          </button>
        </span>
      )}
    </div>
  )
}

export default SaveStatus
