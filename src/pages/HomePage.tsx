import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { CreateRoomDTO, RecentRoom } from '../types'
import {
  createRoom,
  deleteRoom,
  getRoom,
  normalizeRoomId,
} from '../services/roomService'
import {
  getRecentRooms,
  addToRecentRooms,
  removeFromRecentRooms,
} from '../services/userService'
import { useAuth } from '../contexts'
import { Avatar, Footer, Logo, NicknameModal, ThemeToggle } from '../components'
import { LogOut, ChevronRight, List, Trash2, FolderOpen, Pencil, Lock } from 'lucide-react'

export function HomePage() {
  const navigate = useNavigate()
  const { user, signOut, signInWithGoogle, updateNickname } = useAuth()

  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showNicknameModal, setShowNicknameModal] = useState(false)

  // Form state
  const [roomName, setRoomName] = useState('')
  const [customId, setCustomId] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)

  // Load recent rooms for logged in users
  useEffect(() => {
    const loadRooms = async () => {
      if (user) {
        try {
          const rooms = await getRecentRooms(user.id)
          setRecentRooms(rooms)
        } catch (err) {
          console.error('Erro ao carregar salas:', err)
        }
      }
      setLoading(false)
    }
    loadRooms()
  }, [user])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim()) return

    // Validate password length if provided
    if (password.trim() && password.trim().length < 4) {
      setError('Senha deve ter no mínimo 4 caracteres')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const data: CreateRoomDTO = {
        name: roomName.trim(),
        customId: customId.trim() || undefined,
        password: password.trim() || undefined,
        ownerId: user?.id,
      }
      const room = await createRoom(data)

      // Add to recent rooms if logged in
      if (user) {
        await addToRecentRooms(user.id, {
          id: room.id,
          name: room.name,
          role: 'owner',
          hasPassword: !!password.trim(),
        })
      }

      // Passa state indicando que é o criador (não pede senha)
      navigate(`/sala/${room.id}`, { state: { isCreator: true } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sala')
    } finally {
      setCreating(false)
    }
  }

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim() || joining) return

    const normalized = normalizeRoomId(joinCode)
    setJoining(true)
    setJoinError(null)

    try {
      const room = await getRoom(normalized)
      if (room) {
        // RoomPage já vai adicionar aos recentes quando carregar
        navigate(`/sala/${normalized}`)
      } else {
        setJoinError('Sala não encontrada. Verifique o código.')
      }
    } catch (err) {
      console.error('Erro ao buscar sala:', err)
      setJoinError('Erro ao buscar sala. Tente novamente.')
    } finally {
      setJoining(false)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId)
      if (user) {
        await removeFromRecentRooms(user.id, roomId)
        setRecentRooms(recentRooms.filter((r) => r.id !== roomId))
      }
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Erro ao excluir sala:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Header - Logo left, User right */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 pt-2"
        >
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 p-3">
            <div className="flex items-center justify-between">
              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <Logo size="sm" showText={false} />
                <div>
                  <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">
                    Board<span className="text-indigo-600 dark:text-indigo-400">Score</span>
                  </h1>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Placar digital</p>
                </div>
              </div>

              {/* User Info */}
              {user ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <Avatar src={user.photoURL} name={user.displayName} size="sm" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-[100px] truncate leading-tight">
                        {user.displayName}
                      </span>
                      <button
                        onClick={() => setShowNicknameModal(true)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 max-w-[100px] truncate leading-tight transition-colors group"
                        title="Alterar nickname"
                      >
                        <span className="truncate">{user.nickname}</span>
                        <Pencil size={10} className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
                      </button>
                    </div>
                  </div>
                  <ThemeToggle />
                  <button
                    onClick={signOut}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Sair"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1 px-3 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                >
                  Entrar <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>
        </motion.header>

        {/* Join Room */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <form onSubmit={handleJoinRoom} className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => {
                setJoinCode(e.target.value.toUpperCase())
                setJoinError(null)
              }}
              placeholder="Código da sala (ex: ABC123)"
              autoComplete="off"
              disabled={joining}
              className={`flex-1 px-4 py-3 bg-white dark:bg-slate-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono disabled:bg-gray-100 dark:disabled:bg-slate-700 dark:text-white dark:placeholder-slate-400 ${
                joinError ? 'border-red-400' : 'border-gray-200 dark:border-slate-600'
              }`}
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!joinCode.trim() || joining}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {joining ? '...' : 'Entrar'}
            </motion.button>
          </form>
          <AnimatePresence>
            {joinError && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-red-500 text-sm mt-2 text-center"
              >
                {joinError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
          <span className="text-slate-400 dark:text-slate-500 text-sm">ou</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
        </div>

        {/* Create Room Button / Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {!user ? (
            // Anonymous users can't create rooms
            <div className="text-center py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-slate-500 dark:text-slate-400 mb-2">Faça login para criar salas</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-3">Usuários não logados podem apenas entrar em salas existentes</p>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={signInWithGoogle}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Entrar com Google
              </motion.button>
            </div>
          ) : !showCreateForm ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateForm(true)}
              className="w-full py-4 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 rounded-xl font-semibold border-2 border-dashed border-indigo-300 dark:border-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            >
              ✨ Criar Nova Sala
            </motion.button>
          ) : (
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleCreateRoom}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Sala *
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ex: Poker da Sexta"
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Código personalizado{' '}
                  <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="Ex: poker-sexta"
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Deixe em branco para gerar automaticamente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Senha{' '}
                  <span className="text-slate-400 dark:text-slate-500 font-normal">(opcional)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Deixe em branco para sala pública"
                  autoComplete="new-password"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setRoomName('')
                    setCustomId('')
                    setPassword('')
                    setError(null)
                  }}
                  className="flex-1 py-3 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!roomName.trim() || creating}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar Sala'}
                </motion.button>
              </div>
            </motion.form>
          )}
        </motion.div>

        {/* Rooms List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
            <List size={18} className="text-indigo-500 dark:text-indigo-400" />
            Suas Salas
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-white dark:bg-slate-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : !user ? (
            <div className="text-center py-8">
              <p className="text-slate-400 dark:text-slate-500 mb-2">
                Faça login para salvar suas salas
              </p>
              <p className="text-slate-300 dark:text-slate-600 text-sm">
                Usuários anônimos podem entrar em salas pelo código
              </p>
            </div>
          ) : recentRooms.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen size={40} className="mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-400 dark:text-slate-500">
                Nenhuma sala ainda. Crie uma ou entre pelo código!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {recentRooms.map((room) => (
                  <motion.div
                    key={room.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/sala/${room.id}`)}
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-800 dark:text-white">
                            {room.name}
                          </h3>
                          {room.hasPassword && (
                            <Lock size={14} className="text-slate-400 dark:text-slate-500" />
                          )}
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              room.role === 'owner'
                                ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'
                                : 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400'
                            }`}
                          >
                            {room.role === 'owner' ? 'Dono' : 'Player'}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                          {room.id}
                        </p>
                      </div>

                      {room.role === 'owner' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(room.id)
                          }}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Excluir sala"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-3 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                  <Trash2 size={32} className="text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                  Excluir Sala?
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Esta ação não pode ser desfeita. Todos os jogadores e placares
                  serão removidos permanentemente.
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteRoom(deleteConfirm)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                >
                  Excluir
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <Footer />

      {/* Nickname Modal */}
      <NicknameModal
        isOpen={showNicknameModal}
        currentNickname={user?.nickname}
        onSave={async (nickname) => {
          await updateNickname(nickname)
          setShowNicknameModal(false)
        }}
        onClose={() => setShowNicknameModal(false)}
      />
    </div>
  )
}
