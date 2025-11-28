import { useEffect, useState, useCallback, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { upsertUser } from '../services/userService'
import type { User } from '../types'
import { AuthContext, type AuthContextType } from './authTypes'

const ANONYMOUS_KEY = 'boardscore_anonymous'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAnonymous, setIsAnonymous] = useState(() => {
    // Restore anonymous state from localStorage
    return localStorage.getItem(ANONYMOUS_KEY) === 'true'
  })

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser)

      if (fbUser) {
        // User is logged in, fetch or create user profile
        try {
          const userData = await upsertUser(fbUser.uid, {
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Usuário',
            photoURL: fbUser.photoURL,
          })
          setUser(userData)
          setIsAnonymous(false)
        } catch (err) {
          console.error('Erro ao carregar usuário:', err)
        }
      } else {
        setUser(null)
        // Keep isAnonymous as is (might be continuing as anonymous)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true)
      await signInWithPopup(auth, googleProvider)
      localStorage.removeItem(ANONYMOUS_KEY)
      setIsAnonymous(false)
    } catch (err) {
      console.error('Erro ao fazer login com Google:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const continueAsAnonymous = useCallback(() => {
    localStorage.setItem(ANONYMOUS_KEY, 'true')
    setIsAnonymous(true)
    setUser(null)
    setLoading(false)
  }, [])

  const signOut = useCallback(async () => {
    try {
      await firebaseSignOut(auth)
      localStorage.removeItem(ANONYMOUS_KEY)
      setUser(null)
      setIsAnonymous(false)
    } catch (err) {
      console.error('Erro ao fazer logout:', err)
      throw err
    }
  }, [])

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    isAnonymous,
    signInWithGoogle,
    continueAsAnonymous,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
