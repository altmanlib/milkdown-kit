import type { FeatureConfigs } from '../core/features'
import type { Locale } from '../core/types'

export interface LocaleMessages {
  placeholder: string
  /** Image placeholder text used when no `uploadImage` is provided. */
  imageUrlOnlyText: string
  /** Text-only feature configs; unspecified fields fall back to Crepe's English defaults. */
  features: Pick<FeatureConfigs, 'block-edit' | 'toolbar' | 'link-tooltip' | 'image-block' | 'code-mirror'>
}

const zhCN: LocaleMessages = {
  placeholder: '输入 / 插入内容',
  imageUrlOnlyText: '粘贴图片链接',
  features: {
    'block-edit': {
      textGroup: {
        label: '文本',
        text: { label: '正文' },
        h1: { label: '一级标题' },
        h2: { label: '二级标题' },
        h3: { label: '三级标题' },
        h4: { label: '四级标题' },
        h5: { label: '五级标题' },
        h6: { label: '六级标题' },
        quote: { label: '引用' },
        divider: { label: '分割线' },
      },
      listGroup: {
        label: '列表',
        bulletList: { label: '无序列表' },
        orderedList: { label: '有序列表' },
        taskList: { label: '任务列表' },
      },
      advancedGroup: {
        label: '高级',
        image: { label: '图片' },
        codeBlock: { label: '代码块' },
        table: { label: '表格' },
      },
    },
    'toolbar': {
      boldLabel: '粗体',
      italicLabel: '斜体',
      strikethroughLabel: '删除线',
      codeLabel: '行内代码',
      linkLabel: '链接',
    },
    'link-tooltip': {
      inputPlaceholder: '粘贴链接…',
    },
    'image-block': {
      inlineUploadButton: '上传',
      inlineUploadPlaceholderText: '或粘贴图片链接',
      blockUploadButton: '上传图片',
      blockConfirmButton: '确定',
      blockCaptionPlaceholderText: '添加图片说明',
      blockUploadPlaceholderText: '或粘贴图片链接',
    },
    'code-mirror': {
      searchPlaceholder: '搜索语言',
      noResultText: '无匹配结果',
      copyText: '复制',
      previewLabel: '预览',
      previewLoading: '加载中…',
      previewToggleText: (previewOnlyMode) => (previewOnlyMode ? '编辑' : '隐藏'),
    },
  },
}

const en: LocaleMessages = {
  placeholder: 'Type / for commands',
  imageUrlOnlyText: 'Paste image link',
  features: {},
}

const MESSAGES: Record<Locale, LocaleMessages> = { 'zh-CN': zhCN, en }

export function getMessages(locale: Locale): LocaleMessages {
  return MESSAGES[locale]
}
