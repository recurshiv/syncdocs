import { Router } from 'express'
import {
  createDocumentController,
  deleteDocumentController,
  getDocumentController,
  listDocumentsController,
  updateDocumentController,
} from '../controllers/document.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { validateBody } from '../middleware/validate.js'
import { createDocumentSchema, updateDocumentSchema } from '../validation/document.schemas.js'

export const documentRouter = Router()

// Every document route needs a logged-in user.
documentRouter.use(requireAuth)

documentRouter.get('/', listDocumentsController)
documentRouter.post('/', validateBody(createDocumentSchema), createDocumentController)
documentRouter.get('/:id', getDocumentController)
documentRouter.patch('/:id', validateBody(updateDocumentSchema), updateDocumentController)
documentRouter.delete('/:id', deleteDocumentController)
