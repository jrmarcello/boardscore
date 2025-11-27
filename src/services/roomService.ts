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
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Room, CreateRoomDTO } from '../types'

const ROOMS_COLLECTION = 'rooms'

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
    password: data.password || null,
    status: 'active',
    createdAt: serverTimestamp(),
    finishedAt: null,
  }
  
  const docRef = doc(db, ROOMS_COLLECTION, roomId)
  await setDoc(docRef, roomData)
  
  return {
    id: roomId,
    name: roomData.name,
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

// Verify room password
export async function verifyRoomPassword(
  roomId: string,
  password: string
): Promise<boolean> {
  const room = await getRoom(roomId)
  if (!room) return false
  if (!room.password) return true // No password required
  return room.password === password
}

// Get players collection reference for a room
export function getPlayersCollection(roomId: string) {
  return collection(db, ROOMS_COLLECTION, roomId, 'players')
}
