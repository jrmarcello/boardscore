import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Copy, Check, Flag, RotateCcw, Trash2, Lock, Unlock, AlertCircle, Tv, KeyRound } from 'lucide-react'
import { useScoreboard } from '../hooks'
import { useAuth } from '../contexts'
import {
  PlayerCard,
  AddPlayerForm,
  ScoreControl,
  SkeletonList,
  HistoryPanel,
  SoundToggle,
  Logo,
} from '../components'
import type { Room } from '../types'
import { finishRoom, reopenRoom, verifyRoomPassword, subscribeToRoom, updateRoomPassword } from '../services/roomService'
import { addToRecentRooms } from '../services/userService'
import { updatePlayerName } from '../services/gameService'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signInWithGoogle, needsNickname } = useAuth()
  
  // Verifica se o usuário acabou de criar a sala
  const isCreator = (location.state as { isCreator?: boolean })?.isCreator === true
  
  const [room, setRoom] = useState<Room | null>(null)
  const [roomLoading, setRoomLoading] = useState(true)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState(false)
  
  const [showFinishConfirm, setShowFinishConfirm] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)
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
  const wasPlayerRef = useRef(false)

  // Detect if user was removed from the game and redirect to home
  useEffect(() => {
    // Skip if loading, not authenticated, or no user
    if (playersLoading || !isAuthenticated || !user) return
    
    // Check if user is currently a player
    const isPlayer = players.some((p) => p.odUserId === user.id)
    
    // If user was a player before and is no longer in the list, they were removed
    if (wasPlayerRef.current && !isPlayer && !isOwner) {
      // Redirect to home
      navigate('/', { replace: true })
      return
    }
    
    // Update the ref to track if user is currently a player
    wasPlayerRef.current = isPlayer
  }, [players, playersLoading, isAuthenticated, user, isOwner, navigate])

  // Auto-add logged-in user as player when entering room
  useEffect(() => {
    // Only if: room is loaded, user is logged in (not anonymous), room is authenticated, and players are loaded
    if (!room || !user || !isAuthenticated || playersLoading) return
    
    // Prevent duplicate adds
    if (hasAutoAddedRef.current) return
    
    // Check if user is already a player (by odUserId)
    const existingPlayer = players.find((p) => p.odUserId === user.id)
    if (existingPlayer) {
      hasAutoAddedRef.current = true
      
      // Sync player name if user has a custom nickname and it differs from player name
      const expectedName = needsNickname ? user.displayName : user.nickname
      if (existingPlayer.name !== expectedName) {
        updatePlayerName(roomId!, existingPlayer.id, expectedName)
      }
      return
    }

    // Auto-add the user as a player (use nickname if set, otherwise displayName)
    hasAutoAddedRef.current = true
    const autoAddPlayer = async () => {
      try {
        await addNewPlayer({
          name: needsNickname ? user.displayName : user.nickname,
          odUserId: user.id,
          photoURL: user.photoURL || undefined,
        })
      } catch (err) {
        console.error('Erro ao adicionar jogador automaticamente:', err)
        hasAutoAddedRef.current = false // Allow retry on error
      }
    }

    autoAddPlayer()
  }, [room, user, isAuthenticated, players, playersLoading, addNewPlayer, needsNickname, roomId])

  // Reset auto-add flag when room changes
  useEffect(() => {
    hasAutoAddedRef.current = false
  }, [roomId])

  // Subscribe to room data in real-time
  // OTIMIZADO: onSnapshot já retorna os dados na primeira chamada, evitando getDoc separado
  useEffect(() => {
    if (!roomId) {
      Promise.resolve().then(() => {
        setRoomError('Sala não encontrada')
        setRoomLoading(false)
      })
      return
    }

    let isMounted = true
    let isFirstSnapshot = true

    // Subscribe to real-time updates - primeiro snapshot já traz os dados iniciais
    const unsubscribe = subscribeToRoom(roomId, (roomData) => {
      if (!isMounted) return
      
      if (isFirstSnapshot) {
        isFirstSnapshot = false
        
        if (!roomData) {
          setRoomError('Sala não encontrada')
          setRoomLoading(false)
          return
        }
        
        setRoom(roomData)
        setRoomLoading(false)
        
        // Auto-authenticate if: no password OR user is owner OR user just created the room
        const isOwnerCheck = user && roomData.ownerId === user.id
        if (!roomData.password || isOwnerCheck || isCreator) {
          setIsAuthenticated(true)
          // Add to recent rooms
          if (user) {
            addToRecentRooms(user.id, {
              id: roomId,
              name: roomData.name,
              role: isOwnerCheck ? 'owner' : 'player',
              hasPassword: !!roomData.password,
            })
          }
        }
      } else if (roomData) {
        // Atualizações subsequentes
        setRoom(roomData)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [roomId, user, isCreator])

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!room) return

    // Usa o room já carregado em vez de buscar novamente
    const valid = await verifyRoomPassword(room, passwordInput)
    if (valid) {
      setIsAuthenticated(true)
      setPasswordError(false)
      // Add to recent rooms after successful password entry
      if (user) {
        addToRecentRooms(user.id, {
          id: room.id,
          name: room.name,
          role: room.ownerId === user.id ? 'owner' : 'player',
          hasPassword: true,
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
    // Room status will be updated via real-time subscription
    setShowFinishConfirm(false)
  }

  const handleReopenGame = async () => {
    if (!roomId) return
    await reopenRoom(roomId)
    // Room status will be updated via real-time subscription
  }

  const handleUpdatePassword = async () => {
    if (!roomId) return
    
    // Validate password length if provided
    if (newPassword.trim() && newPassword.trim().length < 4) {
      return
    }
    
    setPasswordSaving(true)
    try {
      await updateRoomPassword(roomId, newPassword.trim() || null)
      setShowPasswordModal(false)
      setNewPassword('')
    } finally {
      setPasswordSaving(false)
    }
  }

  const isReadOnly = room?.status === 'finished'
  const canEdit = !isReadOnly && (isOwner || !room?.ownerId) // Owner or legacy room without owner
  const loading = roomLoading || playersLoading
  const error = roomError || playersError

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 pb-8">
        <div className="max-w-md mx-auto">
          <header className="text-center mb-6 pt-4">
            <Logo size="sm" showText={false} className="mx-auto mb-2" />
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">BoardScore</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Carregando...</p>
          </header>
          <div className="mb-4 h-12 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="mb-6 h-10 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />
          <SkeletonList count={3} />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50 to-slate-100 dark:from-slate-900 dark:via-red-950/30 dark:to-slate-900">
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <p className="text-lg text-red-600 dark:text-red-400 mb-4 font-medium">{error}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
          >
            <ArrowLeft size={18} /> Voltar para o início
          </Link>
        </div>
      </div>
    )
  }

  // Password prompt
  if (room?.password && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700 p-6 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <Lock size={24} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{room.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Esta sala é protegida por senha</p>
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
              className={`w-full px-4 py-3 border-2 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors bg-white dark:bg-slate-700 dark:text-white ${
                passwordError ? 'border-red-400 dark:border-red-500' : 'border-slate-200 dark:border-slate-600'
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
            className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 mt-4 text-sm"
          >
            <ArrowLeft size={16} />
            Voltar
          </Link>
        </motion.div>
      </div>
    )
  }

  // Login required prompt
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950/50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 w-full max-w-sm"
        >
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
              <Lock size={28} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{room?.name || 'Sala'}</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Faça login para entrar na sala</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors mb-4 shadow-sm"
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
            className="block text-center text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm"
          >
            <span className="inline-flex items-center gap-1"><ArrowLeft size={14} /> Voltar</span>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 pb-8">
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
            className="absolute left-0 top-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>

          {/* Sound toggle */}
          <div className="absolute right-0 top-4 flex items-center gap-1">
            <Link
              to={`/tv/${roomId}`}
              target="_blank"
              className="p-2 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
              title="Abrir modo TV"
            >
              <Tv size={18} />
            </Link>
            <SoundToggle />
          </div>

          {/* Logo */}
          <div className="flex justify-center mb-2">
            <Logo size="sm" />
          </div>
          
          {isReadOnly && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2"
            >
              <span className="inline-flex items-center gap-1.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                <Flag size={14} className="text-emerald-600 dark:text-emerald-400" />
                Jogo Finalizado
              </span>
            </motion.div>
          )}
        </motion.header>

        {/* Room info bar: Name/Code left, Actions right */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6 bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-100 dark:border-slate-700"
        >
          {/* Left: Room name and code */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white truncate">
              {room?.name || 'Sala'}
            </h2>
            <motion.button
              onClick={copyRoomCode}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono text-sm rounded-lg transition-colors"
              title="Clique para copiar"
            >
              <span className="tracking-wider">{roomId?.toUpperCase()}</span>
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </motion.button>
          </div>

          {/* Right: Action buttons (owner only) */}
          {!isReadOnly && isOwner && (
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => {
                  setNewPassword('')
                  setShowPasswordModal(true)
                }}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                title={room?.password ? 'Alterar Senha' : 'Adicionar Senha'}
              >
                <KeyRound size={18} />
              </button>
              <button
                onClick={() => setShowFinishConfirm(true)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                title="Finalizar Jogo"
              >
                <Flag size={18} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Add guest form - only for room owner */}
        {!isReadOnly && isOwner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4"
          >
            <AddPlayerForm onAdd={handleAddPlayer} />
            <p className="text-xs text-slate-400 text-center mt-2">
              Adicione jogadores sem celular
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
                className="text-center text-slate-400 dark:text-slate-500 py-12"
              >
                {isReadOnly
                  ? 'Nenhum jogador nesta partida'
                  : 'Adicione jogadores para começar!'}
              </motion.p>
            ) : (
              players.map((player, index) => {
                const isCurrentUser = player.odUserId === user?.id
                // Owner pode editar todos os scores, player só pode editar o próprio
                const canEditScore = isOwner || isCurrentUser
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
                  canEditScore={canEditScore}
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
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600 inline-flex items-center justify-center gap-2"
                >
                  <RotateCcw size={16} />
                  Zerar Placar
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex-1 py-3 bg-white dark:bg-slate-800 text-red-500 rounded-xl font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors border border-red-200 dark:border-red-800 inline-flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Esvaziar Sala
                </button>
              </div>
            )}

            {/* Reset scores confirm */}
            {showResetConfirm && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <p className="text-center text-slate-600 dark:text-slate-300 text-sm mb-2">
                  Zerar pontuação de todos os jogadores?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600"
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
                <p className="text-center text-red-600 dark:text-red-400 text-sm mb-2">
                  Remover TODOS os jogadores?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-600"
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
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Unlock size={16} />
              Reabrir Jogo
            </button>
          </motion.div>
        )}

        {/* History panel */}
        <HistoryPanel />

        {/* Footer */}
        <p className="text-center text-slate-400 dark:text-slate-500 text-xs mt-8">
          {players.length} jogador{players.length !== 1 ? 'es' : ''}
        </p>
      </div>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <KeyRound size={20} />
                {room?.password ? 'Alterar Senha' : 'Adicionar Senha'}
              </h3>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdatePassword() }}>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={room?.password ? 'Nova senha (deixe vazio para remover)' : 'Digite a senha'}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                  minLength={4}
                  autoFocus
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
                  {room?.password 
                    ? 'Deixe em branco para remover a senha'
                    : 'Mínimo 4 caracteres'
                  }
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={passwordSaving || (newPassword.trim().length > 0 && newPassword.trim().length < 4)}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {passwordSaving ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Finish Game Confirmation Modal */}
      <AnimatePresence>
        {showFinishConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowFinishConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl"
            >
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <Flag size={20} className="text-emerald-600" />
                Finalizar Jogo
              </h3>
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                A sala ficará somente leitura. Você poderá reabrir depois se quiser.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFinishConfirm(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleFinishGame}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Finalizar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
