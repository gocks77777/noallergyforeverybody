import { useState } from 'react'
import { getBarcode, type BarcodeResult } from '@/lib/api'

export default function BarcodePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BarcodeResult | null>(null)

  async function handleSearch() {
    const trimmed = code.trim()
    if (!trimmed) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const data = await getBarcode(trimmed)
      setResult(data)
    } catch (e: any) {
      setError(e.message || 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-5">
      {/* Search */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-800">Barcode Lookup</h2>
        <p className="text-sm text-gray-500">
          Enter a barcode number to check allergens via Open Food Facts.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 8801234567890"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !code.trim()}
            className="px-5 py-3 bg-primary-600 text-white rounded-xl font-medium disabled:bg-gray-300 transition-colors"
          >
            {loading ? '...' : 'Search'}
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-danger-600 bg-danger-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Result */}
      {result && (
        <section className="bg-white rounded-xl shadow p-4 space-y-4">
          <h3 className="font-bold text-gray-800">{result.product_name || 'Unknown Product'}</h3>
          <p className="text-xs text-gray-400">Barcode: {result.barcode}</p>

          {result.allergens.length > 0 ? (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold text-danger-700">Allergens Found:</p>
              <div className="flex flex-wrap gap-1.5">
                {result.allergens.map((a) => (
                  <span key={a} className="px-2.5 py-1 bg-danger-500 text-white text-sm rounded-full">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-sm text-primary-700 font-medium">No allergens listed</p>
            </div>
          )}

          {result.ingredients_text && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700">Ingredients</p>
              <p className="text-sm text-gray-500 leading-relaxed">{result.ingredients_text}</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
