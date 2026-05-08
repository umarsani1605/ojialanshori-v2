import { computed, ref, toValue, watch } from 'vue'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'

const mockToastAdd = vi.fn()
const mockRouterReplace = vi.fn()

mockNuxtImport('useToast', () => {
  return () => ({
    add: mockToastAdd,
  })
})

mockNuxtImport('useRouter', () => {
  return () => ({
    replace: mockRouterReplace,
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    beforeResolve: vi.fn(),
    onError: vi.fn(),
  })
})

mockNuxtImport('useAsyncData', () => {
  return (key: string | { value: string } | (() => string), _handler?: unknown, options?: { watch?: unknown[] }) => {
    const data = ref<null | {
      id: number
      title: string
      content: string
      excerpt: null
      featuredImage: null
      categoryId: number
      status: 'draft'
      reviewNote: null
      author: { id: number, fullname: string, email: string }
      reviewer: null
      category: { id: number, name: string, type: 'pena_santri' }
    } | Array<{ id: number, name: string, type: 'pena_santri' }>>(null)
    const status = ref('success')

    const sync = () => {
      const resolvedKey = String(toValue(key))

      if (resolvedKey === 'post-editor-categories') {
        data.value = [
          { id: 2, name: 'Pena Santri', type: 'pena_santri' as const },
        ]
        return
      }

      if (resolvedKey === 'post-editor-12') {
        data.value = {
          id: 12,
          title: 'Artikel Uji',
          content: '<p>Isi</p>',
          excerpt: null,
          featuredImage: null,
          categoryId: 2,
          status: 'draft' as const,
          reviewNote: null,
          author: { id: 1, fullname: 'Admin', email: 'admin@example.com' },
          reviewer: null,
          category: { id: 2, name: 'Pena Santri', type: 'pena_santri' as const },
        }
        return
      }

      data.value = null
    }

    sync()
    watch(() => String(toValue(key)), sync)

    if (options?.watch?.length) {
      watch(options.watch as never[], sync)
    }

    return { data, status }
  }
})

mockNuxtImport('navigateTo', () => vi.fn())

vi.mock('~/app/composables/useAuth', () => ({
  useAuth: () => ({
    canReview: computed(() => false),
    user: ref({
      id: 99,
      fullname: 'Santri OJI',
      avatar: null,
      email: 'santri@example.com',
    }),
    homePath: computed(() => '/dashboard'),
    logout: vi.fn(),
    isReviewer: computed(() => false),
  }),
}))

describe('PostEditor', () => {
  it('renders existing post data without requiring tags from the API response', async () => {
    const component = (await import('../../app/components/PostEditor.vue')).default

    const wrapper = await mountSuspended(component, {
      props: {
        postId: 12,
        postType: 'pena_santri',
      },
      global: {
        stubs: {
          UContainer: { template: '<div><slot /></div>' },
          UButton: { template: '<button><slot /></button>' },
          UBadge: { template: '<div><slot /></div>' },
          UAlert: {
            props: ['title', 'description'],
            template: '<div><div>{{ title }}</div><div>{{ description }}</div><slot /></div>',
          },
          UCard: { template: '<div><slot name="header" /><slot /><slot name="footer" /></div>' },
          UInput: {
            props: ['modelValue', 'placeholder'],
            template: '<input :value="modelValue" :placeholder="placeholder" />',
          },
          UTextarea: {
            props: ['modelValue', 'placeholder'],
            template: '<textarea :value="modelValue" :placeholder="placeholder" />',
          },
          USelect: {
            props: ['modelValue', 'items', 'placeholder'],
            template: '<select :value="modelValue"><option>{{ placeholder }}</option></select>',
          },
          UFileUpload: { template: '<div>Upload cover</div>' },
          UFormField: {
            props: ['label', 'description', 'hint', 'name', 'required'],
            template: '<label><span>{{ label }}</span><slot /><small>{{ description }}</small><small>{{ hint }}</small></label>',
          },
          UEditor: {
            props: ['handlers', 'modelValue'],
            template: '<div><slot :editor="{ chain: () => ({ focus: () => ({ setImage: () => ({ run: () => true }), run: () => true }) }), isActive: () => false, isEditable: true }" :handlers="handlers || {}" /></div>',
          },
          UEditorToolbar: { template: '<div>Toolbar</div>' },
          UEditorSuggestionMenu: { template: '<div>Suggestion menu</div>' },
          UEditorEmojiMenu: { template: '<div>Emoji menu</div>' },
        },
      },
    })

    expect(wrapper.text()).toContain('Judul')
    expect(wrapper.text()).toContain('Gambar Sampul')
    expect(wrapper.text()).not.toContain('Tag')
    expect(wrapper.html()).toContain('Artikel Uji')
  })

  it('updates fetched post data when postId becomes available after mount', async () => {
    const component = (await import('../../app/components/PostEditor.vue')).default

    const wrapper = await mountSuspended(component, {
      props: {
        postId: undefined,
        postType: 'pena_santri',
      },
      global: {
        stubs: {
          UContainer: { template: '<div><slot /></div>' },
          UButton: { template: '<button><slot /></button>' },
          UBadge: { template: '<div><slot /></div>' },
          UCard: { template: '<div><slot name="header" /><slot /><slot name="footer" /></div>' },
          UInput: {
            props: ['modelValue', 'placeholder'],
            template: '<input :value="modelValue" :placeholder="placeholder" />',
          },
          UTextarea: {
            props: ['modelValue', 'placeholder'],
            template: '<textarea :value="modelValue" :placeholder="placeholder" />',
          },
          USelect: {
            props: ['modelValue', 'items', 'placeholder'],
            template: '<select :value="modelValue"><option>{{ placeholder }}</option></select>',
          },
          UFileUpload: { template: '<div>Upload cover</div>' },
          UFormField: {
            props: ['label', 'description', 'hint', 'name', 'required'],
            template: '<label><span>{{ label }}</span><slot /></label>',
          },
          UEditor: {
            props: ['handlers', 'modelValue'],
            template: '<div><slot :editor="{ chain: () => ({ focus: () => ({ setImage: () => ({ run: () => true }), run: () => true }) }), isActive: () => false, isEditable: true }" :handlers="handlers || {}" /></div>',
          },
          UEditorToolbar: { template: '<div>Toolbar</div>' },
          UEditorSuggestionMenu: { template: '<div>Suggestion menu</div>' },
        },
      },
    })

    expect(wrapper.html()).not.toContain('Artikel Uji')

    await wrapper.setProps({ postId: 12 })

    expect(wrapper.html()).toContain('Artikel Uji')
  })
})
