declare module '#auth-utils' {
  interface User {
    id: number
    name: string
    email: string
    role: 'admin' | 'reviewer' | 'santri'
    avatar: string | null
  }
}

export {}
