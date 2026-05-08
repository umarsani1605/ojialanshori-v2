declare module '#auth-utils' {
  interface User {
    id: number
    fullname: string
    email: string
    role: 'admin' | 'reviewer' | 'santri'
    avatar: string | null
  }
}

export {}
