import { useState, useRef, useEffect, useCallback } from 'react'
import { getBarcode, type BarcodeResult } from '@/lib/api'
import { useLang } from '@/lib/LangContext'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodePage() {
  const { t } = useLang()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<BarcodeResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanPhase, setScanPhase] = useState<'searching' | 'found' | ''>('')
  const [foundCode, setFoundCode] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<{ stop: () => void } | null>(null)
  const searchingRef = useRef(false)

  const doSearch = useCallback(async (barcode: string) => {
    if (searchingRef.current) return
    const trimmed = barcode.trim()
    if (!trimmed) return
    searchingRef.current = true
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
      searchingRef.current = false
    }
  }, [])

  function stopScan() {
    setScanning(false)
    setScanPhase('')
    setFoundCode('')
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }
  }

  function startScan() {
    setScanning(true)
    setScanPhase('searching')
    setFoundCode('')
    setError('')
    setResult(null)
  }

  useEffect(() => {
    if (!scanning || !videoRef.current) return

    const reader = new BrowserMultiFormatReader()

    reader.decodeFromVideoDevice(undefined, videoRef.current, (res) => {
      if (res && scanPhase === 'searching') {
        const text = res.getText()
        setFoundCode(text)
        setCode(text)
        setScanPhase('found')

        // 1.5초 동안 성공 화면 보여준 후 카메라 종료 + 검색
        setTimeout(() => {
          stopScan()
          doSearch(text)
        }, 1500)
      }
    }).then((controls) => {
      controlsRef.current = controls
    }).catch(() => {
      setError(t('scan.camera_denied'))
      setScanning(false)
      setScanPhase('')
    })

    return () => { stopScan() }
  }, [scanning])

  return (
    <div className="p-4 space-y-5">
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-gray-800">{t('barcode.title')}</h2>
        <p className="text-sm text-gray-500">{t('barcode.desc')}</p>

        {/* Camera Scanner */}
        {scanning ? (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]">
            <video ref={videoRef} className="w-full h-full object-cover" />

            {scanPhase === 'searching' ? (
              /* Searching overlay */
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-64 h-40 border-2 border-white/70 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 right-0 h-0.5 bg-primary-400 animate-[scan_2s_ease-in-out_infinite]" />
                </div>
                <p className="mt-3 text-white text-sm bg-black/50 px-4 py-1.5 rounded-full animate-pulse">
                  {t('scan.scanning')}
                </p>
              </div>
            ) : (
              /* Found overlay */
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                <div className="w-64 h-40 border-3 border-primary-400 rounded-xl flex items-center justify-center">
                  <svg className="w-16 h-16 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="mt-3 bg-primary-500 text-white px-5 py-2 rounded-full text-center">
                  <p className="font-bold text-sm">{t('scan.success')}</p>
                  <p className="text-xs text-primary-100">{foundCode}</p>
                </div>
                <p className="mt-2 text-white/70 text-xs animate-pulse">{t('scan.loading')}</p>
              </div>
            )}

            <button
              onClick={stopScan}
              className="absolute top-3 right-3 bg-black/60 text-white px-4 py-2 rounded-xl text-sm font-medium"
            >
              {t('scan.cancel')}
            </button>
          </div>
        ) : (
          <button
            onClick={startScan}
            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl bg-white hover:border-primary-400 transition-colors flex flex-col items-center gap-2 text-gray-400"
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium">{t('scan.tap')}</span>
          </button>
        )}

        {/* Manual Input */}
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder={t('barcode.placeholder')}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && doSearch(code)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            onClick={() => doSearch(code)}
            disabled={loading || !code.trim()}
            className="px-5 py-3 bg-primary-600 text-white rounded-xl font-medium disabled:bg-gray-300 transition-colors"
          >
            {loading ? '...' : t('barcode.search')}
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-danger-600 bg-danger-50 rounded-lg px-3 py-2">{error}</p>}

      {result && (
        <section className="bg-white rounded-xl shadow p-4 space-y-4">
          <h3 className="font-bold text-gray-800">{result.product_name || 'Unknown Product'}</h3>
          <p className="text-xs text-gray-400">Barcode: {result.barcode}</p>

          {result.allergens.length > 0 ? (
            <div className="bg-danger-50 border border-danger-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-semibold text-danger-700">{t('barcode.allergens_found')}</p>
              <div className="flex flex-wrap gap-1.5">
                {result.allergens.map((a) => (
                  <span key={a} className="px-2.5 py-1 bg-danger-500 text-white text-sm rounded-full">{a}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
              <p className="text-sm text-primary-700 font-medium">{t('barcode.no_allergens')}</p>
            </div>
          )}

          {result.ingredients_text && (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-700">{t('barcode.ingredients')}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{result.ingredients_text}</p>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
