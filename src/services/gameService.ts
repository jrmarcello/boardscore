import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  Timestamp,
  CollectionReference,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Player, CreatePlayerDTO } from '../types'

const ROOMS_COLLECTION = 'rooms'
const PLAYERS_SUBCOLLECTION = 'players'

// Get players collection for a specific room
export function getPlayersCollection(roomId: string): CollectionReference {
  return collection(db, ROOMS_COLLECTION, roomId, PLAYERS_SUBCOLLECTION)
}

// Converte documento do Firestore para o tipo Player
export function docToPlayer(id: string, data: Record<string, unknown>): Player {
  return {
    id,
    name: data.name as string,
    score: (data.score as number) ?? 0,
    odUserId: (data.odUserId as string) || null,
    photoURL: (data.photoURL as string) || null,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  }
}

// Adicionar novo jogador em uma sala
export async function addPlayer(roomId: string, data: CreatePlayerDTO): Promise<string> {
  const playersCol = getPlayersCollection(roomId)
  const docRef = await addDoc(playersCol, {
    name: data.name.trim(),
    score: 0,
    odUserId: data.odUserId || null,
    photoURL: data.photoURL || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

// Atualizar pontuação (soma ou subtrai)
export async function updateScore(roomId: string, playerId: string, delta: number): Promise<void> {
  const playerRef = doc(db, ROOMS_COLLECTION, roomId, PLAYERS_SUBCOLLECTION, playerId)
  await updateDoc(playerRef, {
    score: increment(delta),
    updatedAt: serverTimestamp(),
  })
}

// Definir pontuação diretamente
export async function setScore(roomId: string, playerId: string, newScore: number): Promise<void> {
  const playerRef = doc(db, ROOMS_COLLECTION, roomId, PLAYERS_SUBCOLLECTION, playerId)
  try {
    await updateDoc(playerRef, {
      score: newScore,
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    // Document might have been deleted, ignore
    console.warn(`Could not update score for player ${playerId}:`, err)
  }
}

// Remover jogador
export async function removePlayer(roomId: string, playerId: string): Promise<void> {
  const playerRef = doc(db, ROOMS_COLLECTION, roomId, PLAYERS_SUBCOLLECTION, playerId)
  await deleteDoc(playerRef)
}

// Atualizar nome do jogador
export async function updatePlayerName(roomId: string, playerId: string, newName: string): Promise<void> {
  const playerRef = doc(db, ROOMS_COLLECTION, roomId, PLAYERS_SUBCOLLECTION, playerId)
  try {
    await updateDoc(playerRef, {
      name: newName.trim(),
      updatedAt: serverTimestamp(),
    })
  } catch (err) {
    console.warn(`Could not update name for player ${playerId}:`, err)
  }
}

// Resetar todos os scores (zerar placar)
export async function resetAllScores(roomId: string, playerIds: string[]): Promise<void> {
  const updates = playerIds.map((id) => setScore(roomId, id, 0))
  await Promise.all(updates)
}
