import { useLocation, useNavigate } from 'react-router-dom'
import type { PredictResult } from '@/lib/api'
import { useLang } from '@/lib/LangContext'

export default function ResultPage() {
  const navigate = useNavigate()
  const { t } = useLang()
  const { state } = useLocation() as { state?: { result: PredictResult; preview: string } }

  if (!state?.result) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-gray-500">{t('result.no_result')}</p>
        <button onClick={() => navigate('/')} className="text-primary-600 font-medium">
          {t('result.go_back')}
        </button>
      </div>
    )
  }

  const { result, preview } = state
  const hasDanger = result.allergens.length > 0

  return (
    <div className="p-4 space-y-4">
      {/* Food Image + Name */}
      <div className="relative rounded-2xl overflow-hidden bg-white shadow">
        {preview && <img src={preview} alt={result.food_name} className="w-full aspect-video object-cover" />}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h2 className="text-xl font-bold text-white">{result.food_name}</h2>
          <p className="text-sm text-white/80">
            {result.top3[0]?.score && `${t('result.confidence')}: ${(result.top3[0].score * 100).toFixed(1)}%`}
          </p>
        </div>
      </div>

      {/* Allergy Alert */}
      {hasDanger ? (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <svg className="w-6 h-6 text-danger-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-danger-700 font-bold">{t('result.warning')}</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.allergens.map((a) => (
              <span key={a} className="px-2.5 py-1 bg-danger-500 text-white text-sm rounded-full font-medium">
                {a}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 flex items-center gap-2">
          <svg className="w-6 h-6 text-primary-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-primary-700 font-medium">{t('result.safe')}</p>
        </div>
      )}

      {/* Ingredients */}
      <section className="bg-white rounded-xl shadow p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">{t('result.ingredients')}</h3>
        <div className="flex flex-wrap gap-1.5">
          {result.ingredients.map((ing) => (
            <span key={ing} className={`px-2 py-0.5 text-sm rounded-md ${
              result.allergens.some((a) => ing.includes(a)) ? 'bg-danger-100 text-danger-700' : 'bg-gray-100 text-gray-600'
            }`}>
              {ing}
            </span>
          ))}
        </div>
      </section>

      {/* Top 3 */}
      <section className="bg-white rounded-xl shadow p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">{t('result.top3')}</h3>
        {result.top3.map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-gray-400 w-4">{i + 1}</span>
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span className={i === 0 ? 'font-semibold text-primary-700' : 'text-gray-600'}>{item.label}</span>
                <span className="text-gray-400">{(item.score * 100).toFixed(1)}%</span>
              </div>
              <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${i === 0 ? 'bg-primary-500' : 'bg-gray-300'}`} style={{ width: `${item.score * 100}%` }} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Claude Analysis */}
      {result.claude_analysis && (
        <section className="bg-white rounded-xl shadow p-4 space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">{t('result.ai_analysis')}</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{result.claude_analysis}</p>
        </section>
      )}

      <button
        onClick={() => navigate('/')}
        className="w-full py-3 rounded-xl font-semibold text-primary-600 border-2 border-primary-600 hover:bg-primary-50 transition-colors"
      >
        {t('result.scan_another')}
      </button>
    </div>
  )
}
