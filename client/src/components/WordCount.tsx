import { useEditorState, type Editor } from '@tiptap/react'

function WordCount({ editor }: { editor: Editor }) {
  const words = useEditorState({
    editor,
    selector: ({ editor }) => editor.getText().split(/\s+/).filter(Boolean).length,
  })

  return (
    <span className="text-xs text-neutral-500 tabular-nums">
      {words} {words === 1 ? 'word' : 'words'}
    </span>
  )
}

export default WordCount
