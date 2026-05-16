declare module '#auth-utils' {
  interface User {
    id: number
    fullname: string
    nickname: string | null
    email: string
    role: 'admin' | 'reviewer' | 'santri'
    avatar: string | null
  }
}

export {}
