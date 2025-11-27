import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Player, CreatePlayerDTO } from '../types'

const COLLECTION_NAME = 'players'
const playersCollection = collection(db, COLLECTION_NAME)

// Converte documento do Firestore para o tipo Player
export function docToPlayer(id: string, data: Record<string, unknown>): Player {
  return {
    id,
    name: data.name as string,
    score: (data.score as number) ?? 0,
    createdAt: (data.createdAt as Timestamp)?.toDate() ?? new Date(),
    updatedAt: (data.updatedAt as Timestamp)?.toDate() ?? new Date(),
  }
}

// Adicionar novo jogador
export async function addPlayer(data: CreatePlayerDTO): Promise<string> {
  const docRef = await addDoc(playersCollection, {
    name: data.name.trim(),
    score: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

// Atualizar pontuação (soma ou subtrai)
export async function updateScore(playerId: string, delta: number): Promise<void> {
  const playerRef = doc(db, COLLECTION_NAME, playerId)
  await updateDoc(playerRef, {
    score: increment(delta),
    updatedAt: serverTimestamp(),
  })
}

// Definir pontuação diretamente
export async function setScore(playerId: string, newScore: number): Promise<void> {
  const playerRef = doc(db, COLLECTION_NAME, playerId)
  await updateDoc(playerRef, {
    score: newScore,
    updatedAt: serverTimestamp(),
  })
}

// Remover jogador
export async function removePlayer(playerId: string): Promise<void> {
  const playerRef = doc(db, COLLECTION_NAME, playerId)
  await deleteDoc(playerRef)
}

// Resetar todos os scores (zerar placar)
export async function resetAllScores(playerIds: string[]): Promise<void> {
  const updates = playerIds.map((id) => setScore(id, 0))
  await Promise.all(updates)
}

// Referência para usar no listener
export { playersCollection }
