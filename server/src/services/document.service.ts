import { isValidObjectId } from 'mongoose'
import { DocumentModel } from '../models/Document.js'
import { AppError } from './errors.js'

const PREVIEW_LENGTH = 140

interface TiptapNode {
  type?: string
  text?: string
  content?: TiptapNode[]
}

// Collects the visible text of a Tiptap tree for the dashboard preview.
function extractPreview(node: TiptapNode): string {
  const parts: string[] = []

  function walk(n: TiptapNode) {
    if (parts.join(' ').length > PREVIEW_LENGTH) return
    if (typeof n.text === 'string') parts.push(n.text)
    n.content?.forEach(walk)
  }

  walk(node)
  return parts.join(' ').replace(/\s+/g, ' ').trim().slice(0, PREVIEW_LENGTH)
}

// The same 404 is used for "does not exist", "belongs to someone else" and
// "not a valid id", so a user cannot discover which document ids exist.
const notFound = () => new AppError(404, 'Document not found')

function toDocumentDto(doc: {
  _id: { toString(): string }
  title: string
  content: unknown
  revision: number
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    revision: doc.revision,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

// Every query below filters by ownerId as well as _id. That filter is the
// authorization check: a document owned by someone else simply does not match.

export async function listDocuments(ownerId: string) {
  const docs = await DocumentModel.find({ ownerId })
    .select('title preview revision updatedAt')
    .sort({ updatedAt: -1 })
    .lean()

  return docs.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    preview: doc.preview,
    revision: doc.revision,
    updatedAt: doc.updatedAt,
  }))
}

export async function createDocument(ownerId: string, title?: string) {
  const doc = await DocumentModel.create({ ownerId, ...(title ? { title } : {}) })
  return toDocumentDto(doc)
}

export async function getDocument(ownerId: string, id: string) {
  if (!isValidObjectId(id)) throw notFound()

  const doc = await DocumentModel.findOne({ _id: id, ownerId })
  if (!doc) throw notFound()

  return toDocumentDto(doc)
}

export async function updateDocument(
  ownerId: string,
  id: string,
  changes: { title?: string; content?: TiptapNode; baseRevision: number },
) {
  if (!isValidObjectId(id)) throw notFound()

  const set: Record<string, unknown> = {}
  if (changes.title !== undefined) set.title = changes.title
  if (changes.content !== undefined) {
    set.content = changes.content
    set.preview = extractPreview(changes.content)
  }

  // Check and update in one atomic operation. Reading the revision first and
  // writing afterwards would let two saves both pass the check.
  const doc = await DocumentModel.findOneAndUpdate(
    { _id: id, ownerId, revision: changes.baseRevision },
    { $set: set, $inc: { revision: 1 } },
    { new: true },
  )
  if (doc) return toDocumentDto(doc)

  // No match: either the document is gone/not ours, or the revision moved on.
  const exists = await DocumentModel.exists({ _id: id, ownerId })
  if (!exists) throw notFound()
  throw new AppError(409, 'This document was changed somewhere else. Reload to get the latest version.')
}

export async function deleteDocument(ownerId: string, id: string) {
  if (!isValidObjectId(id)) throw notFound()

  const result = await DocumentModel.deleteOne({ _id: id, ownerId })
  if (result.deletedCount === 0) throw notFound()
}
