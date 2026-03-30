import { Outlet, NavLink } from 'react-router-dom'
import { useLang } from '@/lib/LangContext'
import { LANGUAGES } from '@/lib/i18n'
import { useState } from 'react'

export default function Layout() {
  const { t, lang, setLang } = useLang()
  const [showLangModal, setShowLangModal] = useState(false)
  const currentFlag = LANGUAGES.find((l) => l.code === lang)?.flag ?? ''

  const nav = [
    { to: '/', icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z', label: t('nav.scan') },
    { to: '/barcode', icon: 'M2 4h2v16H2zm4 0h1v16H6zm3 0h2v16H9zm4 0h1v16h-1zm3 0h2v16h-2zm4 0h1v16h-1z', label: t('nav.barcode') },
    { to: '/translate', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129', label: t('nav.translate') },
    { to: '/map', icon: 'M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: t('nav.map') },
  ]

  return (
    <div className="flex flex-col min-h-screen max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-primary-600 text-white px-4 py-3 flex items-center gap-2 shadow-md">
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <h1 className="text-lg font-bold tracking-tight flex-1">{t('app.title')}</h1>
        <button
          onClick={() => setShowLangModal(true)}
          className="text-xl px-2 py-1 rounded-lg hover:bg-white/20 transition-colors"
          title={t('settings.language')}
        >
          {currentFlag}
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-gray-200 flex justify-around py-2 safe-bottom">
        {nav.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-xs transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400'
              }`
            }
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={n.icon} />
            </svg>
            {n.label}
          </NavLink>
        ))}
      </nav>

      {/* Language Modal */}
      {showLangModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center" onClick={() => setShowLangModal(false)}>
          <div className="bg-white w-full max-w-lg rounded-t-2xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-gray-800 text-center">{t('settings.language')}</h3>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setShowLangModal(false) }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    lang === l.code
                      ? 'bg-primary-50 text-primary-700 border-2 border-primary-500'
                      : 'bg-gray-50 text-gray-700 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{l.flag}</span>
                  <span className="text-sm font-medium">{l.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
