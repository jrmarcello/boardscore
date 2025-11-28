import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bug, Trophy, Copy, Check, X, Heart } from 'lucide-react'

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
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Bug size={14} />
            <span>Reportar bug</span>
          </button>
          
          <span className="text-slate-300">·</span>
          
          <button
            onClick={() => setShowDonateModal(true)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <Trophy size={14} />
            <span>Apoie o placar</span>
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
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center"
                >
                  <Trophy size={32} className="text-white" />
                </motion.div>
                <h2 className="text-xl font-bold text-slate-800">
                  Apoie o BoardScore!
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  Ajude a manter o placar no ar
                </p>
              </div>

              {/* Fun message */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-4 text-center border border-indigo-100">
                <p className="text-indigo-800 text-sm">
                  Sua contribuição me dá <strong>+10 pontos</strong> de motivação!
                </p>
                <p className="text-indigo-600 text-xs mt-1 flex items-center justify-center gap-1">
                  <Heart size={12} className="text-pink-500" />
                  Cada PIX é uma vitória pro projeto
                </p>
              </div>

              {/* QR Code */}
              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                  <img
                    src={getQRCodeUrl(PIX_QRCODE)}
                    alt="QR Code PIX"
                    className="w-40 h-40"
                  />
                </div>
              </div>

              {/* PIX Key */}
              <div className="mb-4">
                <p className="text-xs text-slate-400 text-center mb-2">
                  Ou copie a chave PIX:
                </p>
                <button
                  onClick={handleCopyPix}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
                >
                  <span className="font-mono text-xs text-slate-600 truncate">
                    {PIX_KEY}
                  </span>
                  <span className="flex-shrink-0 text-slate-500">
                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                  </span>
                </button>
                {copied && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-emerald-600 text-xs text-center mt-2"
                  >
                    Chave copiada! Valeu demais!
                  </motion.p>
                )}
              </div>

              {/* Recipient info */}
              <p className="text-xs text-slate-400 text-center mb-4">
                Para: <strong className="text-slate-600">{PIX_NAME}</strong>
              </p>

              {/* Close button */}
              <button
                onClick={() => setShowDonateModal(false)}
                className="w-full py-3 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors text-sm flex items-center justify-center gap-1"
              >
                <X size={16} />
                Fechar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
