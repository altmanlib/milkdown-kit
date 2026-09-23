# @altmanlib/milkdown-kit

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
