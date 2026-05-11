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
    utterance.onend = () => {
      clearInterval(keepAlive)
      resolve()
    }
    utterance.onerror = (e) => {
      clearInterval(keepAlive)
      // SpeechSynthesisErrorEvent → Error 로 변환
      reject(new Error((e as SpeechSynthesisErrorEvent).error ?? 'tts-error'))
    }
    window.speechSynthesis.speak(utterance)

    // Chrome bug: speechSynthesis stops after ~15s — keep alive with pause/resume
    const keepAlive = setInterval(() => {
      if (!window.speechSynthesis.speaking) { clearInterval(keepAlive); return }
      window.speechSynthesis.pause()
      window.speechSynthesis.resume()
    }, 10_000)
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

    let resultReceived = false

    recognition.onresult = (event: any) => {
      resultReceived = true
      resolve(event.results[0][0].transcript)
    }
    recognition.onerror = (event: any) => reject(new Error(event.error))
    // 결과 없이 종료되면 no-speech 에러로 reject (이전엔 Promise가 영원히 대기)
    recognition.onend = () => {
      if (!resultReceived) reject(new Error('no-speech'))
    }
    recognition.start()
  })
}
