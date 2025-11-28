import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { User, CreateUserDTO, UpdateUserDTO, RecentRoom } from '../types'

const USERS_COLLECTION = 'users'
const MAX_RECENT_ROOMS = 20

// Convert Firestore doc to User
function docToUser(id: string, data: Record<string, unknown>): User {
  return {
    id,
    email: data.email as string,
    displayName: data.displayName as string,
    nickname: (data.nickname as string) || (data.displayName as string),
    photoURL: (data.photoURL as string) || null,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  }
}

// Get user by ID
export async function getUser(userId: string): Promise<User | null> {
  const docRef = doc(db, USERS_COLLECTION, userId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return docToUser(docSnap.id, docSnap.data())
}

// Create or update user on login
// IMPORTANTE: Não sobrescreve nickname se usuário já existe
export async function upsertUser(
  userId: string,
  data: CreateUserDTO
): Promise<User> {
  const docRef = doc(db, USERS_COLLECTION, userId)
  const docSnap = await getDoc(docRef)
  const isNewUser = !docSnap.exists()
  
  if (isNewUser) {
    // Novo usuário: cria com nickname = displayName
    await setDoc(docRef, {
      email: data.email,
      displayName: data.displayName,
      nickname: data.displayName,
      photoURL: data.photoURL,
      recentRooms: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    return {
      id: userId,
      email: data.email,
      displayName: data.displayName,
      nickname: data.displayName,
      photoURL: data.photoURL,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } else {
    // Usuário existente: atualiza apenas email, displayName e photoURL
    // NÃO sobrescreve nickname!
    await setDoc(docRef, {
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      updatedAt: serverTimestamp(),
    }, { merge: true })
    
    // Retorna dados do banco (incluindo nickname preservado)
    const existingData = docSnap.data()
    return docToUser(userId, existingData)
  }
}

// Update user profile
export async function updateUserProfile(
  userId: string,
  data: UpdateUserDTO
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId)
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

// Get user's recent rooms
export async function getRecentRooms(userId: string): Promise<RecentRoom[]> {
  const docRef = doc(db, USERS_COLLECTION, userId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return []
  }

  const data = docSnap.data()
  const rooms = (data.recentRooms as RecentRoom[]) || []

  // Sort by lastAccess descending
  return rooms.sort(
    (a, b) =>
      new Date(b.lastAccess).getTime() - new Date(a.lastAccess).getTime()
  )
}

// Add or update room in recent rooms
// OTIMIZADO: Usa setDoc com merge para evitar leitura prévia na maioria dos casos
export async function addToRecentRooms(
  userId: string,
  room: Omit<RecentRoom, 'lastAccess'>
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId)
  
  const newRoom: RecentRoom = {
    ...room,
    lastAccess: new Date(),
  }

  // Tenta ler para limpar duplicatas e limitar quantidade
  // (necessário para manter a lista limpa, mas aceita eventual inconsistência)
  try {
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      // Documento não existe, cria com a primeira sala
      await setDoc(docRef, {
        recentRooms: [newRoom],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return
    }

    const data = docSnap.data()
    let rooms = (data.recentRooms as RecentRoom[]) || []

    // Remove existing entry for this room
    rooms = rooms.filter((r) => r.id !== room.id)

    // Add new entry at the beginning
    rooms.unshift(newRoom)

    // Keep only last MAX_RECENT_ROOMS
    rooms = rooms.slice(0, MAX_RECENT_ROOMS)

    await updateDoc(docRef, {
      recentRooms: rooms,
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    // Se falhar, tenta apenas adicionar (melhor ter duplicata do que perder)
    console.warn('Erro ao atualizar recent rooms, tentando fallback:', err)
    await setDoc(docRef, {
      recentRooms: arrayUnion(newRoom),
      updatedAt: serverTimestamp(),
    }, { merge: true })
  }
}

// Remove room from recent rooms
// NOTA: Infelizmente arrayRemove não funciona com objetos parciais,
// então ainda precisamos ler para filtrar
export async function removeFromRecentRooms(
  userId: string,
  roomId: string
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId)
  
  try {
    const docSnap = await getDoc(docRef)
    if (!docSnap.exists()) return

    const data = docSnap.data()
    const rooms = (data.recentRooms as RecentRoom[]) || []
    const updatedRooms = rooms.filter((r) => r.id !== roomId)

    // Só atualiza se realmente removeu algo
    if (updatedRooms.length !== rooms.length) {
      await updateDoc(docRef, {
        recentRooms: updatedRooms,
        updatedAt: serverTimestamp(),
      })
    }
  } catch (err) {
    console.warn('Erro ao remover sala dos recentes:', err)
  }
}

// Clear all recent rooms
export async function clearRecentRooms(userId: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, userId)
  await updateDoc(docRef, {
    recentRooms: [],
    updatedAt: serverTimestamp(),
  })
}
