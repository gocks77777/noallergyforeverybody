import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getSmartRestaurants, getHotspots, type Restaurant, type Hotspot } from '@/lib/api'
import { useLang } from '@/lib/LangContext'
import { motion } from 'framer-motion'

// Leaflet icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl

// 식당 카테고리 → 주의 알레르겐 매핑 (한국 카테고리 + 글로벌 cuisine 태그)
const CATEGORY_ALLERGENS: Record<string, string[]> = {
  // 한국 (서울 CSV)
  '일식':     ['생선', '갑각류', '조개류', '대두'],
  '횟집':     ['생선', '갑각류', '조개류'],
  '중국식':   ['대두', '밀', '계란', '땅콩'],
  '한식':     ['대두', '밀', '생선'],
  '분식':     ['밀', '대두', '계란'],
  '경양식':   ['밀', '우유', '계란', '돼지고기'],
  '식육(숯불구이)': ['쇠고기', '돼지고기'],
  '통닭(치킨)':     ['닭고기', '밀', '계란'],
  '호프/통닭':      ['닭고기', '밀'],
  '패스트푸드':     ['밀', '우유', '계란'],
  '탕류(보신용)':   ['쇠고기', '돼지고기'],
  '복어취급':       ['생선'],
  '냉면집':         ['밀', '계란', '쇠고기'],
  '외국음식전문점(인도,태국등)': ['땅콩', '갑각류', '대두', '생선'],
  '김밥(도시락)':   ['밀', '대두', '계란'],
  '뷔페식':         ['밀', '대두', '계란', '생선', '갑각류'],
  // 글로벌 (OSM cuisine 태그)
  'japanese':  ['생선', '갑각류', '조개류', '대두'],
  'sushi':     ['생선', '갑각류', '대두'],
  'ramen':     ['밀', '대두', '계란'],
  'chinese':   ['대두', '밀', '계란', '땅콩'],
  'korean':    ['대두', '밀', '생선'],
  'thai':      ['땅콩', '갑각류', '생선'],
  'vietnamese':['생선', '갑각류', '땅콩'],
  'pho':       ['생선', '쇠고기'],
  'indian':    ['우유', '견과류', '밀'],
  'curry':     ['우유', '견과류', '밀'],
  'italian':   ['밀', '우유', '계란'],
  'pizza':     ['밀', '우유'],
  'pasta':     ['밀', '계란', '우유'],
  'mexican':   ['우유', '밀'],
  'burger':    ['밀', '우유', '계란', '쇠고기'],
  'sandwich':  ['밀', '우유', '계란'],
  'seafood':   ['생선', '갑각류', '조개류'],
  'fish_and_chips': ['생선', '밀'],
  'steak':     ['쇠고기'],
  'kebab':     ['밀', '우유'],
  'french':    ['밀', '우유', '계란'],
  'spanish':   ['생선', '갑각류', '조개류'],
  'turkish':   ['밀', '우유', '견과류'],
  'middle_eastern': ['밀', '견과류', '대두'],
  'arab':      ['밀', '견과류'],
  'african':   ['땅콩', '생선'],
  'brazilian':  ['쇠고기', '대두'],
  'fast_food': ['밀', '우유', '계란', '대두'],
  'cafe':      ['밀', '우유', '계란'],
  'coffee':    ['우유'],
  'bakery':    ['밀', '우유', '계란', '견과류'],
  'ice_cream': ['우유', '계란', '견과류'],
  'noodle':    ['밀', '계란', '대두'],
}

type RiskLevel = 'danger' | 'warning' | 'safe' | 'unknown'

function getAllergens(category: string): string[] {
  // 직접 매치
  if (CATEGORY_ALLERGENS[category]) return CATEGORY_ALLERGENS[category]
  // 세미콜론 분리 (OSM: "italian;pizza")
  const parts = category.split(/[;,]/).map(s => s.trim().toLowerCase())
  const all = new Set<string>()
  for (const p of parts) {
    for (const a of CATEGORY_ALLERGENS[p] ?? []) all.add(a)
  }
  return [...all]
}

function getRisk(category: string, userAllergies: string[]): RiskLevel {
  if (userAllergies.length === 0) return 'unknown'
  const catAllergens = getAllergens(category)
  if (catAllergens.length === 0) return 'unknown'
  const overlap = catAllergens.filter(a => userAllergies.includes(a))
  if (overlap.length >= 2) return 'danger'
  if (overlap.length === 1) return 'warning'
  return 'safe'
}

function getOverlap(category: string, userAllergies: string[]): string[] {
  return getAllergens(category).filter(a => userAllergies.includes(a))
}

const RISK_COLORS = {
  danger:  { fill: '#ef4444', border: '#dc2626' },
  warning: { fill: '#f59e0b', border: '#d97706' },
  safe:    { fill: '#10b981', border: '#059669' },
  unknown: { fill: '#9ca3af', border: '#6b7280' },
}

const RISK_LABELS = {
  danger: 'HIGH RISK',
  warning: 'CAUTION',
  safe: 'SAFE',
  unknown: '',
}

const HOTSPOT_RISK_STYLE = {
  high: 'bg-danger-500 text-white',
  medium: 'bg-warning-500 text-white',
  low: 'bg-primary-500 text-white',
} as const

const SEOUL: [number, number] = [37.5665, 126.978]

function getUserAllergies(): string[] {
  try {
    const saved = localStorage.getItem('user-allergies')
    return saved ? JSON.parse(saved) : []
  } catch { return [] }
}

export default function MapPage() {
  const { t } = useLang()
  const [tab, setTab] = useState<'restaurants' | 'hotspots'>('restaurants')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [radius, setRadius] = useState(500)
  const [showSearchHere, setShowSearchHere] = useState(false)
  const [mapInited, setMapInited] = useState(false)
  const [userAllergies] = useState<string[]>(getUserAllergies)
  const [source, setSource] = useState<'seoul' | 'global'>('seoul')

  const mapRef = useRef<L.Map | null>(null)
  const mapElRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.LayerGroup>(L.layerGroup())
  const userMarkerRef = useRef<L.CircleMarker | null>(null)

  // Risk stats
  const riskStats = {
    danger: restaurants.filter(r => getRisk(r.category, userAllergies) === 'danger').length,
    warning: restaurants.filter(r => getRisk(r.category, userAllergies) === 'warning').length,
    safe: restaurants.filter(r => getRisk(r.category, userAllergies) === 'safe').length,
  }

  // Init map once
  useEffect(() => {
    if (!mapElRef.current || mapRef.current) return
    const map = L.map(mapElRef.current, { zoomControl: false }).setView(SEOUL, 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://osm.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    markersRef.current.addTo(map)
    mapRef.current = map

    map.on('moveend', () => setShowSearchHere(true))
    setMapInited(true)

    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Search at map center
  const searchAtCenter = useCallback(async () => {
    const map = mapRef.current
    if (!map) return
    const center = map.getCenter()
    setLoading(true)
    setError('')
    setShowSearchHere(false)
    try {
      const { restaurants: data, source: src } = await getSmartRestaurants(center.lat, center.lng, radius)
      setRestaurants(data)
      setSource(src)
      if (data.length === 0) setError(t('map.no_data_here'))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [radius, t])

  // Update markers — color-coded by allergy risk
  useEffect(() => {
    const group = markersRef.current
    group.clearLayers()
    restaurants.forEach((r) => {
      const risk = getRisk(r.category, userAllergies)
      const colors = RISK_COLORS[risk]
      const overlap = getOverlap(r.category, userAllergies)

      const marker = L.circleMarker([r.lat, r.lng], {
        radius: 7,
        fillColor: colors.fill,
        fillOpacity: 0.85,
        color: colors.border,
        weight: 2,
      })

      const riskLabel = RISK_LABELS[risk]
      const allergenHtml = overlap.length > 0
        ? `<div style="margin-top:4px;display:flex;gap:3px;flex-wrap:wrap">${overlap.map(a =>
            `<span style="background:${colors.fill};color:white;font-size:10px;padding:1px 6px;border-radius:8px">${a}</span>`
          ).join('')}</div>`
        : ''
      const riskBadge = riskLabel
        ? `<span style="background:${colors.fill};color:white;font-size:9px;padding:1px 6px;border-radius:8px;font-weight:600">${riskLabel}</span>`
        : ''

      marker.bindPopup(
        `<div style="min-width:160px">` +
        `<strong style="font-size:13px">${r.name}</strong> ${riskBadge}<br/>` +
        `<span style="font-size:11px;color:#888">${r.category}</span><br/>` +
        `<span style="font-size:10px;color:#aaa">${r.address}</span>` +
        allergenHtml +
        `</div>`,
        { maxWidth: 250 }
      )

      marker.addTo(group)
    })
  }, [restaurants, userAllergies])

  // Initial load
  useEffect(() => {
    if (tab !== 'restaurants' || !mapInited) return
    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const map = mapRef.current!

        if (userMarkerRef.current) userMarkerRef.current.remove()
        userMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 8, fillColor: '#3b82f6', fillOpacity: 1,
          color: '#fff', weight: 3,
        }).addTo(map)

        map.flyTo([lat, lng], 15, { duration: 1 })

        try {
          const { restaurants: data, source: src } = await getSmartRestaurants(lat, lng, radius)
          setRestaurants(data)
          setSource(src)
          if (data.length === 0) setError(t('map.no_nearby'))
        } catch (e: any) {
          setError(e.message)
        } finally {
          setLoading(false)
          setShowSearchHere(false)
        }
      },
      () => {
        setError(t('map.location_denied'))
        setLoading(false)
      },
    )
  }, [tab, mapInited, radius, t])

  // Fetch hotspots
  useEffect(() => {
    if (tab !== 'hotspots') return
    setLoading(true)
    setError('')
    getHotspots()
      .then(setHotspots)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [tab])

  function jumpToSeoul() {
    mapRef.current?.flyTo(SEOUL, 14, { duration: 1 })
  }

  return (
    <div className="p-4 space-y-3 pb-6">
      {/* Tab */}
      <div className="flex gap-2">
        {(['restaurants', 'hotspots'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`btn-press flex-1 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
              tab === tb
                ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}
          >
            {tb === 'restaurants' ? t('map.restaurants') : t('map.hotspots')}
          </button>
        ))}
      </div>

      {/* Allergy info banner */}
      {tab === 'restaurants' && userAllergies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-soft p-3 flex items-start gap-2"
        >
          <div className="w-6 h-6 bg-primary-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-500">{t('home.allergies')}:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {userAllergies.map(a => (
                <span key={a} className="text-[10px] bg-danger-100 text-danger-700 px-1.5 py-0.5 rounded-md font-medium">{a}</span>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {tab === 'restaurants' && userAllergies.length === 0 && (
        <div className="bg-warning-50 border border-warning-100 rounded-2xl px-3 py-2.5 text-xs text-warning-600">
          {t('home.allergies')} — {t('nav.scan')} {t('home.allergies')}
        </div>
      )}

      {error && (
        <p className="text-sm text-danger-600 bg-danger-50 rounded-2xl px-3 py-2 border border-danger-100">{error}</p>
      )}

      {/* Restaurants Tab */}
      {tab === 'restaurants' && (
        <>
          <div className="flex items-center gap-2">
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white shadow-soft"
            >
              <option value={200}>200m</option>
              <option value={500}>500m</option>
              <option value={1000}>1km</option>
              <option value={2000}>2km</option>
            </select>
            <button
              onClick={jumpToSeoul}
              className="btn-press ml-auto text-xs text-primary-600 font-semibold px-3 py-2 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors"
            >
              {t('map.go_to_seoul')}
            </button>
          </div>

          {/* Map */}
          <div className="relative">
            <div
              ref={mapElRef}
              className="rounded-2xl overflow-hidden shadow-card"
              style={{ height: '320px', zIndex: 0 }}
            />

            {showSearchHere && (
              <button
                onClick={searchAtCenter}
                disabled={loading}
                className="btn-press absolute top-3 left-1/2 -translate-x-1/2 z-[1000] glass shadow-elevated px-4 py-2 rounded-full text-sm font-semibold text-primary-700 border border-primary-200 hover:bg-primary-50 transition-all"
              >
                {loading ? t('map.searching') : t('map.search_here')}
              </button>
            )}

            {/* Legend */}
            {restaurants.length > 0 && userAllergies.length > 0 && (
              <div className="absolute bottom-3 left-3 z-[1000] glass rounded-xl px-3 py-2 shadow-sm space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                  <span className="text-[10px] text-gray-600 font-medium">{riskStats.danger}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                  <span className="text-[10px] text-gray-600 font-medium">{riskStats.warning}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                  <span className="text-[10px] text-gray-600 font-medium">{riskStats.safe}</span>
                </div>
              </div>
            )}

            <div className="absolute bottom-3 right-3 z-[1000] glass shadow-sm px-3 py-1.5 rounded-xl text-[10px] text-gray-500 font-medium flex items-center gap-1.5">
              <span>{loading ? t('map.searching') : `${restaurants.length}${t('map.restaurant_count')}`}</span>
              {!loading && restaurants.length > 0 && (
                <span className={`px-1.5 py-0.5 rounded-md text-white font-bold ${source === 'seoul' ? 'bg-primary-500' : 'bg-blue-500'}`}>
                  {source === 'seoul' ? 'Seoul Data' : 'OSM Global'}
                </span>
              )}
            </div>
          </div>

          {/* Restaurant List */}
          {restaurants.length === 0 && !loading ? (
            <p className="text-center text-gray-400 py-4 text-sm">{t('map.no_restaurants')}</p>
          ) : (
            <ul className="space-y-2">
              {restaurants.slice(0, 10).map((r, i) => {
                const risk = getRisk(r.category, userAllergies)
                const overlap = getOverlap(r.category, userAllergies)
                const colors = RISK_COLORS[risk]
                return (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="btn-press bg-white rounded-2xl shadow-soft p-3 cursor-pointer hover:shadow-card transition-all"
                    style={{ borderLeft: `3px solid ${colors.fill}` }}
                    onClick={() => {
                      mapRef.current?.flyTo([r.lat, r.lng], 17, { duration: 0.5 })
                      markersRef.current.eachLayer((layer) => {
                        if (layer instanceof L.CircleMarker) {
                          const pos = layer.getLatLng()
                          if (Math.abs(pos.lat - r.lat) < 0.0001 && Math.abs(pos.lng - r.lng) < 0.0001) {
                            layer.openPopup()
                          }
                        }
                      })
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{r.name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{r.address}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0 ml-2 bg-gray-50 px-2 py-0.5 rounded-lg">{r.category}</span>
                    </div>
                    {overlap.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {overlap.map(a => (
                          <span key={a} className="text-[10px] px-2 py-0.5 rounded-lg font-semibold"
                            style={{ background: `${colors.fill}15`, color: colors.fill }}
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {/* Hotspots Tab */}
      {tab === 'hotspots' && (
        <>
          {loading ? (
            <Skeleton count={5} />
          ) : hotspots.length === 0 ? (
            <p className="text-center text-gray-400 py-10">{t('map.no_hotspots')}</p>
          ) : (
            <ul className="space-y-2">
              {hotspots.map((h, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-2xl shadow-soft p-4 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 text-sm">{h.dong_name}</h3>
                    <span className={`text-[10px] px-2.5 py-1 rounded-xl font-bold ${HOTSPOT_RISK_STYLE[h.risk_level]}`}>
                      {h.risk_level.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {t('map.foreign_pop')}: {h.foreign_count.toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {h.top_allergen_foods.map((f) => (
                      <span key={f} className="text-[10px] bg-gray-50 text-gray-600 px-2 py-1 rounded-lg font-medium">
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

function Skeleton({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl shadow-soft p-4 animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}
