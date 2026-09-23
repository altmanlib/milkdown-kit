import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'

import { type EditorHandle, MdEditor } from '../src'

async function waitForReady(wrapper: ReturnType<typeof mount>): Promise<EditorHandle> {
  for (let i = 0; i < 50; i++) {
    await flushPromises()
    const events = wrapper.emitted('ready')
    if (events) return events[0]![0] as EditorHandle
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('editor did not become ready')
}

describe('MdEditor', () => {
  it('renders the initial modelValue and exposes the handle', async () => {
    const wrapper = mount(MdEditor, { props: { modelValue: '# Title\n' }, attachTo: document.body })
    const handle = await waitForReady(wrapper)
    expect(handle.getMarkdown()).toBe('# Title\n')
    expect((wrapper.vm as unknown as { editor: EditorHandle | null }).editor).toBe(handle)
    wrapper.unmount()
  })

  it('writes external modelValue changes into the editor', async () => {
    const wrapper = mount(MdEditor, { props: { modelValue: 'a\n' }, attachTo: document.body })
    const handle = await waitForReady(wrapper)
    await wrapper.setProps({ modelValue: 'b\n' })
    expect(handle.getMarkdown()).toBe('b\n')
    wrapper.unmount()
  })

  it('does not write back values it emitted itself', async () => {
    const model = ref('a\n')
    let setCalls = 0
    const Host = defineComponent({
      setup() {
        return () =>
          h(MdEditor, {
            'modelValue': model.value,
            'onUpdate:modelValue': (value: string) => (model.value = value),
            'onReady': (handle: EditorHandle) => {
              const original = handle.setMarkdown
              handle.setMarkdown = (markdown) => {
                setCalls++
                original(markdown)
              }
            },
          })
      },
    })
    const wrapper = mount(Host, { attachTo: document.body })
    await waitForReady(wrapper.findComponent(MdEditor) as unknown as ReturnType<typeof mount>)

    const paragraph = wrapper.element.querySelector('.ProseMirror p')!
    paragraph.textContent = 'typed'
    await new Promise((resolve) => setTimeout(resolve, 400))
    await nextTick()

    expect(model.value).toBe('typed\n')
    expect(setCalls).toBe(0)
    wrapper.unmount()
  })

  it('reacts to readonly changes', async () => {
    const wrapper = mount(MdEditor, { props: { readonly: false }, attachTo: document.body })
    await waitForReady(wrapper)
    const view = wrapper.element.querySelector('.ProseMirror')!
    expect(view.getAttribute('contenteditable')).toBe('true')
    await wrapper.setProps({ readonly: true })
    expect(view.getAttribute('contenteditable')).toBe('false')
    wrapper.unmount()
  })

  it('destroys the editor on unmount', async () => {
    const wrapper = mount(MdEditor, { attachTo: document.body })
    await waitForReady(wrapper)
    const host = wrapper.element as HTMLElement
    wrapper.unmount()
    await flushPromises()
    expect(host.querySelector('.md-editor')).toBeNull()
  })

  it('cleans up when unmounted before the editor is ready', async () => {
    const wrapper = mount(MdEditor, { attachTo: document.body })
    const host = wrapper.element as HTMLElement
    wrapper.unmount()
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(host.querySelector('.md-editor')).toBeNull()
  })
})
