import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Tv, Trophy, Wifi, WifiOff } from 'lucide-react'
import { useScoreboard } from '../hooks'
import { subscribeToRoom } from '../services/roomService'
import type { Room } from '../types'

// Generate a consistent color based on the name
function getColorFromName(name: string): string {
  const colors = [
    'from-red-500 to-red-600',
    'from-orange-500 to-orange-600',
    'from-amber-500 to-amber-600',
    'from-yellow-500 to-yellow-600',
    'from-lime-500 to-lime-600',
    'from-green-500 to-green-600',
    'from-emerald-500 to-emerald-600',
    'from-teal-500 to-teal-600',
    'from-cyan-500 to-cyan-600',
    'from-sky-500 to-sky-600',
    'from-blue-500 to-blue-600',
    'from-indigo-500 to-indigo-600',
    'from-violet-500 to-violet-600',
    'from-purple-500 to-purple-600',
    'from-fuchsia-500 to-fuchsia-600',
    'from-pink-500 to-pink-600',
    'from-rose-500 to-rose-600',
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function TVPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const [room, setRoom] = useState<Room | null>(null)
  const [roomError, setRoomError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)

  const { players, loading, error } = useScoreboard(roomId || '')

  // Subscribe to room data
  useEffect(() => {
    if (!roomId) {
      Promise.resolve().then(() => setRoomError('Sala não encontrada'))
      return
    }

    const unsubscribe = subscribeToRoom(roomId, (roomData) => {
      if (roomData) {
        setRoom(roomData)
        setIsConnected(true)
      } else {
        setRoomError('Sala não encontrada')
      }
    })

    // Connection status check
    const checkConnection = () => {
      setIsConnected(navigator.onLine)
    }
    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)

    return () => {
      unsubscribe()
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', checkConnection)
    }
  }, [roomId])

  // Sort players by score (descending)
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  // Error state
  if (roomError || error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Tv size={64} className="mx-auto mb-4 text-slate-600" />
          <p className="text-2xl text-slate-400">{roomError || error}</p>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading || !room) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Tv size={64} className="mx-auto text-indigo-500" />
          </motion.div>
          <p className="text-2xl text-slate-400 mt-4">Conectando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Trophy size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-white">{room.name}</h1>
            <p className="text-slate-400 text-lg">
              {roomId?.toUpperCase()} • {players.length} jogador{players.length !== 1 ? 'es' : ''}
            </p>
          </div>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Wifi size={24} className="text-emerald-500" />
          ) : (
            <WifiOff size={24} className="text-red-500" />
          )}
          {room.status === 'finished' && (
            <span className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-lg font-semibold">
              Finalizado
            </span>
          )}
        </div>
      </header>

      {/* Scoreboard */}
      <div className="flex-1 flex flex-col justify-center">
        {sortedPlayers.length === 0 ? (
          <div className="text-center">
            <p className="text-3xl text-slate-500">Aguardando jogadores...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {sortedPlayers.map((player, index) => {
                const isFirst = index === 0 && players.length > 1
                const bgGradient = getColorFromName(player.name)

                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className={`
                      flex items-center gap-6 p-6 rounded-2xl
                      ${isFirst 
                        ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-2 border-amber-500/30' 
                        : 'bg-slate-800/50 border border-slate-700/50'
                      }
                    `}
                  >
                    {/* Position */}
                    <div className={`
                      w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold
                      ${isFirst 
                        ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-900' 
                        : 'bg-slate-700 text-slate-300'
                      }
                    `}>
                      {index + 1}º
                    </div>

                    {/* Avatar */}
                    {player.photoURL ? (
                      <img
                        src={player.photoURL}
                        alt={player.name}
                        className="w-20 h-20 rounded-full object-cover border-4 border-slate-600"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${bgGradient} flex items-center justify-center text-3xl font-bold text-white border-4 border-slate-600`}>
                        {getInitials(player.name)}
                      </div>
                    )}

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <h2 className={`text-4xl font-bold truncate ${isFirst ? 'text-amber-400' : 'text-white'}`}>
                        {player.name}
                      </h2>
                    </div>

                    {/* Score */}
                    <div className={`
                      text-6xl font-black tabular-nums
                      ${isFirst ? 'text-amber-400' : 'text-white'}
                    `}>
                      {player.score}
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center">
        <p className="text-slate-500 text-lg">
          BoardScore • Acesse <span className="text-indigo-400 font-mono">{window.location.host}/sala/{roomId?.toUpperCase()}</span> para jogar
        </p>
      </footer>
    </div>
  )
}
