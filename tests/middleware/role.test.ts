import { ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, describe, expect, it, vi } from 'vitest'

const navigateToMock = vi.fn()
const mockAuth = {
  loggedIn: ref(false),
  isAdmin: ref(false),
  homePath: ref('/dashboard'),
}

mockNuxtImport('useAuth', () => () => mockAuth)
mockNuxtImport('navigateTo', () => (...args: unknown[]) => navigateToMock(...args))

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('middleware/role', () => {
  it('does nothing when user is not logged in', async () => {
    mockAuth.loggedIn.value = false
    mockAuth.isAdmin.value = false

    const { default: middleware } = await import('~/middleware/role')
    middleware({ path: '/admin/posts' } as never)
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('redirects non-admin away from /admin routes', async () => {
    mockAuth.loggedIn.value = true
    mockAuth.isAdmin.value = false
    mockAuth.homePath.value = '/dashboard'

    const { default: middleware } = await import('~/middleware/role')
    middleware({ path: '/admin/posts' } as never)
    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  it('allows admin to access /admin routes', async () => {
    mockAuth.loggedIn.value = true
    mockAuth.isAdmin.value = true
    mockAuth.homePath.value = '/admin'

    const { default: middleware } = await import('~/middleware/role')
    middleware({ path: '/admin/posts' } as never)
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('redirects admin away from /dashboard routes', async () => {
    mockAuth.loggedIn.value = true
    mockAuth.isAdmin.value = true
    mockAuth.homePath.value = '/admin'

    const { default: middleware } = await import('~/middleware/role')
    middleware({ path: '/dashboard/profile' } as never)
    expect(navigateToMock).toHaveBeenCalledWith('/admin')
  })

  it('allows non-admin to access /dashboard routes', async () => {
    mockAuth.loggedIn.value = true
    mockAuth.isAdmin.value = false

    const { default: middleware } = await import('~/middleware/role')
    middleware({ path: '/dashboard/profile' } as never)
    expect(navigateToMock).not.toHaveBeenCalled()
  })
})
