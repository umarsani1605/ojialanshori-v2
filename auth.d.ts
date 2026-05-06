declare module '#auth-utils' {
  interface User {
    id: number
    name: string
    email: string
    role: 'superadmin' | 'pengurus' | 'reviewer' | 'santri'
    avatar: string | null
  }
}

export {}
