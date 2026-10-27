import type { RequestHandler } from 'express'
import type { PublicUser } from '../services/auth.service.js'
import {
  createDocument,
  deleteDocument,
  getDocument,
  listDocuments,
  updateDocument,
} from '../services/document.service.js'

// requireAuth runs before every document route, so the user is always set.
// The owner always comes from the session, never from the request body.
const currentUserId = (res: Parameters<RequestHandler>[1]) => (res.locals.user as PublicUser).id

// Express types route params as string | string[]; ours is always a single segment.
const documentId = (req: Parameters<RequestHandler>[0]) => String(req.params.id)

export const listDocumentsController: RequestHandler = async (_req, res) => {
  const documents = await listDocuments(currentUserId(res))
  res.json({ documents })
}

export const createDocumentController: RequestHandler = async (req, res) => {
  const document = await createDocument(currentUserId(res), req.body.title)
  res.status(201).json({ document })
}

export const getDocumentController: RequestHandler = async (req, res) => {
  const document = await getDocument(currentUserId(res), documentId(req))
  res.json({ document })
}

export const updateDocumentController: RequestHandler = async (req, res) => {
  const document = await updateDocument(currentUserId(res), documentId(req), req.body)
  res.json({ document })
}

export const deleteDocumentController: RequestHandler = async (req, res) => {
  await deleteDocument(currentUserId(res), documentId(req))
  res.status(204).end()
}
