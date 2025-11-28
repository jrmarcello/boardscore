import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, X } from 'lucide-react'

interface NicknameModalProps {
  isOpen: boolean
  currentNickname?: string
  onSave: (nickname: string) => Promise<void>
  onClose?: () => void
  isRequired?: boolean
}

export function NicknameModal({
  isOpen,
  currentNickname = '',
  onSave,
  onClose,
  isRequired = false,
}: NicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = nickname.trim()

    if (!trimmed) {
      setError('Digite um apelido')
      return
    }

    if (trimmed.length < 2) {
      setError('Apelido deve ter pelo menos 2 caracteres')
      return
    }

    if (trimmed.length > 20) {
      setError('Apelido deve ter no máximo 20 caracteres')
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave(trimmed)
    } catch (err) {
      setError('Erro ao salvar. Tente novamente.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={!isRequired ? onClose : undefined}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                  <User size={20} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                  {isRequired ? 'Escolha seu apelido' : 'Editar apelido'}
                </h2>
              </div>
              {!isRequired && onClose && (
                <button
                  onClick={onClose}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {isRequired
                ? 'Seu apelido será exibido no ranking das partidas.'
                : 'Este nome será exibido no ranking.'}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: João, Player1, Campeão..."
                autoComplete="off"
                autoFocus
                maxLength={20}
                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white mb-2"
              />

              <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {nickname.length}/20 caracteres
                </span>
                {error && (
                  <span className="text-xs text-red-500">{error}</span>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={saving || !nickname.trim()}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
