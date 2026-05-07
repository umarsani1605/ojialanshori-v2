import { computed, ref } from 'vue'
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
  return (key: string) => {
    if (String(key) === 'post-editor-categories') {
      return {
        data: ref([
          { id: 2, name: 'Pena Santri', type: 'pena_santri' as const },
        ]),
        status: ref('success'),
      }
    }

    if (String(key).startsWith('post-editor-')) {
      return {
        data: ref({
          id: 12,
          title: 'Artikel Uji',
          content: '<p>Isi</p>',
          excerpt: null,
          featuredImage: null,
          categoryId: 2,
          status: 'draft' as const,
          reviewNote: null,
          author: { id: 1, name: 'Admin', email: 'admin@example.com' },
          reviewer: null,
          category: { id: 2, name: 'Pena Santri', type: 'pena_santri' as const },
        }),
        status: ref('success'),
      }
    }

    return {
      data: ref(null),
      status: ref('success'),
    }
  }
})

mockNuxtImport('navigateTo', () => vi.fn())

vi.mock('~/app/composables/useAuth', () => ({
  useAuth: () => ({
    canWritePosts: computed(() => true),
    canReview: computed(() => false),
    user: ref({
      id: 99,
      name: 'Santri OJI',
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
    expect(wrapper.text()).toContain('Ringkasan')
    expect(wrapper.text()).not.toContain('Tag')
    expect(wrapper.html()).toContain('Artikel Uji')
  })
})
