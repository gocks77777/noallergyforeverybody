const BASE = import.meta.env.VITE_API_URL ?? 'https://cleaningsource-allergy-scan-api.hf.space'

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

// -- Seoul bounds check --
function isInSeoul(lat: number, lng: number): boolean {
  return lat > 37.41 && lat < 37.72 && lng > 126.76 && lng < 127.19
}

// -- Overpass API (Global restaurants) --
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

interface OverpassElement {
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

async function fetchOverpassRestaurants(lat: number, lng: number, radius: number): Promise<Restaurant[]> {
  const query = `[out:json][timeout:15];(node(around:${radius},${lat},${lng})["amenity"~"restaurant|fast_food|cafe"];way(around:${radius},${lat},${lng})["amenity"~"restaurant|fast_food|cafe"];);out center 40;`
  const res = await fetch(`${OVERPASS_URL}?data=${encodeURIComponent(query)}`)
  if (!res.ok) return []
  const data = await res.json()

  return (data.elements as OverpassElement[])
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat
      const elLng = el.lon ?? el.center?.lon
      if (!elLat || !elLng) return null
      const tags = el.tags ?? {}
      return {
        name: tags.name ?? 'Unknown',
        address: tags['addr:street'] ? `${tags['addr:street']} ${tags['addr:housenumber'] ?? ''}`.trim() : '',
        category: tags.cuisine ?? tags.amenity ?? '',
        lat: elLat,
        lng: elLng,
      } satisfies Restaurant
    })
    .filter((r): r is Restaurant => r !== null && r.name !== 'Unknown')
}

// -- Smart restaurant fetcher: Seoul → CSV, Global → Overpass --
export async function getSmartRestaurants(lat: number, lng: number, radius = 500): Promise<{ restaurants: Restaurant[]; source: 'seoul' | 'global' }> {
  if (isInSeoul(lat, lng)) {
    const data = await getRestaurants(lat, lng, radius)
    return { restaurants: data, source: 'seoul' }
  }
  const data = await fetchOverpassRestaurants(lat, lng, radius)
  return { restaurants: data, source: 'global' }
}
