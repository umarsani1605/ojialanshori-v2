import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'

const mockUser = ref<{ id: number, name: string, role: string, avatar: string | null } | null>(null)

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
  it('isAdmin true only for admin role', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'admin', avatar: null }
    expect(useAuth().isAdmin.value).toBe(true)

    mockUser.value = { id: 1, name: 'Test', role: 'reviewer', avatar: null }
    expect(useAuth().isAdmin.value).toBe(false)

    mockUser.value = { id: 1, name: 'Test', role: 'santri', avatar: null }
    expect(useAuth().isAdmin.value).toBe(false)
  })

  it('isReviewer true only for reviewer role', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'reviewer', avatar: null }
    expect(useAuth().isReviewer.value).toBe(true)

    mockUser.value = { id: 1, name: 'Test', role: 'admin', avatar: null }
    expect(useAuth().isReviewer.value).toBe(false)
  })

  it('isSantri true only for santri role', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'santri', avatar: null }
    expect(useAuth().isSantri.value).toBe(true)

    mockUser.value = { id: 1, name: 'Test', role: 'admin', avatar: null }
    expect(useAuth().isSantri.value).toBe(false)
  })

  it('canReview true for admin and reviewer', () => {
    for (const role of ['admin', 'reviewer']) {
      mockUser.value = { id: 1, name: 'Test', role, avatar: null }
      expect(useAuth().canReview.value).toBe(true)
    }
  })

  it('canReview false for santri', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'santri', avatar: null }
    expect(useAuth().canReview.value).toBe(false)
  })

  it('canWritePenaSantri true only for santri', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'santri', avatar: null }
    expect(useAuth().canWritePenaSantri.value).toBe(true)

    mockUser.value = { id: 1, name: 'Test', role: 'reviewer', avatar: null }
    expect(useAuth().canWritePenaSantri.value).toBe(false)

    mockUser.value = { id: 1, name: 'Test', role: 'admin', avatar: null }
    expect(useAuth().canWritePenaSantri.value).toBe(false)
  })

  it('canManageBerita true only for admin', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'admin', avatar: null }
    expect(useAuth().canManageBerita.value).toBe(true)

    mockUser.value = { id: 1, name: 'Test', role: 'reviewer', avatar: null }
    expect(useAuth().canManageBerita.value).toBe(false)
  })

  it('homePath and profilePath follow role cluster', () => {
    mockUser.value = { id: 1, name: 'Test', role: 'admin', avatar: null }
    expect(useAuth().homePath.value).toBe('/admin')
    expect(useAuth().profilePath.value).toBe('/admin/profile')

    mockUser.value = { id: 1, name: 'Test', role: 'reviewer', avatar: null }
    expect(useAuth().homePath.value).toBe('/dashboard')
    expect(useAuth().profilePath.value).toBe('/dashboard/profile')

    mockUser.value = { id: 1, name: 'Test', role: 'santri', avatar: null }
    expect(useAuth().homePath.value).toBe('/dashboard')
    expect(useAuth().profilePath.value).toBe('/dashboard/profile')
  })

  it('loggedIn false when no user', () => {
    mockUser.value = null
    const { loggedIn } = useAuth()
    expect(loggedIn.value).toBe(false)
  })
})
