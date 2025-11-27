import { useState, useSyncExternalStore } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  historyManager,
  formatTimestamp,
  getActionEmoji,
  type HistoryEntry,
} from '../lib/history'

function useHistory(): HistoryEntry[] {
  return useSyncExternalStore(
    (callback) => historyManager.subscribe(callback),
    () => historyManager.getEntries()
  )
}

export function HistoryPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const entries = useHistory()

  return (
    <div className="mt-4">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span className="text-sm">
          {isOpen ? '▼' : '▶'} Histórico ({entries.length})
        </span>
      </button>

      {/* History list */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl shadow-md p-3 mt-2 max-h-64 overflow-y-auto">
              {entries.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-4">
                  Nenhuma ação registrada ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-sm border-b border-gray-100 pb-2 last:border-0"
                    >
                      <span className="text-lg">{getActionEmoji(entry.action)}</span>
                      <span className="flex-1">
                        <span className="font-medium text-gray-800">
                          {entry.playerName}
                        </span>{' '}
                        <span className="text-gray-500">{entry.details}</span>
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {entries.length > 0 && (
                <button
                  onClick={() => historyManager.clear()}
                  className="w-full mt-3 text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Limpar histórico
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
