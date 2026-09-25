---
'@altmanlib/milkdown-kit': minor
---

Breaking changes from the pre-1.0 API review:

- Feature toggles are renamed after what users see: `code-mirror` is now `code-block` and `block-edit` is now `block-menu`. `cursor` and `list-item` can no longer be turned off.
- The `--md-editor-color-surface-low`, `-secondary`, `-on-secondary`, `-inverse` and `-on-inverse` tokens are removed. The colors they set are now derived from `--md-editor-color-background`, `-selected`, `-primary` and `-on-background`.
- The slash menu's internal CSS variables are renamed to `--md-editor-internal-menu-*`.
