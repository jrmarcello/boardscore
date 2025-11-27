import { useState } from 'react'
import { useScoreboard } from './hooks'

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
  } = useScoreboard()

  const [newPlayerName, setNewPlayerName] = useState('')
  const [scoreAmount, setScoreAmount] = useState(1)

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPlayerName.trim()) return

    try {
      await addNewPlayer({ name: newPlayerName })
      setNewPlayerName('')
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Carregando...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          🎯 BoardScore
        </h1>

        {/* Formulário de adicionar jogador */}
        <form onSubmit={handleAddPlayer} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            placeholder="Nome do jogador"
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Adicionar
          </button>
        </form>

        {/* Controle de quantidade de pontos */}
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="text-gray-600">Pontos por clique:</span>
          <input
            type="number"
            min="1"
            value={scoreAmount}
            onChange={(e) => setScoreAmount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 px-2 py-1 text-center rounded border border-gray-300"
          />
        </div>

        {/* Lista de jogadores */}
        <div className="space-y-3">
          {players.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhum jogador ainda. Adicione alguém!
            </p>
          ) : (
            players.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 bg-white rounded-lg shadow ${
                  index === 0 ? 'ring-2 ring-yellow-400' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-400 w-8">
                    {index + 1}º
                  </span>
                  <span className="font-semibold text-gray-800">
                    {player.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => decrementScore(player.id, scoreAmount)}
                    className="w-8 h-8 flex items-center justify-center bg-red-100 text-red-600 rounded-full font-bold hover:bg-red-200 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-xl font-bold text-gray-800">
                    {player.score}
                  </span>
                  <button
                    onClick={() => incrementScore(player.id, scoreAmount)}
                    className="w-8 h-8 flex items-center justify-center bg-green-100 text-green-600 rounded-full font-bold hover:bg-green-200 transition-colors"
                  >
                    +
                  </button>
                  <button
                    onClick={() => deletePlayer(player.id)}
                    className="ml-2 w-8 h-8 flex items-center justify-center bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"
                    title="Remover jogador"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Botão de resetar */}
        {players.length > 0 && (
          <button
            onClick={resetScores}
            className="mt-6 w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Zerar Placar
          </button>
        )}
      </div>
    </div>
  )
}

export default App
