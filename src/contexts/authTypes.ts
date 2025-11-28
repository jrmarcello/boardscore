import { createContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { User } from '../types'

export interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  isAnonymous: boolean
  signInWithGoogle: () => Promise<void>
  continueAsAnonymous: () => void
  signOut: () => Promise<void>
  updateNickname: (nickname: string) => Promise<void>
  needsNickname: boolean
}

export const AuthContext = createContext<AuthContextType | null>(null)
