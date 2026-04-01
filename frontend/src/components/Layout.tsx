import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useLang } from '@/lib/LangContext'
import { LANGUAGES } from '@/lib/i18n'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

type UiStyle = 'clean' | 'vivid' | 'neo'

export default function Layout() {
  const { t, lang, setLang } = useLang()
  const [showLangModal, setShowLangModal] = useState(false)
  const [showStyleModal, setShowStyleModal] = useState(false)
  const [uiStyle, setUiStyle] = useState<UiStyle>('clean')
  const currentFlag = LANGUAGES.find((l) => l.code === lang)?.flag ?? ''
  const location = useLocation()

  const nav = [
    { to: '/', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', label: t('nav.scan') },
    { to: '/barcode', icon: 'M2 4h2v16H2zm4 0h1v16H6zm3 0h2v16H9zm4 0h1v16h-1zm3 0h2v16h-2zm4 0h1v16h-1z', label: t('nav.barcode') },
    { to: '/translate', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129', label: t('nav.translate') },
    { to: '/map', icon: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: t('nav.map') },
  ]

  useEffect(() => {
    const saved = localStorage.getItem('ui-style') as UiStyle | null
    const initial: UiStyle = saved === 'vivid' || saved === 'neo' ? saved : 'clean'
    setUiStyle(initial)
  }, [])

  useEffect(() => {
    document.body.setAttribute('data-ui-style', uiStyle)
    localStorage.setItem('ui-style', uiStyle)
  }, [uiStyle])

  const styles: { key: UiStyle; name: string; desc: string }[] = [
    { key: 'clean', name: 'Clean', desc: 'Safe and minimal' },
    { key: 'vivid', name: 'Vivid', desc: 'Bold and expressive' },
    { key: 'neo', name: 'Neo Dark', desc: 'Dark and focused' },
  ]

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto" style={{ background: 'var(--app-bg)' }}>
      <header className="app-header sticky top-0 z-40 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-glow shrink-0">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{t('app.title')}</h1>
          <p className="text-xs text-slate-500 -mt-0.5 truncate">{t('app.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowStyleModal(true)}
          className="header-icon-btn w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 active:scale-95 transition-all shrink-0"
          title="Change style"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 100 18h1.25a2.25 2.25 0 002.25-2.25c0-.89-.35-1.73-.98-2.36a3.36 3.36 0 01-.99-2.39A3.5 3.5 0 0117 10.5h.5A3.5 3.5 0 0021 7v-.5A3.5 3.5 0 0017.5 3H12z" />
            <circle cx="7.5" cy="9" r="1" fill="currentColor" stroke="none" />
            <circle cx="10.5" cy="7" r="1" fill="currentColor" stroke="none" />
            <circle cx="13.5" cy="8" r="1" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="13" r="1" fill="currentColor" stroke="none" />
          </svg>
        </button>
        <button
          onClick={() => setShowLangModal(true)}
          className="header-icon-btn text-xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 active:scale-95 transition-all shrink-0"
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

      <nav className="sticky bottom-0 z-40 px-3 pb-3 pt-2 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <div className="app-nav-shell rounded-2xl flex justify-around py-1.5 shadow-elevated">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all truncate ${
                  isActive
                    ? 'app-nav-item-active'
                    : 'app-nav-item active:scale-95'
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
        {showStyleModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowStyleModal(false)}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4 border-t border-slate-200"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <h3 className="font-bold text-slate-800 text-center text-base">Choose UI Style</h3>
              <div className="space-y-2">
                {styles.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => { setUiStyle(s.key); setShowStyleModal(false) }}
                    className={`btn-press w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl text-left transition-all ${
                      uiStyle === s.key
                        ? 'bg-primary-50 text-primary-700 ring-2 ring-primary-500'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-sm opacity-70">{s.desc}</p>
                    </div>
                    {uiStyle === s.key && (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
        {showLangModal && (
          <motion.div
            className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLangModal(false)}
          >
            <motion.div
              className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4 border-t border-slate-200"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto" />
              <h3 className="font-bold text-slate-800 text-center text-base">{t('settings.language')}</h3>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLangModal(false) }}
                    className={`btn-press flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all ${
                      lang === l.code
                        ? 'bg-primary-50 text-primary-700 ring-2 ring-primary-500 shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
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
