import { FileText } from 'lucide-react'

function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className={`flex items-center gap-2 text-[17px] font-semibold tracking-tight ${inverted ? 'text-white' : 'text-neutral-900'}`}>
      <span className={`flex size-8 items-center justify-center rounded-lg ${inverted ? 'bg-white/15' : 'bg-indigo-600'}`}>
        <FileText className="size-4.5 text-white" aria-hidden="true" />
      </span>
      SyncDocs
    </span>
  )
}

export default Logo
