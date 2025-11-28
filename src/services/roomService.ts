import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Room, CreateRoomDTO } from '../types'

const ROOMS_COLLECTION = 'rooms'
const SALT_SEPARATOR = ':' // Separador entre salt e hash

// Generate a random salt
function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

// Hash using SHA-256 (Web Crypto API)
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Hash password with salt (formato: salt:hash)
async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt()
  const hash = await sha256(salt + password)
  return `${salt}${SALT_SEPARATOR}${hash}`
}

// Verify password against salted hash
async function verifyHash(password: string, storedHash: string): Promise<boolean> {
  // Suporta formato antigo (só hash) e novo (salt:hash)
  if (storedHash.includes(SALT_SEPARATOR)) {
    // Novo formato com salt
    const [salt, hash] = storedHash.split(SALT_SEPARATOR)
    const inputHash = await sha256(salt + password)
    return hash === inputHash
  } else {
    // Formato legado (sem salt) - para compatibilidade
    const inputHash = await sha256(password)
    return storedHash === inputHash
  }
}

// Generate a random 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars (0,O,1,I)
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// Normalize room ID (uppercase for generated codes, handle custom IDs)
export function normalizeRoomId(id: string): string {
  const trimmed = id.trim()
  
  // If it looks like a generated code (6 alphanumeric chars), keep uppercase
  if (/^[A-Z0-9]{6}$/i.test(trimmed)) {
    return trimmed.toUpperCase()
  }
  
  // For custom IDs, normalize to lowercase with dashes
  return trimmed
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

// Convert Firestore doc to Room
function docToRoom(id: string, data: Record<string, unknown>): Room {
  return {
    id,
    name: data.name as string,
    ownerId: (data.ownerId as string) || null,
    password: (data.password as string) || null,
    status: (data.status as 'active' | 'finished') || 'active',
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    finishedAt: (data.finishedAt as Timestamp)?.toDate() ?? null,
  }
}

// Check if room exists
export async function roomExists(roomId: string): Promise<boolean> {
  const docRef = doc(db, ROOMS_COLLECTION, roomId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists()
}

// Get room by ID
export async function getRoom(roomId: string): Promise<Room | null> {
  const docRef = doc(db, ROOMS_COLLECTION, roomId)
  const docSnap = await getDoc(docRef)
  
  if (!docSnap.exists()) {
    return null
  }
  
  return docToRoom(docSnap.id, docSnap.data())
}

// Create a new room
export async function createRoom(data: CreateRoomDTO): Promise<Room> {
  // Use custom ID or generate one
  let roomId = data.customId ? normalizeRoomId(data.customId) : generateRoomCode()
  
  // Check if custom ID is taken
  if (data.customId) {
    const exists = await roomExists(roomId)
    if (exists) {
      throw new Error('Este código de sala já está em uso')
    }
  } else {
    // Generate until we find a unique one
    while (await roomExists(roomId)) {
      roomId = generateRoomCode()
    }
  }
  
  const roomData = {
    name: data.name.trim(),
    ownerId: data.ownerId || null,
    password: data.password ? await hashPassword(data.password) : null,
    status: 'active',
    createdAt: serverTimestamp(),
    finishedAt: null,
  }
  
  const docRef = doc(db, ROOMS_COLLECTION, roomId)
  await setDoc(docRef, roomData)
  
  return {
    id: roomId,
    name: roomData.name,
    ownerId: roomData.ownerId,
    password: roomData.password,
    status: 'active',
    createdAt: new Date(),
    finishedAt: null,
  }
}

// List all rooms
export async function listRooms(): Promise<Room[]> {
  const q = query(
    collection(db, ROOMS_COLLECTION),
    orderBy('createdAt', 'desc')
  )
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => docToRoom(doc.id, doc.data()))
}

// Finish a room (make it read-only)
export async function finishRoom(roomId: string): Promise<void> {
  const docRef = doc(db, ROOMS_COLLECTION, roomId)
  await updateDoc(docRef, {
    status: 'finished',
    finishedAt: serverTimestamp(),
  })
}

// Reopen a finished room
export async function reopenRoom(roomId: string): Promise<void> {
  const docRef = doc(db, ROOMS_COLLECTION, roomId)
  await updateDoc(docRef, {
    status: 'active',
    finishedAt: null,
  })
}

// Update room password (only owner should call this)
export async function updateRoomPassword(roomId: string, newPassword: string | null): Promise<void> {
  const docRef = doc(db, ROOMS_COLLECTION, roomId)
  await updateDoc(docRef, {
    password: newPassword ? await hashPassword(newPassword) : null,
  })
}

// Delete a room and all its players
export async function deleteRoom(roomId: string): Promise<void> {
  // Delete all players in the room first
  const playersRef = collection(db, ROOMS_COLLECTION, roomId, 'players')
  const playersSnap = await getDocs(playersRef)
  
  const deletePromises = playersSnap.docs.map((playerDoc) =>
    deleteDoc(playerDoc.ref)
  )
  await Promise.all(deletePromises)
  
  // Delete the room itself
  const docRef = doc(db, ROOMS_COLLECTION, roomId)
  await deleteDoc(docRef)
}

// Verify room password (compara senha com hash salteado armazenado)
export async function verifyRoomPassword(
  roomOrPassword: Room | string | null,
  password: string
): Promise<boolean> {
  if (!roomOrPassword) return false
  
  // Se for string, é o hash esperado diretamente
  const storedHash = typeof roomOrPassword === 'string' 
    ? roomOrPassword 
    : roomOrPassword.password
  
  if (!storedHash) return true // No password required
  
  return verifyHash(password, storedHash)
}

// Get players collection reference for a room
export function getPlayersCollection(roomId: string) {
  return collection(db, ROOMS_COLLECTION, roomId, 'players')
}

// Subscribe to room changes in real-time
export function subscribeToRoom(
  roomId: string,
  callback: (room: Room | null) => void
): () => void {
  const docRef = doc(db, ROOMS_COLLECTION, roomId)
  
  return onSnapshot(docRef, (docSnap) => {
    if (!docSnap.exists()) {
      callback(null)
      return
    }
    callback(docToRoom(docSnap.id, docSnap.data()))
  })
}
