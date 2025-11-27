import { motion } from 'framer-motion'

interface ScoreControlProps {
  value: number
  onChange: (value: number) => void
}

export function ScoreControl({ value, onChange }: ScoreControlProps) {
  const presets = [1, 5, 10]

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      <span className="text-gray-500 text-sm">Pontos:</span>
      {presets.map((preset) => (
        <motion.button
          key={preset}
          whileTap={{ scale: 0.9 }}
          onClick={() => onChange(preset)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            value === preset
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {preset}
        </motion.button>
      ))}
      <input
        type="number"
        min="1"
        value={value}
        onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
        className="w-14 px-2 py-1 text-center rounded-lg border border-gray-200 text-sm"
      />
    </div>
  )
}
