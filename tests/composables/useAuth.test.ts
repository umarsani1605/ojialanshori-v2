import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'

const mockUser = ref<{ id: number, name: string, role: string, avatarPath: string | null } | null>(null)

mockNuxtImport('useUserSession', () => {
  return () => ({
    user: mockUser,
    loggedIn: { value: mockUser.value !== null },
    clear: vi.fn(),
    fetch: vi.fn(),
  })
})

mockNuxtImport('navigateTo', () => vi.fn())

describe('useAuth', () => {
  it('isSuperadmin true jika role superadmin', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'superadmin', avatarPath: null }
    const { isSuperadmin } = useAuth()
    expect(isSuperadmin.value).toBe(true)
  })

  it('isSuperadmin false untuk role lain', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'santri', avatarPath: null }
    const { isSuperadmin } = useAuth()
    expect(isSuperadmin.value).toBe(false)
  })

  it('isAdmin true untuk superadmin dan pengurus', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'superadmin', avatarPath: null }
    expect(useAuth().isAdmin.value).toBe(true)

    mockUser.value = { id: 1, name: 'Test', role: 'pengurus', avatarPath: null }
    expect(useAuth().isAdmin.value).toBe(true)

    mockUser.value = { id: 1, name: 'Test', role: 'reviewer', avatarPath: null }
    expect(useAuth().isAdmin.value).toBe(false)

    mockUser.value = { id: 1, name: 'Test', role: 'santri', avatarPath: null }
    expect(useAuth().isAdmin.value).toBe(false)
  })

  it('canReview true untuk reviewer, pengurus, superadmin', () => {
    for (const role of ['superadmin', 'pengurus', 'reviewer']) {
      mockUser.value = { id: 1, name: 'Test', role, avatarPath: null }
      expect(useAuth().canReview.value).toBe(true)
    }
  })

  it('canReview false untuk santri', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'santri', avatarPath: null }
    expect(useAuth().canReview.value).toBe(false)
  })

  it('canPublish false untuk santri', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'santri', avatarPath: null }
    expect(useAuth().canPublish.value).toBe(false)
  })

  it('isLoggedIn false jika tidak ada user', () => {
    mockUser.value = null
    const { loggedIn } = useAuth()
    expect(loggedIn.value).toBe(false)
  })
})
