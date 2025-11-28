import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useScoreboard } from '../hooks'
import { useAuth } from '../contexts'
import {
  PlayerCard,
  AddPlayerForm,
  ScoreControl,
  SkeletonList,
  HistoryPanel,
  SoundToggle,
} from '../components'
import type { Room } from '../types'
import { getRoom, finishRoom, reopenRoom, verifyRoomPassword } from '../services/roomService'
import { addToRecentRooms } from '../services/userService'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user, signInWithGoogle } = useAuth()
  
  const [room, setRoom] = useState<Room | null>(null)
  const [roomLoading, setRoomLoading] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyRoomCode = useCallback(() => {
    if (!roomId) return
    navigator.clipboard.writeText(roomId.toUpperCase())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [roomId])

  const {
    players,
    loading: playersLoading,
    error: playersError,
    addNewPlayer,
    incrementScore,
    decrementScore,
    deletePlayer,
    resetScores,
    clearBoard,
  } = useScoreboard(roomId || '')

  const [scoreAmount, setScoreAmount] = useState(1)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const isOwner = room?.ownerId === user?.id
  const hasAutoAddedRef = useRef(false)

  // Auto-add logged-in user as player when entering room
  useEffect(() => {
    // Only if: room is loaded, user is logged in (not anonymous), room is authenticated, and players are loaded
    if (!room || !user || !isAuthenticated || playersLoading) return
    
    // Prevent duplicate adds
    if (hasAutoAddedRef.current) return
    
    // Check if user is already a player (by odUserId)
    const alreadyPlayer = players.some((p) => p.odUserId === user.id)
    if (alreadyPlayer) {
      hasAutoAddedRef.current = true
      return
    }

    // Auto-add the user as a player
    hasAutoAddedRef.current = true
    const autoAddPlayer = async () => {
      try {
        await addNewPlayer({
          name: user.nickname,
          odUserId: user.id,
          photoURL: user.photoURL || undefined,
        })
      } catch (err) {
        console.error('Erro ao adicionar jogador automaticamente:', err)
        hasAutoAddedRef.current = false // Allow retry on error
      }
    }

    autoAddPlayer()
  }, [room, user, isAuthenticated, players, playersLoading, addNewPlayer])

  // Reset auto-add flag when room changes
  useEffect(() => {
    hasAutoAddedRef.current = false
  }, [roomId])

  // Load room data
  useEffect(() => {
    if (!roomId) {
      setRoomError('Sala não encontrada')
      setRoomLoading(false)
      return
    }

    const loadRoom = async () => {
      try {
        const roomData = await getRoom(roomId)
        if (!roomData) {
          setRoomError('Sala não encontrada')
        } else {
          setRoom(roomData)
          // If no password, auto-authenticate
          if (!roomData.password) {
            setIsAuthenticated(true)
            // Add to recent rooms only for rooms without password (com senha, adiciona no handlePasswordSubmit)
            if (user) {
              addToRecentRooms(user.id, {
                id: roomId,
                name: roomData.name,
                role: roomData.ownerId === user.id ? 'owner' : 'player',
              })
            }
          }
        }
      } catch (err) {
        console.error('Erro ao carregar sala:', err)
        setRoomError('Erro ao carregar sala')
      } finally {
        setRoomLoading(false)
      }
    }

    loadRoom()
  }, [roomId, user]) // Removido isAuthenticated para evitar re-run

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!room) return

    // Usa o room já carregado em vez de buscar novamente
    const valid = verifyRoomPassword(room, passwordInput)
    if (valid) {
      setIsAuthenticated(true)
      setPasswordError(false)
      // Add to recent rooms after successful password entry
      if (user) {
        addToRecentRooms(user.id, {
          id: room.id,
          name: room.name,
          role: room.ownerId === user.id ? 'owner' : 'player',
        })
      }
    } else {
      setPasswordError(true)
    }
  }

  const handleAddPlayer = async (name: string) => {
    // Players added manually are guests - don't link to current user
    await addNewPlayer({
      name,
    })
  }

  const handleResetScores = async () => {
    await resetScores()
    setShowResetConfirm(false)
  }

  const handleClearBoard = async () => {
    // Keep owner in the room, remove everyone else
    await clearBoard(user?.id)
    setShowClearConfirm(false)
  }

  const handleFinishGame = async () => {
    if (!roomId) return
    await finishRoom(roomId)
    setRoom((prev) => (prev ? { ...prev, status: 'finished' } : null))
    setShowFinishConfirm(false)
  }

  const handleReopenGame = async () => {
    if (!roomId) return
    await reopenRoom(roomId)
    setRoom((prev) => (prev ? { ...prev, status: 'active' } : null))
  }

  const isReadOnly = room?.status === 'finished'
  const canEdit = !isReadOnly && (isOwner || !room?.ownerId) // Owner or legacy room without owner
  const loading = roomLoading || playersLoading
  const error = roomError || playersError

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-8">
        <div className="max-w-md mx-auto">
          <header className="text-center mb-6 pt-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">🎯 BoardScore</h1>
            <p className="text-gray-500 text-sm">Carregando...</p>
          </header>
          <div className="mb-4 h-12 bg-white rounded-xl animate-pulse" />
          <div className="mb-6 h-10 bg-white rounded-xl animate-pulse" />
          <SkeletonList count={3} />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center p-6">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <Link
            to="/"
            className="text-indigo-600 hover:text-indigo-800 font-semibold"
          >
            ← Voltar para o início
          </Link>
        </div>
      </div>
    )
  }

  // Password prompt
  if (room?.password && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔒</div>
            <h2 className="text-xl font-bold text-gray-800">{room.name}</h2>
            <p className="text-gray-500 text-sm">Esta sala é protegida por senha</p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            {/* Hidden username field for accessibility */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value={room.id}
              readOnly
              className="hidden"
              aria-hidden="true"
            />
            <input
              type="password"
              name="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Digite a senha"
              autoComplete="current-password"
              className={`w-full px-4 py-3 border rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                passwordError ? 'border-red-500' : 'border-gray-200'
              }`}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-500 text-sm text-center mb-4">
                Senha incorreta
              </p>
            )}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              Entrar
            </motion.button>
          </form>

          <Link
            to="/"
            className="block text-center text-gray-500 hover:text-gray-700 mt-4 text-sm"
          >
            ← Voltar
          </Link>
        </motion.div>
      </div>
    )
  }

  // Login required prompt
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="text-4xl mb-2">🔐</div>
            <h2 className="text-xl font-bold text-gray-800">{room?.name || 'Sala'}</h2>
            <p className="text-gray-500 text-sm">Faça login para entrar na sala</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors mb-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </motion.button>

          <Link
            to="/"
            className="block text-center text-gray-500 hover:text-gray-700 text-sm"
          >
            ← Voltar
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 pt-4 relative"
        >
          {/* Back button */}
          <Link
            to="/"
            className="absolute left-0 top-4 p-2 text-gray-500 hover:text-gray-700"
          >
            ← 
          </Link>

          {/* Sound toggle */}
          <div className="absolute right-0 top-4">
            <SoundToggle />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            {room?.name || '🎯 BoardScore'}
          </h1>
          
          {/* Copyable Room Code */}
          <motion.button
            onClick={copyRoomCode}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-mono text-sm transition-colors"
            title="Clique para copiar"
          >
            <span className="font-bold tracking-wider">{roomId?.toUpperCase()}</span>
            <span className="text-indigo-500">
              {copied ? '✓' : '📋'}
            </span>
          </motion.button>
          {copied && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-green-600 mt-1"
            >
              Código copiado!
            </motion.p>
          )}
          
          {isReadOnly && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2"
            >
              <span className="inline-flex items-center gap-1 text-sm bg-gray-200 text-gray-600 px-3 py-1 rounded-full">
                🏁 Jogo Finalizado
              </span>
            </motion.div>
          )}
        </motion.header>

        {/* Add guest form - only for room owner */}
        {!isReadOnly && isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <AddPlayerForm onAdd={handleAddPlayer} />
            <p className="text-xs text-gray-400 text-center mt-2">
              💡 Para convidados sem celular
            </p>
          </motion.div>
        )}

        {/* Score control - only if not read-only */}
        {!isReadOnly && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <ScoreControl value={scoreAmount} onChange={setScoreAmount} />
          </motion.div>
        )}

        {/* Players list */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {players.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-400 py-12"
              >
                {isReadOnly
                  ? 'Nenhum jogador nesta partida'
                  : 'Adicione jogadores para começar! 🎮'}
              </motion.p>
            ) : (
              players.map((player, index) => {
                const isCurrentUser = player.odUserId === user?.id
                return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  rank={index + 1}
                  onIncrement={
                    isReadOnly
                      ? () => {}
                      : () => incrementScore(player.id, scoreAmount)
                  }
                  onDecrement={
                    isReadOnly
                      ? () => {}
                      : () => decrementScore(player.id, scoreAmount)
                  }
                  onDelete={isReadOnly ? () => {} : () => deletePlayer(player.id)}
                  disabled={isReadOnly}
                  canDelete={isOwner && !isCurrentUser}
                />
              )})
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons - only if can edit */}
        {canEdit && players.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-3"
          >
            {/* Main buttons */}
            {!showResetConfirm && !showClearConfirm && !showFinishConfirm && (
              <>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="flex-1 py-3 bg-white text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    🔄 Zerar Placar
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex-1 py-3 bg-white text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-colors border border-red-200"
                  >
                    🗑️ Limpar
                  </button>
                </div>
                <button
                  onClick={() => setShowFinishConfirm(true)}
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                >
                  🏁 Finalizar Jogo
                </button>
              </>
            )}

            {/* Reset scores confirm */}
            {showResetConfirm && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <p className="text-center text-gray-600 text-sm mb-2">
                  Zerar pontuação de todos os jogadores?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 bg-white text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResetScores}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Clear board confirm */}
            {showClearConfirm && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <p className="text-center text-red-600 text-sm mb-2">
                  ⚠️ Remover TODOS os jogadores?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-3 bg-white text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleClearBoard}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                  >
                    Remover Todos
                  </button>
                </div>
              </motion.div>
            )}

            {/* Finish game confirm */}
            {showFinishConfirm && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <p className="text-center text-green-600 text-sm mb-2">
                  🏁 Finalizar o jogo? A sala ficará somente leitura.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFinishConfirm(false)}
                    className="flex-1 py-3 bg-white text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleFinishGame}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
                  >
                    Finalizar
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Reopen button for finished games */}
        {isReadOnly && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <button
              onClick={handleReopenGame}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              🔓 Reabrir Jogo
            </button>
          </motion.div>
        )}

        {/* History panel */}
        <HistoryPanel />

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          {players.length} jogador{players.length !== 1 ? 'es' : ''}
        </p>
      </div>
    </div>
  )
}
