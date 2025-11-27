import { useState } from 'react'
import { motion } from 'framer-motion'

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
        placeholder="Adicionar convidado"
        disabled={isLoading}
        autoComplete="off"
        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors text-lg disabled:bg-gray-100"
      />
      <motion.button
        type="submit"
        disabled={!name.trim() || isLoading}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold text-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {isLoading ? '...' : '+'}
      </motion.button>
    </form>
  )
}
