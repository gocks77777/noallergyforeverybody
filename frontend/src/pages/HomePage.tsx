import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { predictImage } from '@/lib/api'
import { useLang } from '@/lib/LangContext'
import { motion } from 'framer-motion'

const ALLERGY_KEYS = [
  '계란', '우유', '밀', '대두', '땅콩', '견과류',
  '생선', '갑각류', '조개류', '쇠고기', '돼지고기', '닭고기', '토마토',
]

export default function HomePage() {
  const navigate = useNavigate()
  const { t, lang } = useLang()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [allergies, setAllergies] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('user-allergies')
      if (!raw) return new Set()
      const saved = JSON.parse(raw)
      if (!Array.isArray(saved)) return new Set()
      return new Set(saved.filter((item) => typeof item === 'string'))
    } catch {
      return new Set()
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFile(f: File | undefined) {
    if (!f) return
    setFile(f)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  function toggleAllergy(a: string) {
    setAllergies((prev) => {
      const next = new Set(prev)
      next.has(a) ? next.delete(a) : next.add(a)
      try { localStorage.setItem('user-allergies', JSON.stringify([...next])) } catch {}
      return next
    })
  }

  async function handleAnalyze() {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const result = await predictImage(file, [...allergies].join(','), lang)
      navigate('/result', { state: { result, preview } })
    } catch (e: any) {
      setError(e.message || t('translate.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-shell">
      <section className="card p-4 space-y-3">
        <h2 className="section-title">{t('home.upload')}</h2>
        <p className="text-sm text-slate-500">{t('home.supported')}</p>
      </section>

      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative border-2 border-dashed border-slate-300 rounded-3xl overflow-hidden bg-white flex items-center justify-center aspect-[4/3] cursor-pointer hover:border-primary-400 transition-all duration-300 shadow-soft group"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <motion.img
            src={preview}
            alt="food"
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="text-center text-slate-400 space-y-3 p-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-500 transition-colors duration-300">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
            </div>
            <p className="text-base font-medium text-slate-600">{t('home.upload')}</p>
            <p className="text-sm text-slate-400">{t('home.supported')}</p>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </motion.section>

      <motion.section
        className="card p-4 space-y-3"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="section-title">{t('home.allergies')}</h2>
          {allergies.size > 0 && (
            <span className="text-xs text-primary-700 bg-primary-50 border border-primary-200 px-2 py-1 rounded-lg">
              {allergies.size}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {ALLERGY_KEYS.map((a) => (
            <button
              key={a}
              onClick={() => toggleAllergy(a)}
              className={`btn-press px-4 py-2.5 rounded-full text-base font-medium transition-all duration-200 ${
                allergies.has(a)
                  ? 'bg-danger-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300 hover:text-primary-700'
              }`}
            >
              {t(`allergen.${a}`)}
            </button>
          ))}
        </div>
      </motion.section>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base text-danger-700 bg-danger-50 rounded-2xl px-4 py-3 border border-danger-200"
        >
          {error}
        </motion.p>
      )}

      <motion.button
        onClick={handleAnalyze}
        disabled={!file || loading}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className={`btn-press w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 ${
          file && !loading
            ? 'bg-primary-600 text-white shadow-elevated hover:bg-primary-700'
            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
        }`}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-6 h-6" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('home.analyzing')}
          </>
        ) : (
          t('home.analyze')
        )}
      </motion.button>
    </div>
  )
}
