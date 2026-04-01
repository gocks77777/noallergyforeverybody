import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useLang } from '@/lib/LangContext'
import { LANGUAGES } from '@/lib/i18n'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function Layout() {
  const { t, lang, setLang } = useLang()
  const [showLangModal, setShowLangModal] = useState(false)
  const currentFlag = LANGUAGES.find((l) => l.code === lang)?.flag ?? ''
  const location = useLocation()

  const nav = [
    { to: '/', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', label: t('nav.scan') },
    { to: '/barcode', icon: 'M2 4h2v16H2zm4 0h1v16H6zm3 0h2v16H9zm4 0h1v16h-1zm3 0h2v16h-2zm4 0h1v16h-1z', label: t('nav.barcode') },
    { to: '/translate', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129', label: t('nav.translate') },
    { to: '/map', icon: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: t('nav.map') },
  ]

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto bg-gray-50">
      {/* Header — glass morphism */}
      <header className="sticky top-0 z-40 glass border-b border-white/20 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">{t('app.title')}</h1>
          <p className="text-xs text-gray-400 -mt-0.5 truncate">{t('app.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowLangModal(true)}
          className="text-xl w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
          title={t('settings.language')}
        >
          {currentFlag}
        </button>
      </header>

      {/* Content with page transition */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Nav — floating pill style */}
      <nav className="sticky bottom-0 z-40 px-3 pb-2 pt-1">
        <div className="glass rounded-2xl flex justify-around py-2 shadow-elevated">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-xs font-medium px-3 py-1 rounded-xl transition-all truncate ${
                  isActive
                    ? 'text-primary-600 bg-primary-50/80'
                    : 'text-gray-400 active:scale-95'
                }`
              }
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d={n.icon} />
              </svg>
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Language Modal — bottom sheet with animation */}
      <AnimatePresence>
        {showLangModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLangModal(false)}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
              <h3 className="font-bold text-gray-800 text-center text-base">{t('settings.language')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLangModal(false) }}
                    className={`btn-press flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all ${
                      lang === l.code
                        ? 'bg-primary-50 text-primary-700 ring-2 ring-primary-500 shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-2xl">{l.flag}</span>
                    <span className="text-base font-medium">{l.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
