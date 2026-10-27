import type { JSONContent } from '@tiptap/react'

// One row of GET /api/documents. No content, so the dashboard stays light.
export interface DocumentSummary {
  id: string
  title: string
  preview: string
  revision: number
  updatedAt: string
}

// A full document from GET /api/documents/:id.
export interface DocumentDetail {
  id: string
  title: string
  content: JSONContent
  revision: number
  createdAt: string
  updatedAt: string
}
