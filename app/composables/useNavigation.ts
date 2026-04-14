import type { NavigationMenuItem } from '@nuxt/ui'

export function useNavigation() {
  const auth = useAuth()

  const navigation = computed<NavigationMenuItem[]>(() => {
    const items: NavigationMenuItem[] = []

    // Semua role
    items.push(
      { label: 'Beranda', icon: 'i-lucide-home', to: '/dashboard' },
      { label: 'Tulis Post', icon: 'i-lucide-pen-line', to: '/dashboard/posts/create' },
      { label: 'Post Saya', icon: 'i-lucide-file-text', to: '/dashboard/posts' },
    )

    // Reviewer, Pengurus, Superadmin
    if (auth.canReview.value) {
      items.push({ label: 'Antrian Review', icon: 'i-lucide-inbox', to: '/dashboard/review' })
    }

    // Pengurus, Superadmin
    if (auth.isAdmin.value) {
      items.push(
        { label: 'Semua Post', icon: 'i-lucide-files', to: '/dashboard/posts/all' },
        { label: 'Kategori', icon: 'i-lucide-tag', to: '/dashboard/categories' },
        { label: 'Galeri', icon: 'i-lucide-image', to: '/dashboard/gallery' },
        { label: 'Banner', icon: 'i-lucide-megaphone', to: '/dashboard/banner' },
      )
    }

    // Superadmin only
    if (auth.isSuperadmin.value) {
      items.push(
        { label: 'Halaman Statis', icon: 'i-lucide-layout', to: '/dashboard/pages' },
        { label: 'Users', icon: 'i-lucide-users', to: '/dashboard/users' },
        { label: 'Pengaturan', icon: 'i-lucide-settings', to: '/dashboard/settings' },
      )
    }

    // Footer — semua role
    items.push({ label: 'Profil Saya', icon: 'i-lucide-user-circle', to: '/dashboard/profile' })
    return items
  })

  // Grouped for sidebar: main nav vs footer nav
  const mainLinks = computed<NavigationMenuItem[]>(() =>
    navigation.value.filter(item => item.to !== '/dashboard/profile'),
  )

  const footerLinks = computed<NavigationMenuItem[]>(() =>
    navigation.value.filter(item => item.to === '/dashboard/profile'),
  )

  return { navigation, mainLinks, footerLinks }
}
