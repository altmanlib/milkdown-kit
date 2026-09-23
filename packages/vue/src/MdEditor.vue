<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from 'vue'

import {
  type CodeBlockToolsMode,
  createEditor,
  type EditorHandle,
  type FeatureName,
  type Locale,
} from '@altmanlib/milkdown-kit'

export interface MdEditorProps {
  /** Markdown content, used with `v-model`. */
  modelValue?: string
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
}

const props = withDefaults(defineProps<MdEditorProps>(), {
  modelValue: '',
  readonly: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'ready': [editor: EditorHandle]
}>()

const root = useTemplateRef<HTMLDivElement>('root')
const editor = shallowRef<EditorHandle | null>(null)

// The last value known to be in sync with the editor. External updates equal to it
// are echoes of our own emits and must not be written back (avoids cursor jumps).
let syncedValue = props.modelValue
let unmounted = false

onMounted(async () => {
  const instance = await createEditor(root.value!, {
    defaultValue: props.modelValue,
    readonly: props.readonly,
    placeholder: props.placeholder,
    uploadImage: props.uploadImage,
    features: props.features,
    locale: props.locale,
    codeBlockTools: props.codeBlockTools,
    onChange: (markdown) => {
      syncedValue = markdown
      emit('update:modelValue', markdown)
    },
  })
  if (unmounted) {
    await instance.destroy()
    return
  }
  editor.value = instance
  // Catch up with changes made while the editor was being created.
  if (props.modelValue !== syncedValue) {
    syncedValue = props.modelValue
    instance.setMarkdown(props.modelValue)
  }
  instance.setReadonly(props.readonly)
  emit('ready', instance)
})

watch(
  () => props.modelValue,
  (value) => {
    if (!editor.value || value === syncedValue) return
    syncedValue = value
    editor.value.setMarkdown(value)
  },
)

watch(
  () => props.readonly,
  (value) => editor.value?.setReadonly(value),
)

onBeforeUnmount(() => {
  unmounted = true
  void editor.value?.destroy()
  editor.value = null
})

defineExpose({ editor })
</script>

<template>
  <div ref="root" class="md-editor-host" />
</template>
