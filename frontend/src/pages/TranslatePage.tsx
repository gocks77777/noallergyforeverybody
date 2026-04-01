import { useState, useRef } from 'react'
import { useLang } from '@/lib/LangContext'
import type { LangCode } from '@/lib/i18n'
import { speak, listen } from '@/lib/speech'
import { translate } from '@/lib/translate'

interface Message {
  id: number
  from: 'foreigner' | 'staff'
  original: string
  translated: string
  lang: string
}

// 언어별 자주 쓰는 질문 프리셋 (선택 언어 + 한국어 번역)
const PRESETS: Record<LangCode, { key: string; ko: string }[]> = {
  ko: [
    { key: '이 음식에 땅콩 들어있나요?', ko: '이 음식에 땅콩 들어있나요?' },
    { key: '저는 음식 알레르기가 있어요.', ko: '저는 음식 알레르기가 있어요.' },
    { key: '이 재료 빼고 만들어주세요.', ko: '이 재료 빼고 만들어주세요.' },
    { key: '성분표를 볼 수 있나요?', ko: '성분표를 볼 수 있나요?' },
    { key: '이거 글루텐 프리인가요?', ko: '이거 글루텐 프리인가요?' },
    { key: '유제품이 들어있나요?', ko: '유제품이 들어있나요?' },
  ],
  en: [
    { key: 'Does this contain peanuts?', ko: '이 음식에 땅콩 들어있나요?' },
    { key: 'I have a food allergy.', ko: '저는 음식 알레르기가 있어요.' },
    { key: 'Please make it without this ingredient.', ko: '이 재료 빼고 만들어주세요.' },
    { key: 'Can I see the ingredient list?', ko: '성분표를 볼 수 있나요?' },
    { key: 'Is this gluten free?', ko: '이거 글루텐 프리인가요?' },
    { key: 'Does this have dairy?', ko: '유제품이 들어있나요?' },
  ],
  ja: [
    { key: 'この料理にピーナッツは入っていますか？', ko: '이 음식에 땅콩 들어있나요?' },
    { key: '私は食物アレルギーがあります。', ko: '저는 음식 알레르기가 있어요.' },
    { key: 'この材料を抜いて作ってください。', ko: '이 재료 빼고 만들어주세요.' },
    { key: '原材料リストを見せてもらえますか？', ko: '성분표를 볼 수 있나요?' },
    { key: 'これはグルテンフリーですか？', ko: '이거 글루텐 프리인가요?' },
    { key: '乳製品は入っていますか？', ko: '유제품이 들어있나요?' },
  ],
  zh: [
    { key: '这道菜里有花生吗？', ko: '이 음식에 땅콩 들어있나요?' },
    { key: '我有食物过敏。', ko: '저는 음식 알레르기가 있어요.' },
    { key: '请不要放这个食材。', ko: '이 재료 빼고 만들어주세요.' },
    { key: '可以看一下配料表吗？', ko: '성분표를 볼 수 있나요?' },
    { key: '这是无麸质的吗？', ko: '이거 글루텐 프리인가요?' },
    { key: '里面有乳制品吗？', ko: '유제품이 들어있나요?' },
  ],
  es: [
    { key: '¿Esto contiene cacahuetes?', ko: '이 음식에 땅콩 들어있나요?' },
    { key: 'Tengo alergia alimentaria.', ko: '저는 음식 알레르기가 있어요.' },
    { key: 'Por favor, hágalo sin este ingrediente.', ko: '이 재료 빼고 만들어주세요.' },
    { key: '¿Puedo ver la lista de ingredientes?', ko: '성분표를 볼 수 있나요?' },
    { key: '¿Es sin gluten?', ko: '이거 글루텐 프리인가요?' },
    { key: '¿Tiene lácteos?', ko: '유제품이 들어있나요?' },
  ],
  fr: [
    { key: 'Ce plat contient-il des cacahuetes ?', ko: '이 음식에 땅콩 들어있나요?' },
    { key: "J'ai une allergie alimentaire.", ko: '저는 음식 알레르기가 있어요.' },
    { key: 'Merci de le preparer sans cet ingredient.', ko: '이 재료 빼고 만들어주세요.' },
    { key: 'Puis-je voir la liste des ingredients ?', ko: '성분표를 볼 수 있나요?' },
    { key: 'Est-ce sans gluten ?', ko: '이거 글루텐 프리인가요?' },
    { key: 'Y a-t-il des produits laitiers ?', ko: '유제품이 들어있나요?' },
  ],
  de: [
    { key: 'Enthalt das Erdnusse?', ko: '이 음식에 땅콩 들어있나요?' },
    { key: 'Ich habe eine Lebensmittelallergie.', ko: '저는 음식 알레르기가 있어요.' },
    { key: 'Bitte ohne diese Zutat zubereiten.', ko: '이 재료 빼고 만들어주세요.' },
    { key: 'Kann ich die Zutatenliste sehen?', ko: '성분표를 볼 수 있나요?' },
    { key: 'Ist das glutenfrei?', ko: '이거 글루텐 프리인가요?' },
    { key: 'Enthalt es Milchprodukte?', ko: '유제품이 들어있나요?' },
  ],
  vi: [
    { key: 'Mon nay co dau phong khong?', ko: '이 음식에 땅콩 들어있나요?' },
    { key: 'Toi bi di ung thuc pham.', ko: '저는 음식 알레르기가 있어요.' },
    { key: 'Vui long lam mon nay khong co nguyen lieu nay.', ko: '이 재료 빼고 만들어주세요.' },
    { key: 'Toi co the xem danh sach thanh phan khong?', ko: '성분표를 볼 수 있나요?' },
    { key: 'Mon nay co khong gluten khong?', ko: '이거 글루텐 프리인가요?' },
    { key: 'Mon nay co sua khong?', ko: '유제품이 들어있나요?' },
  ],
  th: [
    { key: 'เมนูนี้มีถั่วลิสงไหม?', ko: '이 음식에 땅콩 들어있나요?' },
    { key: 'ฉันแพ้อาหาร', ko: '저는 음식 알레르기가 있어요.' },
    { key: 'กรุณาทำโดยไม่ใส่วัตถุดิบนี้', ko: '이 재료 빼고 만들어주세요.' },
    { key: 'ขอดูรายการส่วนผสมได้ไหม?', ko: '성분표를 볼 수 있나요?' },
    { key: 'นี่ปลอดกลูเตนไหม?', ko: '이거 글루텐 프리인가요?' },
    { key: 'มีนมไหม?', ko: '유제품이 들어있나요?' },
  ],
  ar: [
    { key: 'هل يحتوي هذا الطبق على الفول السوداني؟', ko: '이 음식에 땅콩 들어있나요?' },
    { key: 'لدي حساسية من الطعام.', ko: '저는 음식 알레르기가 있어요.' },
    { key: 'من فضلك حضره بدون هذا المكون.', ko: '이 재료 빼고 만들어주세요.' },
    { key: 'هل يمكنني رؤية قائمة المكونات؟', ko: '성분표를 볼 수 있나요?' },
    { key: 'هل هذا خال من الغلوتين؟', ko: '이거 글루텐 프리인가요?' },
    { key: 'هل يحتوي على منتجات الالبان؟', ko: '유제품이 들어있나요?' },
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
    foreignerAsk(preset.key)
  }

  // 커스텀 텍스트 전송
  function sendCustom() {
    if (!customText.trim()) return
    foreignerAsk(customText.trim())
    setCustomText('')
  }

  return (
    <div className="page-shell">
      <div className="card p-4 text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900">
          {t('translate.title')}
        </h2>
        <p className="text-sm text-slate-600">
          {t('translate.subtitle')}
        </p>
      </div>

      {error && (
        <p className="text-base text-danger-700 bg-danger-50 rounded-xl px-3 py-2 border border-danger-200">{error}</p>
      )}

      <section className="card p-3 space-y-2">
        <p className="section-title">{t('translate.quick')}</p>
        <div className="grid grid-cols-1 gap-1.5">
          {(PRESETS[lang as LangCode] ?? PRESETS.en).map((p) => (
            <button
              key={p.key}
              onClick={() => usePreset(p)}
              disabled={processing || speaking}
              className="text-left px-3 py-2.5 bg-white rounded-xl border border-slate-200 hover:border-primary-300 transition-colors disabled:opacity-50"
            >
              <p className="text-base text-slate-800">{p.key}</p>
              <p className="text-sm text-slate-500 mt-0.5">{p.ko}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Chat Messages */}
      {messages.length > 0 && (
        <section className="card p-3 space-y-2">
          <p className="section-title">{t('translate.conversation')}</p>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-3 space-y-1 ${
                msg.from === 'foreigner'
                  ? 'bg-primary-50 border border-primary-200 ml-4'
                  : 'bg-slate-50 border border-slate-200 mr-4'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-slate-600">
                  {msg.from === 'foreigner' ? t('translate.you') : t('translate.staff')}
                </span>
                <span className="text-sm text-slate-400">
                  {msg.from === 'foreigner' ? t('translate.to_korean') : t('translate.to_lang')}
                </span>
              </div>
              <p className="text-base text-slate-800">{msg.original}</p>
              <p className={`text-base font-medium ${
                msg.from === 'foreigner' ? 'text-primary-700' : 'text-slate-700'
              }`}>
                {msg.translated}
              </p>
              {/* Replay button */}
              <button
                onClick={() => speak(
                  msg.from === 'foreigner' ? msg.translated : msg.translated,
                  msg.from === 'foreigner' ? 'ko' : lang
                )}
                className="text-sm text-slate-500 hover:text-primary-700 flex items-center gap-1 mt-1"
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

      <div className="fixed bottom-20 left-0 right-0 max-w-lg mx-auto px-4 pb-2 space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendCustom()}
            placeholder={t('translate.type_question')}
            className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-base shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            onClick={sendCustom}
            disabled={!customText.trim() || processing}
            className="px-4 py-3 bg-primary-600 text-white rounded-xl font-semibold disabled:bg-slate-300 shadow-soft"
          >
            {t('translate.send')}
          </button>
        </div>

        <button
          onClick={staffAnswer}
          disabled={listening || speaking || processing}
          className="w-full py-3.5 rounded-xl font-semibold text-white bg-slate-700 hover:bg-slate-800 disabled:bg-slate-300 transition-colors flex items-center justify-center gap-2 shadow-soft"
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
