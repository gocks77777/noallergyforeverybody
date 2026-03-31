import { useState } from 'react'
import { LANGUAGES, type LangCode } from '@/lib/i18n'
import { useLang } from '@/lib/LangContext'
import { motion } from 'framer-motion'

interface Props {
  onDone: () => void
}

export default function SplashPage({ onDone }: Props) {
  const { setLang } = useLang()
  const [selected, setSelected] = useState<LangCode | null>(null)

  function handleStart() {
    if (!selected) return
    setLang(selected)
    onDone()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-500 flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-3 h-3 bg-white/20 rounded-full" />
        <div className="absolute top-1/4 left-12 w-2 h-2 bg-white/15 rounded-full" />
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-white/10 rounded-full" />
      </div>

      {/* Logo */}
      <motion.div
        className="mb-10 text-center relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <motion.div
          className="w-24 h-24 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg border border-white/20"
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.1, type: 'spring' }}
        >
          <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </motion.div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Allergy Scan</h1>
        <p className="text-white/60 mt-2 text-sm font-medium">AI Food Allergy Safety Guide</p>
      </motion.div>

      {/* Language Grid */}
      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <p className="text-white/50 text-center text-xs font-semibold uppercase tracking-widest mb-4">Select your language</p>
        <div className="grid grid-cols-2 gap-2.5">
          {LANGUAGES.map((l, i) => (
            <motion.button
              key={l.code}
              onClick={() => setSelected(l.code)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.04 }}
              className={`btn-press flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all duration-200 ${
                selected === l.code
                  ? 'bg-white text-primary-700 shadow-elevated scale-[1.02]'
                  : 'bg-white/10 text-white/90 border border-white/10 hover:bg-white/20'
              }`}
            >
              <span className="text-2xl">{l.flag}</span>
              <span className="text-sm font-semibold">{l.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.button
        onClick={handleStart}
        disabled={!selected}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className={`btn-press mt-10 w-full max-w-sm py-4 rounded-2xl font-bold text-lg transition-all duration-300 relative z-10 ${
          selected
            ? 'bg-white text-primary-700 shadow-elevated hover:shadow-glow'
            : 'bg-white/15 text-white/40 cursor-not-allowed'
        }`}
      >
        {selected ? 'Get Started' : 'Select a language'}
      </motion.button>
    </div>
  )
}
