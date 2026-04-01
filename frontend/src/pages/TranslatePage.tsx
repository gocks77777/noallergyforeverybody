import { useState, useRef } from 'react'
import { useLang } from '@/lib/LangContext'
import { speak, listen } from '@/lib/speech'
import { translate } from '@/lib/translate'

interface Message {
  id: number
  from: 'foreigner' | 'staff'
  original: string
  translated: string
  lang: string
}

// 외국인용 자주 쓰는 질문 프리셋
const PRESETS: Record<string, { key: string; ko: string }[]> = {
  default: [
    { key: 'Does this contain peanuts?', ko: '이 음식에 땅콩 들어있나요?' },
    { key: 'I have a food allergy.', ko: '저는 음식 알레르기가 있어요.' },
    { key: 'Please make it without this ingredient.', ko: '이 재료 빼고 만들어주세요.' },
    { key: 'Can I see the ingredient list?', ko: '성분표를 볼 수 있나요?' },
    { key: 'Is this gluten free?', ko: '이거 글루텐 프리인가요?' },
    { key: 'Does this have dairy?', ko: '유제품이 들어있나요?' },
  ],
}

export default function TranslatePage() {
  const { t, lang } = useLang()
  const [messages, setMessages] = useState<Message[]>([])
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [customText, setCustomText] = useState('')
  const [error, setError] = useState('')

  const nextIdRef = useRef(0)

  // 외국인 → 한국어 TTS
  async function foreignerAsk(text: string) {
    setProcessing(true)
    setError('')
    try {
      // 1. 외국인 언어 → 한국어 번역
      const korean = lang === 'ko' ? text : await translate(text, lang, 'ko')

      const msg: Message = {
        id: ++nextIdRef.current,
        from: 'foreigner',
        original: text,
        translated: korean,
        lang,
      }
      setMessages((prev) => [...prev, msg])

      // 2. 한국어 TTS 재생 (식당 직원에게 들려줌)
      setSpeaking(true)
      await speak(korean, 'ko')
      setSpeaking(false)
    } catch (e) {
      console.error(e)
      setError(t('translate.error'))
    } finally {
      setProcessing(false)
    }
  }

  // 한국인 직원 답변 → 외국인 언어로 번역
  async function staffAnswer() {
    setListening(true)
    setError('')
    try {
      // 1. 한국어 STT
      const korean = await listen('ko')

      // 2. 한국어 → 외국인 언어 번역
      const foreignText = lang === 'ko' ? korean : await translate(korean, 'ko', lang)

      const msg: Message = {
        id: ++nextIdRef.current,
        from: 'staff',
        original: korean,
        translated: foreignText,
        lang: 'ko',
      }
      setMessages((prev) => [...prev, msg])

      // 3. 외국인 언어로 TTS 재생
      setSpeaking(true)
      await speak(foreignText, lang)
      setSpeaking(false)
    } catch (e: any) {
      if (e.message !== 'aborted') {
        console.error(e)
        setError(t('translate.error'))
      }
    } finally {
      setListening(false)
    }
  }

  // 프리셋 질문 사용
  async function usePreset(preset: { key: string; ko: string }) {
    // 프리셋은 영어로 되어있으므로, 현재 언어가 영어가 아니면 번역
    let displayText = preset.key
    if (lang !== 'en') {
      displayText = await translate(preset.key, 'en', lang)
    }
    foreignerAsk(displayText)
  }

  // 커스텀 텍스트 전송
  function sendCustom() {
    if (!customText.trim()) return
    foreignerAsk(customText.trim())
    setCustomText('')
  }

  return (
    <div className="p-4 space-y-4 pb-24">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-gray-800">
          {t('translate.title')}
        </h2>
        <p className="text-sm text-gray-500">
          {t('translate.subtitle')}
        </p>
      </div>

      {error && (
        <p className="text-base text-danger-600 bg-danger-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Quick Presets */}
      <section className="space-y-2">
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('translate.quick')}</p>
        <div className="grid grid-cols-1 gap-1.5">
          {PRESETS.default.map((p) => (
            <button
              key={p.key}
              onClick={() => usePreset(p)}
              disabled={processing || speaking}
              className="text-left px-3 py-2.5 bg-white rounded-xl shadow-sm border border-gray-100 hover:border-primary-300 transition-colors disabled:opacity-50"
            >
              <p className="text-base text-gray-800">{p.key}</p>
              <p className="text-sm text-gray-400 mt-0.5">{p.ko}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Chat Messages */}
      {messages.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('translate.conversation')}</p>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-3 space-y-1 ${
                msg.from === 'foreigner'
                  ? 'bg-primary-50 border border-primary-200 ml-4'
                  : 'bg-gray-50 border border-gray-200 mr-4'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-gray-500">
                  {msg.from === 'foreigner' ? t('translate.you') : t('translate.staff')}
                </span>
                <span className="text-sm text-gray-300">
                  {msg.from === 'foreigner' ? t('translate.to_korean') : t('translate.to_lang')}
                </span>
              </div>
              <p className="text-base text-gray-800">{msg.original}</p>
              <p className={`text-base font-medium ${
                msg.from === 'foreigner' ? 'text-primary-700' : 'text-gray-700'
              }`}>
                {msg.translated}
              </p>
              {/* Replay button */}
              <button
                onClick={() => speak(
                  msg.from === 'foreigner' ? msg.translated : msg.translated,
                  msg.from === 'foreigner' ? 'ko' : lang
                )}
                className="text-sm text-gray-400 hover:text-primary-600 flex items-center gap-1 mt-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M6.5 8.8l4.7-3.5v13.4l-4.7-3.5H3.5a1 1 0 01-1-1v-4.4a1 1 0 011-1h3z" />
                </svg>
                {t('translate.replay')}
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Status */}
      {speaking && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-base text-primary-600 font-medium">{t('translate.speaking')}</span>
        </div>
      )}

      {listening && (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="w-5 h-5 bg-danger-500 rounded-full animate-pulse" />
          <span className="text-base text-danger-600 font-medium">{t('translate.listening')}</span>
        </div>
      )}

      {/* Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-lg mx-auto px-4 pb-2 space-y-2">
        {/* Custom text input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendCustom()}
            placeholder={t('translate.type_question')}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={sendCustom}
            disabled={!customText.trim() || processing}
            className="px-4 py-3 bg-primary-600 text-white rounded-xl font-medium disabled:bg-gray-300 shadow-sm"
          >
            {t('translate.send')}
          </button>
        </div>

        {/* Staff answer button */}
        <button
          onClick={staffAnswer}
          disabled={listening || speaking || processing}
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          {listening ? t('translate.listening') : t('translate.listen_staff')}
        </button>
      </div>
    </div>
  )
}
