import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { Room, CreateRoomDTO } from '../types'
import {
  listRooms,
  createRoom,
  deleteRoom,
  normalizeRoomId,
} from '../services/roomService'

export function HomePage() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [roomName, setRoomName] = useState('')
  const [customId, setCustomId] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)

  // Load rooms
  useEffect(() => {
    loadRooms()
  }, [])

  const loadRooms = async () => {
    try {
      const roomsList = await listRooms()
      setRooms(roomsList)
    } catch (err) {
      console.error('Erro ao carregar salas:', err)
    } finally {
      setLoading(false)
    }
  }

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
      }
      const room = await createRoom(data)
      navigate(`/sala/${room.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar sala')
    } finally {
      setCreating(false)
    }
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    const normalized = normalizeRoomId(joinCode)
    navigate(`/sala/${normalized}`)
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sala?')) return

    try {
      await deleteRoom(roomId)
      setRooms(rooms.filter((r) => r.id !== roomId))
    } catch (err) {
      console.error('Erro ao excluir sala:', err)
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-6"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🎯 BoardScore</h1>
          <p className="text-gray-500">Placar digital em tempo real</p>
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
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Código da sala (ex: ABC123)"
              autoComplete="off"
              className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!joinCode.trim()}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Entrar
            </motion.button>
          </form>
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
          ) : rooms.length === 0 ? (
            <p className="text-center text-gray-400 py-8">
              Nenhuma sala criada ainda
            </p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {rooms.map((room) => (
                  <motion.div
                    key={room.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    className={`bg-white rounded-xl shadow-md p-4 ${
                      room.status === 'finished' ? 'opacity-75' : ''
                    }`}
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
                          {room.password && (
                            <span title="Protegida por senha">🔒</span>
                          )}
                          {room.status === 'finished' && (
                            <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                              Finalizada
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 font-mono">
                          {room.id}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Criada em {formatDate(room.createdAt)}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteRoom(room.id)
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir sala"
                      >
                        🗑️
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
