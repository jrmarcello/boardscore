import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const PIX_KEY = import.meta.env.VITE_PIX_KEY || 'cb226110-6109-4854-a6d4-4143768dc309'
const PIX_QRCODE = import.meta.env.VITE_PIX_QRCODE || '00020126580014BR.GOV.BCB.PIX0136cb226110-6109-4854-a6d4-4143768dc3095204000053039865802BR5925MARCELO FREITAS ARAUJO JU6011JOAO PESSOA622605226S2MqIZHRBYVW23w7cFQJA63042D77'
const PIX_NAME = import.meta.env.VITE_PIX_NAME || 'Marcelo'
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO || 'jrmarcello/boardscore'

// Gera URL do QR Code via API pública
function getQRCodeUrl(data: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`
}

export function Footer() {
  const [showDonateModal, setShowDonateModal] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
    }
  }

  const handleReportBug = () => {
    window.open(`https://github.com/${GITHUB_REPO}/issues/new`, '_blank')
  }

  return (
    <>
      {/* Footer */}
      <footer className="mt-8 pb-4">
        <div className="flex items-center justify-center gap-4 text-sm">
          <button
            onClick={handleReportBug}
            className="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span>🐛</span>
            <span>Reportar bug</span>
          </button>
          
          <span className="text-gray-300">·</span>
          
          <button
            onClick={() => setShowDonateModal(true)}
            className="flex items-center gap-1.5 text-gray-400 hover:text-amber-600 transition-colors"
          >
            <span>☕</span>
            <span>Me paga um café</span>
          </button>
        </div>
      </footer>

      {/* Donate Modal */}
      <AnimatePresence>
        {showDonateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowDonateModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-4">
                <motion.div
                  initial={{ rotate: -10 }}
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-5xl mb-3"
                >
                  ☕
                </motion.div>
                <h2 className="text-xl font-bold text-gray-800">
                  Curtiu o BoardScore?
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Me ajuda a manter o projeto vivo! 🚀
                </p>
              </div>

              {/* Fun message */}
              <div className="bg-amber-50 rounded-xl p-4 mb-4 text-center">
                <p className="text-amber-800 text-sm">
                  🎮 Cada café me dá <strong>+10 de energia</strong> pra criar novas features!
                </p>
                <p className="text-amber-600 text-xs mt-1">
                  (e evita que eu durma no teclado)
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl shadow-inner border-2 border-gray-100">
                  <img
                    src={getQRCodeUrl(PIX_QRCODE)}
                    alt="QR Code PIX"
                    className="w-40 h-40"
                  />
                </div>
              </div>

              {/* PIX Key */}
              <div className="mb-4">
                <p className="text-xs text-gray-400 text-center mb-2">
                  Ou copie a chave PIX:
                </p>
                <button
                  onClick={handleCopyPix}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <span className="font-mono text-xs text-gray-600 truncate">
                    {PIX_KEY}
                  </span>
                  <span className="text-lg flex-shrink-0">
                    {copied ? '✅' : '📋'}
                  </span>
                </button>
                {copied && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-green-600 text-xs text-center mt-2"
                  >
                    Chave copiada! Valeu! 💚
                  </motion.p>
                )}
              </div>

              {/* Recipient info */}
              <p className="text-xs text-gray-400 text-center mb-4">
                Para: <strong>{PIX_NAME}</strong>
              </p>

              {/* Close button */}
              <button
                onClick={() => setShowDonateModal(false)}
                className="w-full py-3 text-gray-500 hover:text-gray-700 transition-colors text-sm"
              >
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
