const BASE = import.meta.env.VITE_API_URL ?? '/api'

export interface PredictResult {
  food_name: string
  top3: { label: string; score: number }[]
  ingredients: string[]
  allergens: string[]
  claude_analysis?: string
  cached?: boolean
}

export interface BarcodeResult {
  barcode: string
  product_name: string
  allergens: string[]
  ingredients_text: string
  labels: string[]
}

export interface Restaurant {
  name: string
  address: string
  category: string
  lat: number
  lng: number
}

export interface Hotspot {
  dong_name: string
  dong_code: string
  foreign_count: number
  risk_level: 'high' | 'medium' | 'low'
  top_allergen_foods: string[]
}

export async function predictImage(
  file: File,
  allergies: string,
  language = 'ko',
): Promise<PredictResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('allergies', allergies)
  form.append('language', language)
  const res = await fetch(`${BASE}/predict`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export async function getBarcode(code: string): Promise<BarcodeResult> {
  const res = await fetch(`${BASE}/barcode/${code}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export async function getRestaurants(
  lat: number,
  lng: number,
  radius = 500,
): Promise<Restaurant[]> {
  const res = await fetch(`${BASE}/restaurants?lat=${lat}&lng=${lng}&radius=${radius}`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export async function getHotspots(): Promise<Hotspot[]> {
  const res = await fetch(`${BASE}/hotspots`)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}
