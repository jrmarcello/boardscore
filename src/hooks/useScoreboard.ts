import { useState, useEffect, useCallback, useRef } from 'react'
import { onSnapshot, query, orderBy } from 'firebase/firestore'
import type { Player, CreatePlayerDTO } from '../types'
import {
  getPlayersCollection,
  docToPlayer,
  addPlayer,
  updateScore,
  removePlayer,
  resetAllScores,
} from '../services/gameService'
import { soundManager } from '../lib/sounds'
import { historyManager } from '../lib/history'

interface UseScoreboardReturn {
  players: Player[]
  loading: boolean
  error: string | null
  addNewPlayer: (data: CreatePlayerDTO) => Promise<void>
  incrementScore: (playerId: string, amount?: number) => Promise<void>
  decrementScore: (playerId: string, amount?: number) => Promise<void>
  deletePlayer: (playerId: string) => Promise<void>
  resetScores: () => Promise<void>
  clearBoard: (excludeUserId?: string) => Promise<void>
}

export function useScoreboard(roomId: string): UseScoreboardReturn {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const previousLeaderRef = useRef<string | null>(null)
  const isInitialLoadRef = useRef(true)

  // Listener realtime - ordena por score decrescente
  useEffect(() => {
    if (!roomId) {
      return
    }

    // Reset refs when room changes
    previousLeaderRef.current = null
    isInitialLoadRef.current = true

    const playersCol = getPlayersCollection(roomId)
    const q = query(playersCol, orderBy('score', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playersData = snapshot.docs
          .map((doc) => docToPlayer(doc.id, doc.data()))
          // Ordenação secundária: alfabética por nome em caso de empate
          .sort((a, b) => {
            if (a.score !== b.score) return b.score - a.score
            return a.name.localeCompare(b.name, 'pt-BR')
          })

        // Check for leader change (only after initial load)
        if (!isInitialLoadRef.current && playersData.length > 0) {
          const currentLeader = playersData[0]
          const previousLeaderId = previousLeaderRef.current

          if (
            previousLeaderId &&
            currentLeader.id !== previousLeaderId &&
            currentLeader.score > 0
          ) {
            const previousLeader = players.find((p) => p.id === previousLeaderId)
            historyManager.logLeaderChange(currentLeader, previousLeader)
            soundManager.playFanfare()
          }

          previousLeaderRef.current = currentLeader.id
        } else if (playersData.length > 0) {
          previousLeaderRef.current = playersData[0].id
          isInitialLoadRef.current = false
        }

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
  }, [roomId]) // players removido para evitar re-subscribe

  const addNewPlayer = useCallback(
    async (data: CreatePlayerDTO) => {
      try {
        const playerId = await addPlayer(roomId, data)
        historyManager.addEntry({
          playerId,
          playerName: data.name,
          action: 'player_added',
          details: 'entrou no jogo',
        })
        soundManager.playNewPlayer()
      } catch (err) {
        console.error('Erro ao adicionar jogador:', err)
        throw err
      }
    },
    [roomId]
  )

  const incrementScore = useCallback(
    async (playerId: string, amount = 1) => {
      try {
        const player = players.find((p) => p.id === playerId)
        await updateScore(roomId, playerId, amount)
        if (player) {
          historyManager.logScoreChange(player, amount)
          soundManager.playCoin()
        }
      } catch (err) {
        console.error('Erro ao incrementar score:', err)
        throw err
      }
    },
    [roomId, players]
  )

  const decrementScore = useCallback(
    async (playerId: string, amount = 1) => {
      try {
        const player = players.find((p) => p.id === playerId)
        await updateScore(roomId, playerId, -amount)
        if (player) {
          historyManager.logScoreChange(player, -amount)
          soundManager.playLose()
        }
      } catch (err) {
        console.error('Erro ao decrementar score:', err)
        throw err
      }
    },
    [roomId, players]
  )

  const deletePlayer = useCallback(
    async (playerId: string) => {
      try {
        const player = players.find((p) => p.id === playerId)
        await removePlayer(roomId, playerId)
        if (player) {
          historyManager.logPlayerRemoved(player.name, player.id)
          soundManager.playDelete()
        }
      } catch (err) {
        console.error('Erro ao remover jogador:', err)
        throw err
      }
    },
    [roomId, players]
  )

  const resetScores = useCallback(async () => {
    try {
      const playerIds = players.map((p) => p.id)
      if (playerIds.length === 0) return
      await resetAllScores(roomId, playerIds)
    } catch (err) {
      console.error('Erro ao resetar scores:', err)
      throw err
    }
  }, [roomId, players])

  const clearBoard = useCallback(async (excludeUserId?: string) => {
    try {
      // Filter out the owner if excludeUserId is provided
      const playersToRemove = excludeUserId 
        ? players.filter((p) => p.odUserId !== excludeUserId)
        : players
      
      await Promise.all(playersToRemove.map((p) => removePlayer(roomId, p.id)))
    } catch (err) {
      console.error('Erro ao limpar board:', err)
      throw err
    }
  }, [roomId, players])

  return {
    players,
    loading,
    error,
    addNewPlayer,
    incrementScore,
    decrementScore,
    deletePlayer,
    resetScores,
    clearBoard,
  }
}
