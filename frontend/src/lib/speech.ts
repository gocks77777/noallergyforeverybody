/**
 * Web Speech API TTS + STT 래퍼
 */

const TTS_LANG_MAP: Record<string, string> = {
  ko: 'ko-KR', en: 'en-US', ja: 'ja-JP', zh: 'zh-CN',
  es: 'es-ES', fr: 'fr-FR', de: 'de-DE', vi: 'vi-VN', th: 'th-TH', ar: 'ar-SA',
}

/** 텍스트를 해당 언어로 음성 재생 */
export function speak(text: string, lang: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) { reject(new Error('TTS not supported')); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = TTS_LANG_MAP[lang] ?? lang
    utterance.rate = 0.9
    utterance.onend = () => resolve()
    utterance.onerror = (e) => reject(e)
    window.speechSynthesis.speak(utterance)
  })
}

/** 음성 인식 시작 → 텍스트 반환 */
export function listen(lang: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { reject(new Error('STT not supported')); return }

    const recognition = new SpeechRecognition()
    recognition.lang = TTS_LANG_MAP[lang] ?? lang
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript
      resolve(text)
    }
    recognition.onerror = (event: any) => reject(new Error(event.error))
    recognition.onend = () => {} // handled by onresult or onerror
    recognition.start()
  })
}
