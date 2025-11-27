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
import { Avatar } from '../components'

export function HomePage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const [recentRooms, setRecentRooms] = useState<RecentRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

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
        })
      }

      navigate(`/sala/${room.id}`)
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
        // Add to recent rooms if logged in
        if (user) {
          await addToRecentRooms(user.id, {
            id: room.id,
            name: room.name,
            role: room.ownerId === user.id ? 'owner' : 'player',
          })
        }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Header with User Info */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 pt-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">🎯 BoardScore</h1>
            {user ? (
              <div className="flex items-center gap-2">
                <Avatar src={user.photoURL} name={user.nickname} size="sm" />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{user.nickname}</p>
                  <button
                    onClick={signOut}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                👤 Anônimo
              </span>
            )}
          </div>
          <p className="text-gray-500 text-center">Placar digital em tempo real</p>
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
              className={`flex-1 px-4 py-3 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono disabled:bg-gray-100 ${
                joinError ? 'border-red-400' : 'border-gray-200'
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
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-gray-400 text-sm">ou</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Create Room Button / Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {!showCreateForm ? (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCreateForm(true)}
              className="w-full py-4 bg-white text-indigo-600 rounded-xl font-semibold border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
            >
              ✨ Criar Nova Sala
            </motion.button>
          ) : (
            <motion.form
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              onSubmit={handleCreateRoom}
              className="bg-white rounded-xl shadow-lg p-4 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Sala *
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ex: Poker da Sexta"
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código personalizado{' '}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={customId}
                  onChange={(e) => setCustomId(e.target.value)}
                  placeholder="Ex: poker-sexta"
                  autoComplete="off"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Deixe em branco para gerar automaticamente
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Senha{' '}
                  <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Deixe em branco para sala pública"
                  autoComplete="new-password"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
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
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            📋 Suas Salas
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-white rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : !user ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">
                Faça login para salvar suas salas
              </p>
              <p className="text-gray-300 text-sm">
                Usuários anônimos podem entrar em salas pelo código
              </p>
            </div>
          ) : recentRooms.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              Nenhuma sala ainda. Crie uma ou entre pelo código!
            </p>
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
                    className="bg-white rounded-xl shadow-md p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/sala/${room.id}`)}
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">
                            {room.name}
                          </h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              room.role === 'owner'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {room.role === 'owner' ? '👑 Dono' : '👤 Player'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 font-mono">
                          {room.id}
                        </p>
                      </div>

                      {room.role === 'owner' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirm(room.id)
                          }}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir sala"
                        >
                          🗑️
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
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm"
            >
              <div className="text-center mb-6">
                <div className="text-5xl mb-3">🗑️</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Excluir Sala?
                </h3>
                <p className="text-gray-500 text-sm">
                  Esta ação não pode ser desfeita. Todos os jogadores e placares
                  serão removidos permanentemente.
                </p>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
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
    </div>
  )
}
