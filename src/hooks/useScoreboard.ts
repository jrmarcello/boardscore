import { useState, useEffect, useCallback } from 'react'
import { onSnapshot, query, orderBy } from 'firebase/firestore'
import type { Player, CreatePlayerDTO } from '../types'
import {
  playersCollection,
  docToPlayer,
  addPlayer,
  updateScore,
  removePlayer,
  resetAllScores,
} from '../services/gameService'

interface UseScoreboardReturn {
  players: Player[]
  loading: boolean
  error: string | null
  addNewPlayer: (data: CreatePlayerDTO) => Promise<void>
  incrementScore: (playerId: string, amount?: number) => Promise<void>
  decrementScore: (playerId: string, amount?: number) => Promise<void>
  deletePlayer: (playerId: string) => Promise<void>
  resetScores: () => Promise<void>
}

export function useScoreboard(): UseScoreboardReturn {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Listener realtime - ordena por score decrescente
  useEffect(() => {
    const q = query(playersCollection, orderBy('score', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playersData = snapshot.docs.map((doc) =>
          docToPlayer(doc.id, doc.data())
        )
        setPlayers(playersData)
        setLoading(false)
        setError(null)
      },
      (err) => {
        console.error('Erro ao sincronizar:', err)
        setError('Erro ao carregar jogadores')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  const addNewPlayer = useCallback(async (data: CreatePlayerDTO) => {
    try {
      await addPlayer(data)
    } catch (err) {
      console.error('Erro ao adicionar jogador:', err)
      throw err
    }
  }, [])

  const incrementScore = useCallback(async (playerId: string, amount = 1) => {
    try {
      await updateScore(playerId, amount)
    } catch (err) {
      console.error('Erro ao incrementar score:', err)
      throw err
    }
  }, [])

  const decrementScore = useCallback(async (playerId: string, amount = 1) => {
    try {
      await updateScore(playerId, -amount)
    } catch (err) {
      console.error('Erro ao decrementar score:', err)
      throw err
    }
  }, [])

  const deletePlayer = useCallback(async (playerId: string) => {
    try {
      await removePlayer(playerId)
    } catch (err) {
      console.error('Erro ao remover jogador:', err)
      throw err
    }
  }, [])

  const resetScores = useCallback(async () => {
    try {
      const playerIds = players.map((p) => p.id)
      await resetAllScores(playerIds)
    } catch (err) {
      console.error('Erro ao resetar scores:', err)
      throw err
    }
  }, [players])

  return {
    players,
    loading,
    error,
    addNewPlayer,
    incrementScore,
    decrementScore,
    deletePlayer,
    resetScores,
  }
}
