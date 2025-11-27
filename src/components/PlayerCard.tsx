import { motion } from 'framer-motion'
import type { Player } from '../types'

interface PlayerCardProps {
  player: Player
  rank: number
  onIncrement: () => void
  onDecrement: () => void
  onDelete: () => void
}

export function PlayerCard({
  player,
  rank,
  onIncrement,
  onDecrement,
  onDelete,
}: PlayerCardProps) {
  const isLeader = rank === 1

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`flex items-center justify-between p-4 bg-white rounded-xl shadow-md ${
        isLeader ? 'ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-white' : ''
      }`}
    >
      {/* Posição e Nome */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 flex items-center justify-center rounded-full font-bold text-lg ${
            isLeader
              ? 'bg-yellow-400 text-yellow-900'
              : rank === 2
              ? 'bg-gray-300 text-gray-700'
              : rank === 3
              ? 'bg-orange-300 text-orange-800'
              : 'bg-gray-100 text-gray-500'
          }`}
        >
          {isLeader ? '👑' : `${rank}º`}
        </div>
        <span className="font-semibold text-gray-800 text-lg">{player.name}</span>
      </div>

      {/* Controles de Score */}
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onDecrement}
          className="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-full font-bold text-xl hover:bg-red-200 transition-colors active:bg-red-300"
        >
          −
        </motion.button>

        <motion.span
          key={player.score}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="w-14 text-center text-2xl font-bold text-gray-800"
        >
          {player.score}
        </motion.span>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onIncrement}
          className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-full font-bold text-xl hover:bg-green-200 transition-colors active:bg-green-300"
        >
          +
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onDelete}
          className="ml-2 w-8 h-8 flex items-center justify-center text-gray-400 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"
          title="Remover jogador"
        >
          ✕
        </motion.button>
      </div>
    </motion.div>
  )
}
