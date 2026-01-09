export interface AuthData {
  accessToken: string
  user: {
    id: number
    name: string
    email: string
    role: string
  }
}
