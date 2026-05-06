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

mockNuxtImport('useFetch', () => {
  return () => ({
    data: ref({
      categories: [
        { id: 1, name: 'Kajian', type: 'pena_santri' as const },
      ],
    }),
  })
})

mockNuxtImport('useAsyncData', () => {
  return () => ({
    data: ref(null),
    status: ref('success'),
  })
})

mockNuxtImport('navigateTo', () => vi.fn())

vi.mock('~/app/composables/useAuth', () => ({
  useAuth: () => ({
    canWritePosts: computed(() => true),
    user: ref({
      name: 'Santri OJI',
      avatar: null,
      email: 'santri@example.com',
    }),
    homePath: computed(() => '/dashboard'),
    logout: vi.fn(),
    isReviewer: computed(() => false),
  }),
}))

describe('SantriPostEditor', () => {
  it('renders explicit field labels and publishing sidebar sections for create mode', async () => {
    const component = (await import('../../app/components/dashboard/SantriPostEditor.vue')).default

    const wrapper = await mountSuspended(component, {
      global: {
        stubs: {
          UButton: {
            template: '<button><slot /></button>',
          },
          UBadge: {
            template: '<div><slot /></div>',
          },
          UAlert: {
            props: ['title', 'description'],
            template: '<div><div>{{ title }}</div><div>{{ description }}</div><slot /></div>',
          },
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
          UInputTags: {
            props: ['modelValue', 'placeholder'],
            template: '<div><span v-for="item in modelValue" :key="item">{{ item }}</span><input :placeholder="placeholder" /></div>',
          },
          UFileUpload: {
            template: '<div>Upload cover</div>',
          },
          UFormField: {
            props: ['label', 'description', 'hint', 'name'],
            template: '<label><span>{{ label }}</span><slot /><small>{{ description }}</small><small>{{ hint }}</small></label>',
          },
          UEditor: {
            props: ['handlers'],
            template: '<div><div v-if="handlers">Custom handlers</div><slot :editor="{}" :handlers="handlers || {}" /></div>',
          },
          UEditorToolbar: {
            template: '<div>Toolbar</div>',
          },
          UEditorSuggestionMenu: {
            template: '<div>Suggestion menu</div>',
          },
          UEditorEmojiMenu: {
            template: '<div>Emoji menu</div>',
          },
        },
      },
    })

    expect(wrapper.text()).toContain('Judul')
    expect(wrapper.text()).toContain('Konten')
    expect(wrapper.text()).toContain('Gambar Sampul')
    expect(wrapper.text()).toContain('Ringkasan')
    expect(wrapper.text()).toContain('Toolbar')
    expect(wrapper.text()).toContain('Suggestion menu')
    expect(wrapper.text()).toContain('Emoji menu')
    expect(wrapper.text()).toContain('Custom handlers')
  })
})
