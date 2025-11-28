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
    () => historyManager.getSnapshot()
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
        className="w-full flex items-center justify-center gap-2 py-2 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-3 mt-2 max-h-64 overflow-y-auto">
              {entries.length === 0 ? (
                <p className="text-center text-slate-400 dark:text-slate-500 text-sm py-4">
                  Nenhuma ação registrada ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-sm border-b border-slate-100 dark:border-slate-700 pb-2 last:border-0"
                    >
                      <span className="text-lg">{getActionEmoji(entry.action)}</span>
                      <span className="flex-1">
                        <span className="font-medium text-slate-800 dark:text-white">
                          {entry.playerName}
                        </span>{' '}
                        <span className="text-slate-500 dark:text-slate-400">{entry.details}</span>
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}

              {entries.length > 0 && (
                <button
                  onClick={() => historyManager.clear()}
                  className="w-full mt-3 text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 transition-colors"
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
