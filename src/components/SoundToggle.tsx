import { motion } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import { soundManager } from '../lib/sounds'
import { useState, useEffect } from 'react'

export function SoundToggle() {
  const [enabled, setEnabled] = useState(soundManager.isEnabled())

  useEffect(() => {
    soundManager.setEnabled(enabled)
  }, [enabled])

  const toggle = () => {
    setEnabled(!enabled)
    // Play a test sound when enabling
    if (!enabled) {
      soundManager.playCoin()
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      className={`p-2 rounded-xl transition-colors ${
        enabled
          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
      }`}
      title={enabled ? 'Som ligado' : 'Som desligado'}
    >
      {enabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </motion.button>
  )
}
