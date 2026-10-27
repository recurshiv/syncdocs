import { useEditorState, type Editor } from '@tiptap/react'
import { Bold, Italic, List, ListOrdered, Quote, Redo2, Undo2, type LucideIcon } from 'lucide-react'

// Detect Mac for shortcut hints in tooltips.
const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'

function ToolbarButton({
  icon: Icon,
  label,
  shortcut,
  active = false,
  disabled = false,
  onClick,
}: {
  icon: LucideIcon
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={`rounded-md p-2 transition-colors disabled:opacity-30 ${
        active ? 'bg-indigo-100 text-indigo-700' : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
      }`}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  )
}

const Divider = () => <span className="mx-1 h-5 w-px shrink-0 bg-neutral-200" aria-hidden="true" />

function EditorToolbar({ editor }: { editor: Editor }) {
  // Re-renders the toolbar only when one of these values changes,
  // instead of on every keystroke.
  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      block: editor.isActive('heading', { level: 1 })
        ? 'h1'
        : editor.isActive('heading', { level: 2 })
          ? 'h2'
          : editor.isActive('heading', { level: 3 })
            ? 'h3'
            : 'paragraph',
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
      canUndo: editor.can().undo(),
      canRedo: editor.can().redo(),
    }),
  })

  function setBlock(value: string) {
    const chain = editor.chain().focus()
    if (value === 'paragraph') chain.setParagraph().run()
    else chain.setHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run()
  }

  return (
    <div role="toolbar" aria-label="Formatting" className="flex items-center gap-0.5 overflow-x-auto px-2 py-1.5">
      <select
        aria-label="Text style"
        value={state.block}
        onChange={(e) => setBlock(e.target.value)}
        className="mr-1 shrink-0 rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-700 outline-none focus:border-indigo-500"
      >
        <option value="paragraph">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <Divider />
      <ToolbarButton icon={Bold} label="Bold" shortcut={`${mod}B`} active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton icon={Italic} label="Italic" shortcut={`${mod}I`} active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()} />

      <Divider />
      <ToolbarButton icon={List} label="Bullet list" active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton icon={ListOrdered} label="Numbered list" active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton icon={Quote} label="Quote" active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()} />

      <Divider />
      <ToolbarButton icon={Undo2} label="Undo" shortcut={`${mod}Z`} disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton icon={Redo2} label="Redo" shortcut={`${mod}Shift+Z`} disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()} />
    </div>
  )
}

export default EditorToolbar
