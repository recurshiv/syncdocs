import type { JSONContent } from '@tiptap/react'
import type { DocumentDetail, DocumentSummary } from '../types/document.ts'
import { apiFetch } from './client.ts'

export async function listDocuments() {
  const { documents } = await apiFetch<{ documents: DocumentSummary[] }>('/documents')
  return documents
}

export async function createDocument() {
  const { document } = await apiFetch<{ document: DocumentDetail }>('/documents', {
    method: 'POST',
    body: {},
  })
  return document
}

export async function getDocument(id: string) {
  const { document } = await apiFetch<{ document: DocumentDetail }>(`/documents/${id}`)
  return document
}

// baseRevision is the revision this change was made against. The server
// rejects the update with 409 if the document has moved on since then.
export async function updateDocument(
  id: string,
  changes: { title?: string; content?: JSONContent; baseRevision: number },
) {
  const { document } = await apiFetch<{ document: DocumentDetail }>(`/documents/${id}`, {
    method: 'PATCH',
    body: changes,
  })
  return document
}

export async function deleteDocument(id: string) {
  await apiFetch<void>(`/documents/${id}`, { method: 'DELETE' })
}
