import { computed, ref } from 'vue'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

type Role = 'superadmin' | 'pengurus' | 'reviewer' | 'santri'

const mockRole = ref<Role>('santri')

mockNuxtImport('useAuth', () => {
  return () => ({
    user: computed(() => ({ role: mockRole.value })),
    isSuperadmin: computed(() => mockRole.value === 'superadmin'),
    isAdmin: computed(() => ['superadmin', 'pengurus'].includes(mockRole.value)),
    canReview: computed(() => ['superadmin', 'pengurus', 'reviewer'].includes(mockRole.value)),
    loggedIn: computed(() => true),
  })
})

import { useNavigation } from '~/composables/useNavigation'

describe('useNavigation', () => {
  it('santri hanya lihat menu dasar: beranda, tulis post, post saya, profil', () => {
    mockRole.value = 'santri'
    const { navigation } = useNavigation()
    const labels = navigation.value.map(item => item.label)
    expect(labels).toEqual(['Beranda', 'Tulis Post', 'Post Saya', 'Profil Saya'])
    expect(labels).toHaveLength(4)
  })

  it('reviewer lihat menu santri + antrian review', () => {
    mockRole.value = 'reviewer'
    const { navigation } = useNavigation()
    const labels = navigation.value.map(item => item.label)
    expect(labels).toContain('Antrian Review')
    expect(labels).toContain('Beranda')
    expect(labels).toContain('Post Saya')
    expect(labels).toHaveLength(5)
  })

  it('pengurus lihat menu reviewer + semua post, kategori, galeri, banner', () => {
    mockRole.value = 'pengurus'
    const { navigation } = useNavigation()
    const labels = navigation.value.map(item => item.label)
    expect(labels).toContain('Semua Post')
    expect(labels).toContain('Kategori')
    expect(labels).toContain('Galeri')
    expect(labels).toContain('Banner')
    expect(labels).toContain('Antrian Review')
    expect(labels).toHaveLength(9)
  })

  it('superadmin lihat semua menu termasuk halaman statis, users, pengaturan', () => {
    mockRole.value = 'superadmin'
    const { navigation } = useNavigation()
    const labels = navigation.value.map(item => item.label)
    expect(labels).toContain('Halaman Statis')
    expect(labels).toContain('Users')
    expect(labels).toContain('Pengaturan')
    expect(labels).toHaveLength(12)
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
