export type FeatureName =
  | 'cursor'
  | 'list-item'
  | 'link-tooltip'
  | 'image-block'
  | 'block-edit'
  | 'placeholder'
  | 'toolbar'
  | 'code-mirror'
  | 'table'

export type Locale = 'zh-CN' | 'en'

export interface MdEditorOptions {
  /** Initial Markdown content. */
  defaultValue?: string
  readonly?: boolean
  /** Overrides the locale's default placeholder text. */
  placeholder?: string
  /** Called with the serialized Markdown, debounced by the editor (200ms). */
  onChange?: (markdown: string) => void
  /** Uploads an image and resolves to its URL. Without it, images can only be inserted by URL. */
  uploadImage?: (file: File) => Promise<string>
  /** All features are enabled by default; set a feature to `false` to disable it. */
  features?: Partial<Record<FeatureName, boolean>>
  /** Defaults to `zh-CN`. */
  locale?: Locale
  /**
   * Visibility of the code block tools (language picker, copy button).
   * `always` (default) keeps them visible; `hover` shows them on pointer hover only,
   * except on devices without hover support, where they are always visible.
   */
  codeBlockTools?: CodeBlockToolsMode
}

export type CodeBlockToolsMode = 'always' | 'hover'

export interface EditorHandle {
  getMarkdown(): string
  /** Replaces the whole document and resets undo history. */
  setMarkdown(markdown: string): void
  setReadonly(readonly: boolean): void
  focus(): void
  destroy(): Promise<void>
}
