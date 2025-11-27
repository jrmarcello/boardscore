import { motion } from 'framer-motion'

export function PlayerCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-between p-4 bg-white rounded-xl shadow-md"
    >
      {/* Posição e Nome */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="w-24 h-5 rounded bg-gray-200 animate-pulse" />
      </div>

      {/* Controles de Score */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="w-14 h-8 rounded bg-gray-200 animate-pulse" />
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="ml-2 w-8 h-8 rounded-full bg-gray-100 animate-pulse" />
      </div>
    </motion.div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  )
}
