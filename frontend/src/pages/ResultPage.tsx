import { useLocation, useNavigate } from 'react-router-dom'
import type { PredictResult } from '@/lib/api'
import { useLang } from '@/lib/LangContext'
import { motion } from 'framer-motion'

export default function ResultPage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { state } = useLocation() as { state?: { result: PredictResult; preview: string } }

  if (!state?.result) {
    return (
      <div className="p-6 text-center space-y-4 pt-20">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-gray-400 text-base">{t('result.no_result')}</p>
        <button onClick={() => navigate('/')} className="text-primary-600 font-semibold btn-press">
          {t('result.go_back')}
        </button>
      </div>
    )
  }

  const { result, preview } = state
  const hasDanger = result.allergens.length > 0

  return (
    <div className="p-4 space-y-4 pb-6">
      {/* Food Image + Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl overflow-hidden bg-white shadow-card"
      >
        {preview && <img src={preview} alt={result.food_name} className="w-full aspect-video object-cover" />}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 pt-16">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">{result.food_name}</h2>
          <p className="text-base text-white/70 mt-0.5">
            {result.top3[0]?.score && `${t('result.confidence')}: ${(result.top3[0].score * 100).toFixed(1)}%`}
          </p>
        </div>
      </motion.div>

      {/* Allergy Alert */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        {hasDanger ? (
          <div className="bg-gradient-to-r from-danger-50 to-danger-50/50 border border-danger-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-danger-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-danger-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-danger-700 font-bold text-base">{t('result.warning')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.allergens.map((a) => (
                <span key={a} className="px-3.5 py-2 bg-danger-500 text-white text-base rounded-xl font-semibold shadow-sm">
                  {a}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary-50 to-primary-50/50 border border-primary-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-primary-700 font-semibold text-base">{t('result.safe')}</p>
          </div>
        )}
      </motion.div>

      {/* Ingredients */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-card p-4 space-y-3"
      >
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t('result.ingredients')}</h3>
        <div className="flex flex-wrap gap-2">
          {result.ingredients.map((ing) => (
            <span key={ing} className={`px-3 py-1.5 text-base rounded-lg font-medium ${
              result.allergens.some((a) => ing.includes(a)) ? 'bg-danger-100 text-danger-700' : 'bg-gray-50 text-gray-600'
            }`}>
              {ing}
            </span>
          ))}
        </div>
      </motion.section>

      {/* Top 3 */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-card p-4 space-y-3"
      >
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t('result.top3')}</h3>
        {result.top3.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-md ${
              i === 0 ? 'bg-primary-100 text-primary-700' : 'bg-gray-50 text-gray-400'
            }`}>{i + 1}</span>
            <div className="flex-1">
              <div className="flex justify-between text-base">
                <span className={i === 0 ? 'font-bold text-gray-800' : 'text-gray-500'}>{item.label}</span>
                <span className="text-gray-400 text-sm">{(item.score * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-primary-500 to-primary-400' : 'bg-gray-300'}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        ))}
      </motion.section>

      {/* Claude Analysis */}
      {result.claude_analysis && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-card p-4 space-y-2"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-600 rounded-md flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t('result.ai_analysis')}</h3>
          </div>
          <p className="text-base text-gray-600 leading-relaxed whitespace-pre-line">{result.claude_analysis}</p>
        </motion.section>
      )}

      <motion.button
        onClick={() => navigate('/')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="btn-press w-full py-4 rounded-2xl font-bold text-lg text-primary-600 border-2 border-primary-200 hover:bg-primary-50 transition-all"
      >
        {t('result.scan_another')}
      </motion.button>
    </div>
  )
}
