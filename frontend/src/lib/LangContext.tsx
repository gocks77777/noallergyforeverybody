import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { t as translate, type LangCode } from './i18n'

interface LangContextType {
  lang: LangCode
  setLang: (lang: LangCode) => void
  t: (key: string) => string
}

const LangContext = createContext<LangContextType>(null!)

const STORAGE_KEY = 'allergy-scan-lang'

function getSavedLang(): LangCode | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return saved as LangCode
  } catch {}
  return null
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => getSavedLang() ?? 'en')

  const setLang = useCallback((code: LangCode) => {
    setLangState(code)
    try { localStorage.setItem(STORAGE_KEY, code) } catch {}
  }, [])

  const t = useCallback((key: string) => translate(key, lang), [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}

export function hasSelectedLang(): boolean {
  return getSavedLang() !== null
}
