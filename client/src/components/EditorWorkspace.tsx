import { useEffect, useRef, useState } from 'react'
import { EditorContent, useEditor, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { ArrowLeft } from 'lucide-react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useAutosave } from '../hooks/useAutosave.ts'
import type { DocumentDetail } from '../types/document.ts'
import EditorToolbar from './EditorToolbar.tsx'
import SaveStatus from './SaveStatus.tsx'

const DEFAULT_TITLE = 'Untitled document'

// The editor for one loaded document. Rendered with key={document.id}, so
// switching documents starts with fresh editor and autosave state.
function EditorWorkspace({ document }: { document: DocumentDetail }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(document.title)

  // Autosave reads these when it sends a request, so it always gets the latest values.
  const titleRef = useRef(document.title)
  const editorRef = useRef<Editor | null>(null)

  const autosave = useAutosave({
    documentId: document.id,
    initialRevision: document.revision,
    getSnapshot: () => ({
      title: titleRef.current.trim() || DEFAULT_TITLE,
      content: editorRef.current?.getJSON() ?? document.content,
    }),
  })
  const { markDirty, saveNow, status, hasUnsavedChanges } = autosave

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } })],
    content: document.content,
    editorProps: {
      attributes: { class: 'tiptap-content', 'aria-label': 'Document content' },
    },
    // markDirty is stable, so the callback captured here never goes stale.
    onUpdate: () => markDirty(),
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  function handleTitleChange(value: string) {
    setTitle(value)
    titleRef.current = value
    markDirty()
  }

  // Leaving the editor inside the app (back button, browser back): try to save
  // first, and only ask the user if the save cannot be confirmed.
  const blocker = useBlocker(hasUnsavedChanges)
  const [leaveFailed, setLeaveFailed] = useState(false)

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    let cancelled = false
    saveNow().then((ok) => {
      if (cancelled) return
      if (ok) blocker.proceed()
      else setLeaveFailed(true)
    })
    return () => {
      cancelled = true
    }
  }, [blocker, saveNow])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-2 sm:gap-3 sm:px-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            aria-label="Back to dashboard"
            title="Back to dashboard"
            className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
          >
            <ArrowLeft className="size-5" aria-hidden="true" />
          </button>

          <input
            aria-label="Document title"
            value={title}
            maxLength={200}
            placeholder={DEFAULT_TITLE}
            onChange={(e) => handleTitleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && editor?.commands.focus('start')}
            className="min-w-0 flex-1 truncate rounded-md px-2 py-1 text-base font-medium outline-none hover:bg-neutral-100 focus:bg-white focus:ring-2 focus:ring-indigo-500/30 sm:text-lg"
          />

          <SaveStatus status={status} onRetry={() => void autosave.retry()} />
        </div>

        {editor && (
          <div className="mx-auto max-w-5xl border-t border-neutral-100">
            <EditorToolbar editor={editor} />
          </div>
        )}
      </header>

      <main className="flex-1 px-2 py-6 sm:px-4 sm:py-10">
        {/* Clicking the page margins focuses the editor, like a real document. */}
        <div
          onClick={(e) => e.target === e.currentTarget && editor?.commands.focus('end')}
          className="mx-auto min-h-[70vh] max-w-3xl cursor-text rounded-lg border border-neutral-200 bg-white px-5 py-8 shadow-sm sm:px-14 sm:py-12"
        >
          <EditorContent editor={editor} />
        </div>
      </main>

      {blocker.state === 'blocked' && leaveFailed && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/30 px-4" role="dialog" aria-modal="true" aria-labelledby="leave-title">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 id="leave-title" className="text-base font-semibold">
              Your latest changes aren't saved
            </h2>
            <p className="mt-2 text-sm text-neutral-600">
              {status === 'conflict'
                ? 'This document was changed somewhere else, so your edits could not be saved.'
                : "We couldn't reach the server. If you leave now, your recent edits will be lost."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setLeaveFailed(false)
                  blocker.reset()
                }}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
              >
                Stay
              </button>
              <button type="button" onClick={() => blocker.proceed()} className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white">
                Leave anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EditorWorkspace
