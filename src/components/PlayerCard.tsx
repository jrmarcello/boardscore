import { motion } from 'framer-motion'
import { Minus, Plus, Trash2, Crown, Medal } from 'lucide-react'
import type { Player } from '../types'
import { Avatar } from './Avatar'

interface PlayerCardProps {
  player: Player
  rank: number
  onIncrement: () => void
  onDecrement: () => void
  onDelete: () => void
  disabled?: boolean
  canDelete?: boolean
}

// Rank badge component
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 shadow-sm">
        <Crown size={16} className="text-white" />
      </div>
    )
  }
  
  if (rank === 2) {
    return (
      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 shadow-sm">
        <Medal size={16} className="text-white" />
      </div>
    )
  }
  
  if (rank === 3) {
    return (
      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-sm">
        <Medal size={16} className="text-white" />
      </div>
    )
  }
  
  return (
    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold text-sm">
      {rank}º
    </div>
  )
}

export function PlayerCard({
  player,
  rank,
  onIncrement,
  onDecrement,
  onDelete,
  disabled = false,
  canDelete = true,
}: PlayerCardProps) {
  const isLeader = rank === 1

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 ${
        isLeader ? 'ring-2 ring-amber-400/50 bg-gradient-to-r from-amber-50/50 to-white dark:from-amber-900/20 dark:to-slate-800' : ''
      }`}
    >
      {/* Posição, Foto e Nome */}
      <div className="flex items-center gap-3">
        <RankBadge rank={rank} />
        <Avatar src={player.photoURL} name={player.name} size="md" />
        <span className="font-semibold text-slate-800 dark:text-white">{player.name}</span>
      </div>

      {/* Controles de Score */}
      <div className="flex items-center gap-2">
        {!disabled && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDecrement}
            className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors active:bg-red-200 dark:active:bg-red-900/70"
          >
            <Minus size={18} strokeWidth={2.5} />
          </motion.button>
        )}

        <motion.span
          key={player.score}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className="w-12 text-center text-xl font-bold text-slate-800 dark:text-white tabular-nums"
        >
          {player.score}
        </motion.span>

        {!disabled && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onIncrement}
            className="w-9 h-9 flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors active:bg-emerald-200 dark:active:bg-emerald-900/70"
          >
            <Plus size={18} strokeWidth={2.5} />
          </motion.button>
        )}

        {!disabled && canDelete && (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onDelete}
            className="ml-1 w-8 h-8 flex items-center justify-center text-slate-300 dark:text-slate-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
            title="Remover jogador"
          >
            <Trash2 size={16} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
