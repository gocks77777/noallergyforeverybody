import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { predictImage } from '@/lib/api'
import { useLang } from '@/lib/LangContext'

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
  const [allergies, setAllergies] = useState<Set<string>>(new Set())
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
    <div className="p-4 space-y-5">
      {/* Image Upload Area */}
      <section
        className="relative border-2 border-dashed border-gray-300 rounded-2xl overflow-hidden bg-white flex items-center justify-center aspect-[4/3] cursor-pointer hover:border-primary-400 transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        {preview ? (
          <img src={preview} alt="food" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-gray-400 space-y-2 p-6">
            <svg className="w-14 h-14 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
            <p className="text-sm font-medium">{t('home.upload')}</p>
            <p className="text-xs">{t('home.supported')}</p>
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
      </section>

      {/* Allergy Selection */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-700">{t('home.allergies')}</h2>
        <div className="flex flex-wrap gap-2">
          {ALLERGY_KEYS.map((a) => (
            <button
              key={a}
              onClick={() => toggleAllergy(a)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                allergies.has(a)
                  ? 'bg-danger-500 text-white border-danger-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-400'
              }`}
            >
              {t(`allergen.${a}`)}
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p className="text-sm text-danger-600 bg-danger-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="w-full py-3.5 rounded-xl font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {t('home.analyzing')}
          </>
        ) : (
          t('home.analyze')
        )}
      </button>
    </div>
  )
}
