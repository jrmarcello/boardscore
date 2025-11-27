import { useState, useEffect, useCallback, useRef } from 'react'
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
  clearBoard: () => Promise<void>
}

export function useScoreboard(): UseScoreboardReturn {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const previousLeaderRef = useRef<string | null>(null)
  const isInitialLoadRef = useRef(true)

  // Listener realtime - ordena por score decrescente
  useEffect(() => {
    const q = query(playersCollection, orderBy('score', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playersData = snapshot.docs.map((doc) =>
          docToPlayer(doc.id, doc.data())
        )
        
        // Check for leader change (only after initial load)
        if (!isInitialLoadRef.current && playersData.length > 0) {
          const currentLeader = playersData[0]
          const previousLeaderId = previousLeaderRef.current
          
          if (previousLeaderId && currentLeader.id !== previousLeaderId && currentLeader.score > 0) {
            const previousLeader = players.find(p => p.id === previousLeaderId)
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
  }, [players])

  const addNewPlayer = useCallback(async (data: CreatePlayerDTO) => {
    try {
      const playerId = await addPlayer(data)
      // Log and play sound after successful add
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
  }, [])

  const incrementScore = useCallback(async (playerId: string, amount = 1) => {
    try {
      const player = players.find((p) => p.id === playerId)
      await updateScore(playerId, amount)
      if (player) {
        historyManager.logScoreChange(player, amount)
        soundManager.playCoin()
      }
    } catch (err) {
      console.error('Erro ao incrementar score:', err)
      throw err
    }
  }, [players])

  const decrementScore = useCallback(async (playerId: string, amount = 1) => {
    try {
      const player = players.find((p) => p.id === playerId)
      await updateScore(playerId, -amount)
      if (player) {
        historyManager.logScoreChange(player, -amount)
        soundManager.playLose()
      }
    } catch (err) {
      console.error('Erro ao decrementar score:', err)
      throw err
    }
  }, [players])

  const deletePlayer = useCallback(async (playerId: string) => {
    try {
      const player = players.find((p) => p.id === playerId)
      await removePlayer(playerId)
      if (player) {
        historyManager.logPlayerRemoved(player.name, player.id)
        soundManager.playDelete()
      }
    } catch (err) {
      console.error('Erro ao remover jogador:', err)
      throw err
    }
  }, [players])

  const resetScores = useCallback(async () => {
    try {
      const playerIds = players.map((p) => p.id)
      await resetAllScores(playerIds)
    } catch (err) {
      console.error('Erro ao resetar scores:', err)
      throw err
    }
  }, [players])

  const clearBoard = useCallback(async () => {
    try {
      await Promise.all(players.map((p) => removePlayer(p.id)))
    } catch (err) {
      console.error('Erro ao limpar board:', err)
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
    clearBoard,
  }
}
