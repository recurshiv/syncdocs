import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, errorMessage } from '../api/client.ts'
import { getDocument } from '../api/documents.ts'
import EditorWorkspace from '../components/EditorWorkspace.tsx'
import LoadingSpinner from '../components/LoadingSpinner.tsx'
import type { DocumentDetail } from '../types/document.ts'

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; document: DocumentDetail }

function DocumentEditor() {
  const { id = '' } = useParams()
  const [state, setState] = useState<LoadState>({ status: 'loading' })

  useEffect(() => {
    // Ignore a slow response if the user has already moved to another document.
    let cancelled = false

    getDocument(id)
      .then((document) => !cancelled && setState({ status: 'ready', document }))
      .catch((err) => {
        if (cancelled) return
        const message =
          err instanceof ApiError && err.status === 404
            ? "This document doesn't exist, or you don't have access to it."
            : errorMessage(err)
        setState({ status: 'error', message })
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (state.status === 'loading') return <LoadingSpinner label="Opening document…" />

  if (state.status === 'error') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-lg font-semibold">Can't open this document</h1>
        <p className="mt-2 max-w-sm text-sm text-neutral-600">{state.message}</p>
        <Link to="/dashboard" className="mt-6 text-sm font-medium text-indigo-600 hover:underline">
          Back to my documents
        </Link>
      </div>
    )
  }

  return <EditorWorkspace key={state.document.id} document={state.document} />
}

export default DocumentEditor
