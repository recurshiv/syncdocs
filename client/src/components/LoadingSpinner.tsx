import { Loader2 } from 'lucide-react'

function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-neutral-500" role="status">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  )
}

export default LoadingSpinner
