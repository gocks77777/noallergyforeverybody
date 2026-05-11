import { useState } from 'react'
import { LANGUAGES, type LangCode } from '@/lib/i18n'
import { useLang } from '@/lib/LangContext'
import { motion } from 'framer-motion'

interface Props {
  onDone: () => void
}

const FEATURES = [
  { icon: '📸', label: '사진 분석', desc: 'AI가 알레르겐 즉시 식별' },
  { icon: '📦', label: '바코드', desc: '가공식품 성분 조회' },
  { icon: '🗺️', label: '위험 지도', desc: '주변 식당 안전도 확인' },
]

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
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/8 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 bg-white/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <motion.div
        className="mb-7 text-center relative z-10"
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      >
        <motion.div
          className="w-24 h-24 bg-white/15 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl border border-white/25"
          initial={{ scale: 0.75, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.5, delay: 0.1, type: 'spring', stiffness: 180 }}
        >
          <svg className="w-14 h-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </motion.div>
        <h1 className="text-[2.6rem] font-extrabold text-white tracking-tight leading-none">Allergy Scan</h1>
        <p className="text-white/55 mt-2 text-[0.95rem] font-medium">AI Food Allergy Safety Guide</p>
      </motion.div>

      {/* Feature cards */}
      <motion.div
        className="w-full max-w-sm grid grid-cols-3 gap-2.5 mb-8 relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.45 }}
      >
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
            className="bg-white/12 backdrop-blur-sm border border-white/20 rounded-2xl px-3 py-3.5 flex flex-col items-center gap-1.5 text-center"
          >
            <span className="text-2xl">{f.icon}</span>
            <span className="text-white text-xs font-bold leading-tight">{f.label}</span>
            <span className="text-white/50 text-[10px] leading-tight">{f.desc}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Language Grid */}
      <motion.div
        className="w-full max-w-sm relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35 }}
      >
        <p className="text-white/45 text-center text-[11px] font-bold uppercase tracking-widest mb-3">Select your language</p>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l, i) => (
            <motion.button
              key={l.code}
              onClick={() => setSelected(l.code)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.04 }}
              className={`btn-press flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                selected === l.code
                  ? 'bg-white text-primary-700 shadow-elevated'
                  : 'bg-white/10 text-white/90 border border-white/15 hover:bg-white/18'
              }`}
            >
              <span className="text-xl">{l.flag}</span>
              <span className="text-[0.9rem] font-semibold truncate">{l.label}</span>
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
        transition={{ delay: 0.85 }}
        className={`btn-press mt-6 w-full max-w-sm py-4 rounded-2xl font-bold text-lg transition-all duration-300 relative z-10 ${
          selected
            ? 'bg-white text-primary-700 shadow-elevated hover:shadow-glow'
            : 'bg-white/15 text-white/35 cursor-not-allowed'
        }`}
      >
        {selected ? '시작하기 →' : '언어를 선택하세요'}
      </motion.button>
    </div>
  )
}
