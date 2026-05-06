import { computed, ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

type Role = 'superadmin' | 'pengurus' | 'reviewer' | 'santri'

const mockRole = ref<Role>('santri')

mockNuxtImport('useAuth', () => {
  return () => ({
    user: computed(() => ({ role: mockRole.value })),
    cluster: computed(() => ['superadmin', 'pengurus'].includes(mockRole.value) ? 'admin' : 'dashboard'),
    profilePath: computed(() => ['superadmin', 'pengurus'].includes(mockRole.value) ? '/admin/profile' : '/dashboard/profile'),
    isSuperadmin: computed(() => mockRole.value === 'superadmin'),
    isReviewer: computed(() => mockRole.value === 'reviewer'),
    isAdmin: computed(() => ['superadmin', 'pengurus'].includes(mockRole.value)),
    canReview: computed(() => ['superadmin', 'pengurus', 'reviewer'].includes(mockRole.value)),
    canWritePosts: computed(() => mockRole.value === 'santri'),
    loggedIn: computed(() => true),
  })
})

import { useNavigation } from '~/composables/useNavigation'

describe('useNavigation', () => {
  it('santri hanya lihat menu cluster dashboard', () => {
    mockRole.value = 'santri'
    const { navigation } = useNavigation()
    const labels = navigation.value.map(item => item.label)
    expect(labels).toEqual(['Beranda', 'Tulis Post', 'Post Saya', 'Profil Saya'])
    expect(labels).toHaveLength(4)
    expect(navigation.value.every(item => String(item.to).startsWith('/dashboard'))).toBe(true)
  })

  it('reviewer tetap di cluster dashboard dengan antrian review dan tanpa menu santri', () => {
    mockRole.value = 'reviewer'
    const { navigation } = useNavigation()
    const labels = navigation.value.map(item => item.label)
    expect(labels).toContain('Antrian Review')
    expect(labels).toContain('Beranda')
    expect(labels).toContain('Profil Saya')
    expect(labels).not.toContain('Tulis Post')
    expect(labels).not.toContain('Post Saya')
    expect(labels).toHaveLength(3)
    expect(navigation.value.find(item => item.label === 'Antrian Review')?.to).toBe('/dashboard/review')
  })

  it('pengurus hanya lihat menu admin canonical ke /admin', () => {
    mockRole.value = 'pengurus'
    const { navigation } = useNavigation()
    const labels = navigation.value.map(item => item.label)
    expect(labels).toContain('Beranda')
    expect(labels).toContain('Review Post')
    expect(labels).toContain('Semua Post')
    expect(labels).toContain('Kategori')
    expect(labels).toContain('Galeri')
    expect(labels).toContain('Banner')
    expect(labels).not.toContain('Tulis Post')
    expect(labels).not.toContain('Post Saya')
    expect(navigation.value.every(item => String(item.to).startsWith('/admin'))).toBe(true)
  })

  it('superadmin lihat semua menu admin termasuk halaman statis, users, pengaturan', () => {
    mockRole.value = 'superadmin'
    const { navigation } = useNavigation()
    const labels = navigation.value.map(item => item.label)
    expect(labels).toContain('Review Post')
    expect(labels).toContain('Halaman Statis')
    expect(labels).toContain('Users')
    expect(labels).toContain('Pengaturan')
    expect(navigation.value.every(item => String(item.to).startsWith('/admin'))).toBe(true)
  })

  it('profil saya selalu ada di semua role', () => {
    const roles: Role[] = ['santri', 'reviewer', 'pengurus', 'superadmin']
    for (const role of roles) {
      mockRole.value = role
      const { navigation } = useNavigation()
      const labels = navigation.value.map(item => item.label)
      expect(labels).toContain('Profil Saya')
    }
  })

  it('antrian review tidak tampil untuk santri', () => {
    mockRole.value = 'santri'
    const { navigation } = useNavigation()
    const labels = navigation.value.map(item => item.label)
    expect(labels).not.toContain('Antrian Review')
  })

  it('users tidak tampil untuk pengurus', () => {
    mockRole.value = 'pengurus'
    const { navigation } = useNavigation()
    const labels = navigation.value.map(item => item.label)
    expect(labels).not.toContain('Users')
  })
})
