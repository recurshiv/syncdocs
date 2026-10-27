import { Schema, Types, model } from 'mongoose'

export const EMPTY_DOC = { type: 'doc', content: [{ type: 'paragraph' }] }

const documentSchema = new Schema(
  {
    ownerId: { type: Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200, default: 'Untitled document' },
    // Tiptap's JSON tree, stored as-is. Mixed means Mongoose does not check its shape;
    // the request schema validates it before it gets here.
    content: { type: Schema.Types.Mixed, required: true, default: () => EMPTY_DOC },
    // Plain-text excerpt for the dashboard, so the list never loads full content.
    preview: { type: String, default: '' },
    // Incremented on every update. A save must say which revision it was based on;
    // if that is no longer the current revision, the save is rejected as a conflict.
    revision: { type: Number, required: true, default: 0 },
  },
  // minimize: false keeps empty objects inside content instead of dropping them.
  { timestamps: true, minimize: false },
)

// Serves the dashboard query: "this owner's documents, newest first".
documentSchema.index({ ownerId: 1, updatedAt: -1 })

export const DocumentModel = model('Document', documentSchema)
