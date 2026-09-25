# @altmanlib/milkdown-kit

## 0.4.0

### Minor Changes

- 924f7b4: Breaking changes from the pre-1.0 API review:
  
  - Feature toggles are renamed after what users see: `code-mirror` is now `code-block` and `block-edit` is now `block-menu`. `cursor` and `list-item` can no longer be turned off.
  - The `--md-editor-color-surface-low`, `-secondary`, `-on-secondary`, `-inverse` and `-on-inverse` tokens are removed. The colors they set are now derived from `--md-editor-color-background`, `-selected`, `-primary` and `-on-background`.
  - The slash menu's internal CSS variables are renamed to `--md-editor-internal-menu-*`.

## 0.3.0

### Patch Changes

- a9f0431: Add `@altmanlib/milkdown-kit-react`, a React 19 component mirroring the Vue package API with `value` / `onChange` and a `ref` that exposes `EditorHandle`

## 0.2.0

### Minor Changes

- 8de0a8c: Move the Vue component to the new `@altmanlib/milkdown-kit-vue` package. The `@altmanlib/milkdown-kit/vue` entry is removed: install `@altmanlib/milkdown-kit-vue`, import `MdEditor` from it and styles from `@altmanlib/milkdown-kit-vue/style.css`. `@altmanlib/milkdown-kit` keeps the framework-agnostic `createEditor()` and `style.css`.

## 0.1.1

### Patch Changes

- 5ddea8d: Show the link preview in an empty image block as a small thumbnail instead of a full-size image overlapping the document, and keep the confirm button on one line
- 5ddea8d: Keep the first content block's top margin stable when the editor gains focus or text is selected, so the document no longer jumps by one line

## 0.1.0

### Minor Changes

- e05a27c: Initial release: Crepe-based Markdown editor with a Vue 3 component, Chinese UI text, compact theme with CSS design tokens and dark mode, and image Markdown fixes (images without a title are no longer dropped; alt text is preserved).
