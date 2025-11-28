import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserPlus } from 'lucide-react'

interface AddPlayerFormProps {
  onAdd: (name: string) => Promise<void>
}

export function AddPlayerForm({ onAdd }: AddPlayerFormProps) {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || isLoading) return

    setIsLoading(true)
    try {
      await onAdd(name)
      setName('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do convidado"
        disabled={isLoading}
        autoComplete="off"
        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none transition-all text-slate-700 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:bg-slate-50 dark:disabled:bg-slate-800"
      />
      <motion.button
        type="submit"
        disabled={!name.trim() || isLoading}
        whileTap={{ scale: 0.95 }}
        className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <UserPlus size={18} />
        {isLoading ? '...' : 'Adicionar'}
      </motion.button>
    </form>
  )
}
