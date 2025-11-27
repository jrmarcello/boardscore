import { motion } from 'framer-motion'
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
      className={`p-2 rounded-full transition-colors ${
        enabled
          ? 'bg-indigo-100 text-indigo-600'
          : 'bg-gray-100 text-gray-400'
      }`}
      title={enabled ? 'Som ligado' : 'Som desligado'}
    >
      {enabled ? '🔊' : '🔇'}
    </motion.button>
  )
}
