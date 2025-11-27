import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useScoreboard } from './hooks'
import { PlayerCard, AddPlayerForm, ScoreControl } from './components'

function App() {
  const {
    players,
    loading,
    error,
    addNewPlayer,
    incrementScore,
    decrementScore,
    deletePlayer,
    resetScores,
    clearBoard,
  } = useScoreboard()

  const [scoreAmount, setScoreAmount] = useState(1)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleAddPlayer = async (name: string) => {
    await addNewPlayer({ name })
  }

  const handleResetScores = async () => {
    await resetScores()
    setShowResetConfirm(false)
  }

  const handleClearBoard = async () => {
    await clearBoard()
    setShowClearConfirm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-xl text-gray-600">Carregando...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
        <div className="text-center p-6">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-xl text-red-600">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-8">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 pt-4"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-1">
            🎯 BoardScore
          </h1>
          <p className="text-gray-500 text-sm">Placar em tempo real</p>
        </motion.header>

        {/* Formulário de adicionar jogador */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <AddPlayerForm onAdd={handleAddPlayer} />
        </motion.div>

        {/* Controle de quantidade de pontos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <ScoreControl value={scoreAmount} onChange={setScoreAmount} />
        </motion.div>

        {/* Lista de jogadores */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {players.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-400 py-12"
              >
                Adicione jogadores para começar! 🎮
              </motion.p>
            ) : (
              players.map((player, index) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  rank={index + 1}
                  onIncrement={() => incrementScore(player.id, scoreAmount)}
                  onDecrement={() => decrementScore(player.id, scoreAmount)}
                  onDelete={() => deletePlayer(player.id)}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Botões de reset */}
        {players.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 space-y-3"
          >
            {/* Botões principais */}
            {!showResetConfirm && !showClearConfirm && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex-1 py-3 bg-white text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
                >
                  🔄 Zerar Placar
                </button>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex-1 py-3 bg-white text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-colors border border-red-200"
                >
                  🗑️ Resetar Board
                </button>
              </div>
            )}

            {/* Confirmação para Zerar Placar */}
            {showResetConfirm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-center text-gray-600 text-sm mb-2">
                  Zerar pontuação de todos os jogadores?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 bg-white text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleResetScores}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors"
                  >
                    Confirmar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Confirmação para Resetar Board */}
            {showClearConfirm && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <p className="text-center text-red-600 text-sm mb-2">
                  ⚠️ Remover TODOS os jogadores?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-3 bg-white text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors border border-gray-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleClearBoard}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-colors"
                  >
                    Remover Todos
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          {players.length} jogador{players.length !== 1 ? 'es' : ''}
        </p>
      </div>
    </div>
  )
}

export default App
