import {
  type CodeBlockToolsMode,
  createEditor,
  type EditorHandle,
  type FeatureName,
  type Locale,
} from '@altmanlib/milkdown-kit'
import {
  type CSSProperties,
  type Ref,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

export interface MdEditorProps {
  /**
   * Markdown content kept in sync with the editor: external changes are written into it.
   * Omit it to leave the editor uncontrolled and start from `defaultValue`.
   */
  value?: string
  /** Creation-time only. Initial content when `value` is omitted. */
  defaultValue?: string
  readonly?: boolean
  /** Creation-time only. */
  placeholder?: string
  /** Creation-time only. */
  uploadImage?: (file: File) => Promise<string>
  /** Creation-time only. */
  features?: Partial<Record<FeatureName, boolean>>
  /** Creation-time only. */
  locale?: Locale
  /** Creation-time only. Defaults to `always`. */
  codeBlockTools?: CodeBlockToolsMode
  /** Fired with the serialized Markdown, debounced by the editor (200ms). */
  onChange?: (markdown: string) => void
  /** Fired once after the editor is created. */
  onReady?: (editor: EditorHandle) => void
  className?: string
  style?: CSSProperties
  /** Imperative handle; `null` until the editor is ready. */
  ref?: Ref<EditorHandle | null>
}

export function MdEditor({
  value,
  defaultValue,
  readonly = false,
  placeholder,
  uploadImage,
  features,
  locale,
  codeBlockTools,
  onChange,
  onReady,
  className,
  style,
  ref,
}: MdEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<EditorHandle | null>(null)
  // The last value known to be in sync with the editor. External updates equal to it
  // are echoes of our own onChange and must not be written back (avoids cursor jumps).
  const syncedValueRef = useRef(value ?? defaultValue ?? '')
  const valueRef = useRef(value)
  const readonlyRef = useRef(readonly)
  const onChangeRef = useRef(onChange)
  const onReadyRef = useRef(onReady)

  useLayoutEffect(() => {
    valueRef.current = value
    readonlyRef.current = readonly
    onChangeRef.current = onChange
    onReadyRef.current = onReady
  })

  useImperativeHandle<EditorHandle | null, EditorHandle | null>(ref, () => editor, [editor])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    let cancelled = false
    let instance: EditorHandle | null = null

    void (async () => {
      const created = await createEditor(root, {
        defaultValue: syncedValueRef.current,
        readonly: readonlyRef.current,
        placeholder,
        uploadImage,
        features,
        locale,
        codeBlockTools,
        onChange: (markdown) => {
          syncedValueRef.current = markdown
          onChangeRef.current?.(markdown)
        },
      })
      if (cancelled) {
        await created.destroy()
        return
      }
      instance = created
      if (valueRef.current !== undefined && valueRef.current !== syncedValueRef.current) {
        syncedValueRef.current = valueRef.current
        created.setMarkdown(valueRef.current)
      }
      created.setReadonly(readonlyRef.current)
      // Expose the handle in state first; onReady runs after the ref commit below.
      setEditor(created)
    })()

    return () => {
      cancelled = true
      setEditor(null)
      void instance?.destroy()
    }
    // Creation-time props only. value / readonly / onChange are handled separately.
  }, [])

  // Fire onReady only after useImperativeHandle has committed the current editor.
  useLayoutEffect(() => {
    if (!editor) return
    onReadyRef.current?.(editor)
  }, [editor])

  useEffect(() => {
    if (!editor || value === undefined || value === syncedValueRef.current) return
    syncedValueRef.current = value
    editor.setMarkdown(value)
  }, [editor, value])

  useEffect(() => {
    editor?.setReadonly(readonly)
  }, [editor, readonly])

  return (
    <div
      ref={rootRef}
      className={className ? `md-editor-host ${className}` : 'md-editor-host'}
      style={style}
    />
  )
}
