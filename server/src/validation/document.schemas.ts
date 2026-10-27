import { z } from 'zod'

const title = z.string().trim().min(1, 'Title is required').max(200, 'Title is too long')

// Only the top level of Tiptap JSON is checked: it must be a "doc" node.
// Tiptap's editor schema drops unknown nodes when the content is loaded.
const content = z.looseObject({
  type: z.literal('doc'),
  content: z.array(z.unknown()).optional(),
})

export const createDocumentSchema = z.object({
  title: title.optional(),
})

export const updateDocumentSchema = z
  .object({
    title: title.optional(),
    content: content.optional(),
    baseRevision: z.number().int().min(0),
  })
  .refine((body) => body.title !== undefined || body.content !== undefined, {
    message: 'Nothing to update',
  })
