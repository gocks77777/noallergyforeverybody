import { useState } from 'react'
import { LANGUAGES, type LangCode } from '@/lib/i18n'
import { useLang } from '@/lib/LangContext'

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
    <div className="min-h-screen bg-gradient-to-b from-primary-600 to-primary-800 flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-10 h-10 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">Allergy Scan</h1>
        <p className="text-primary-100 mt-1 text-sm">AI Food Allergy Safety Guide</p>
      </div>

      {/* Language Grid */}
      <div className="w-full max-w-sm">
        <p className="text-primary-100 text-center text-sm mb-4">Select your language</p>
        <div className="grid grid-cols-2 gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setSelected(l.code)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                selected === l.code
                  ? 'bg-white text-primary-700 shadow-lg scale-[1.02]'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <span className="text-2xl">{l.flag}</span>
              <span className="text-sm font-medium">{l.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <button
        onClick={handleStart}
        disabled={!selected}
        className="mt-8 w-full max-w-sm py-3.5 rounded-xl font-bold text-primary-700 bg-white hover:bg-primary-50 disabled:bg-white/30 disabled:text-white/50 disabled:cursor-not-allowed transition-all shadow-lg"
      >
        {selected
          ? LANGUAGES.find((l) => l.code === selected)
            ? `Start`
            : 'Get Started'
          : 'Select a language'}
      </button>
    </div>
  )
}
