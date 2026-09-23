---
'@altmanlib/milkdown-kit': minor
'@altmanlib/milkdown-kit-vue': minor
---

Move the Vue component to the new `@altmanlib/milkdown-kit-vue` package. The `@altmanlib/milkdown-kit/vue` entry is removed: install `@altmanlib/milkdown-kit-vue`, import `MdEditor` from it and styles from `@altmanlib/milkdown-kit-vue/style.css`. `@altmanlib/milkdown-kit` keeps the framework-agnostic `createEditor()` and `style.css`.
