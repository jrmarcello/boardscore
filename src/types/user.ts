export interface User {
  id: string
  email: string
  displayName: string
  nickname: string
  photoURL: string | null
  createdAt: Date
  updatedAt: Date
}

export interface RecentRoom {
  id: string
  name: string
  role: 'owner' | 'player'
  hasPassword?: boolean
  lastAccess: Date
}

export interface CreateUserDTO {
  email: string
  displayName: string
  photoURL: string | null
}

export interface UpdateUserDTO {
  nickname?: string
  photoURL?: string | null
}
