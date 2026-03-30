/**
 * MyMemory 무료 번역 API (키 불필요, 일 1000회)
 * fallback: 원문 그대로 반환
 */

const LANG_CODES: Record<string, string> = {
  ko: 'ko', en: 'en', ja: 'ja', zh: 'zh-CN',
  es: 'es', fr: 'fr', de: 'de', vi: 'vi', th: 'th', ar: 'ar',
}

export async function translate(text: string, from: string, to: string): Promise<string> {
  const fromCode = LANG_CODES[from] ?? from
  const toCode = LANG_CODES[to] ?? to
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromCode}|${toCode}`
    )
    const data = await res.json()
    const translated = data?.responseData?.translatedText
    if (translated && !translated.includes('MYMEMORY WARNING')) return translated
    return text
  } catch {
    return text
  }
}
