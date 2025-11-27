import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useScoreboard } from '../hooks'
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

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  
  const [room, setRoom] = useState<Room | null>(null)
  const [roomLoading, setRoomLoading] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)

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
  }, [roomId])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomId) return

    const valid = await verifyRoomPassword(roomId, passwordInput)
    if (valid) {
      setIsAuthenticated(true)
      setPasswordError(false)
    } else {
      setPasswordError(true)
    }
  }

  const handleAddPlayer = async (name: string) => {
    await addNewPlayer({ name })
  }

  const handleResetScores = async () => {
    await resetScores()
    setShowResetConfirm(false)
  }

  const handleClearBoard = async () => {
    await clearBoard()
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
          <p className="text-gray-400 text-xs font-mono">{roomId}</p>
          
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

        {/* Form - only if not read-only */}
        {!isReadOnly && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <AddPlayerForm onAdd={handleAddPlayer} />
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
              players.map((player, index) => (
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
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons - only if not read-only */}
        {!isReadOnly && players.length > 0 && (
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
