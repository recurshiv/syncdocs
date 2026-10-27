import { useCallback, useEffect, useRef, useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import { ApiError } from '../api/client.ts'
import { updateDocument } from '../api/documents.ts'

export const AUTOSAVE_DELAY_MS = 800

// saved:    the server has confirmed every edit
// unsaved:  edits exist that have not been sent yet
// saving:   a request is in flight
// error:    the last save failed; edits are kept and retried on the next change
// conflict: the server has a newer revision; saving stops until reload
export type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error' | 'conflict'

export interface Snapshot {
  title: string
  content: JSONContent
}

interface Options {
  documentId: string
  initialRevision: number
  // Called at send time, so each save carries the newest title and content.
  getSnapshot: () => Snapshot
}

export function useAutosave({ documentId, initialRevision, getSnapshot }: Options) {
  const [status, setStatus] = useState<SaveStatus>('saved')

  const getSnapshotRef = useRef(getSnapshot)
  useEffect(() => {
    getSnapshotRef.current = getSnapshot
  })

  // Refs, not state: the save loop must read the current values, not the
  // values from the render in which it started.
  const revisionRef = useRef(initialRevision) // last revision the server confirmed
  const dirtyRef = useRef(false) // edits exist that are not in any request yet
  const savingRef = useRef<Promise<void> | null>(null) // the running save loop
  const conflictRef = useRef(false) // set on 409; no more saves after that
  const timerRef = useRef<number | undefined>(undefined)

  // Sends one save at a time, repeating while new edits keep arriving. Requests
  // never overlap, so an older save can never land after a newer one.
  const runSaves = useCallback(async () => {
    while (dirtyRef.current && !conflictRef.current) {
      // Clear the flag before taking the snapshot. Edits made while this request
      // is in flight set it again, and the loop sends another save for them.
      dirtyRef.current = false
      const snapshot = getSnapshotRef.current()
      setStatus('saving')

      try {
        const saved = await updateDocument(documentId, { ...snapshot, baseRevision: revisionRef.current })
        revisionRef.current = saved.revision
      } catch (err) {
        // The edits are still only in the editor. Keep them marked unsaved.
        dirtyRef.current = true
        if (err instanceof ApiError && err.status === 409) {
          conflictRef.current = true
          setStatus('conflict')
        } else {
          setStatus('error')
        }
        return
      }
    }

    if (!conflictRef.current) setStatus('saved')
  }, [documentId])

  // Starts the save loop now, or returns the one already running.
  const flush = useCallback(() => {
    window.clearTimeout(timerRef.current)
    savingRef.current ??= runSaves().finally(() => {
      savingRef.current = null
    })
    return savingRef.current
  }, [runSaves])

  // Call on every edit. Saves once typing pauses for AUTOSAVE_DELAY_MS.
  const markDirty = useCallback(() => {
    dirtyRef.current = true
    if (conflictRef.current) return
    setStatus('unsaved')
    window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => void flush(), AUTOSAVE_DELAY_MS)
  }, [flush])

  // Saves immediately. Resolves to true only if every edit reached the server.
  const saveNow = useCallback(async () => {
    await flush()
    return !dirtyRef.current && !conflictRef.current
  }, [flush])

  // Closing or reloading the tab: ask the browser to warn while edits are unsaved.
  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (dirtyRef.current || savingRef.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // A timer must not fire after the editor is gone.
  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  return {
    status,
    hasUnsavedChanges: status !== 'saved',
    markDirty,
    saveNow,
    retry: flush,
  }
}
