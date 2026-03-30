import { useState, useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getRestaurants, getHotspots, type Restaurant, type Hotspot } from '@/lib/api'
import { useLang } from '@/lib/LangContext'

// Leaflet icon fix
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const RISK_STYLE = {
  high: 'bg-danger-500 text-white',
  medium: 'bg-warning-500 text-white',
  low: 'bg-primary-500 text-white',
} as const

const SEOUL: [number, number] = [37.5665, 126.978]

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

  const mapRef = useRef<L.Map | null>(null)
  const mapElRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<L.LayerGroup>(L.layerGroup())
  const userMarkerRef = useRef<L.CircleMarker | null>(null)

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

    // Show "search here" when map is moved
    map.on('moveend', () => {
      setShowSearchHere(true)
    })

    setMapInited(true)

    return () => {
      map.remove()
      mapRef.current = null
    }
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
      const data = await getRestaurants(center.lat, center.lng, radius)
      setRestaurants(data)
      if (data.length === 0) {
        setError(t('map.no_data_here'))
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [radius, t])

  // Update markers when restaurants change
  useEffect(() => {
    const group = markersRef.current
    group.clearLayers()
    restaurants.forEach((r) => {
      L.marker([r.lat, r.lng])
        .bindPopup(
          `<strong>${r.name}</strong><br/>` +
          `<span style="font-size:11px;color:#888">${r.category}</span><br/>` +
          `<span style="font-size:11px">${r.address}</span>`
        )
        .addTo(group)
    })
  }, [restaurants])

  // Initial load: fly to user location + search
  useEffect(() => {
    if (tab !== 'restaurants' || !mapInited) return
    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const map = mapRef.current!

        // Blue dot for user location
        if (userMarkerRef.current) userMarkerRef.current.remove()
        userMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 8, fillColor: '#3b82f6', fillOpacity: 1,
          color: '#fff', weight: 3,
        }).addTo(map)

        map.flyTo([lat, lng], 15, { duration: 1 })

        try {
          const data = await getRestaurants(lat, lng, radius)
          setRestaurants(data)
          if (data.length === 0) {
            setError(t('map.no_nearby'))
          }
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

  // Quick jump to Seoul
  function jumpToSeoul() {
    mapRef.current?.flyTo(SEOUL, 14, { duration: 1 })
  }

  return (
    <div className="p-4 space-y-3">
      {/* Tab */}
      <div className="flex gap-2">
        {(['restaurants', 'hotspots'] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === tb ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tb === 'restaurants' ? t('map.restaurants') : t('map.hotspots')}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-danger-600 bg-danger-50 rounded-lg px-3 py-2">{error}</p>
      )}

      {/* Restaurants Tab */}
      {tab === 'restaurants' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">{t('map.radius')}:</label>
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value={200}>200m</option>
              <option value={500}>500m</option>
              <option value={1000}>1km</option>
              <option value={2000}>2km</option>
            </select>
            <button
              onClick={jumpToSeoul}
              className="ml-auto text-xs text-primary-600 font-medium px-2 py-1 border border-primary-300 rounded-lg hover:bg-primary-50"
            >
              {t('map.go_to_seoul')}
            </button>
          </div>

          {/* Map */}
          <div className="relative">
            <div
              ref={mapElRef}
              className="rounded-xl overflow-hidden shadow"
              style={{ height: '350px', zIndex: 0 }}
            />

            {/* Search this area button */}
            {showSearchHere && (
              <button
                onClick={searchAtCenter}
                disabled={loading}
                className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white shadow-lg px-4 py-2 rounded-full text-sm font-medium text-primary-700 border border-primary-200 hover:bg-primary-50 transition-colors"
              >
                {loading ? t('map.searching') : t('map.search_here')}
              </button>
            )}

            {/* Result count badge */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 shadow px-3 py-1 rounded-full text-xs text-gray-600">
              {loading ? t('scan.loading') : `${restaurants.length}${t('map.restaurant_count')}`}
            </div>
          </div>

          {/* Restaurant List */}
          {restaurants.length === 0 && !loading ? (
            <p className="text-center text-gray-400 py-4 text-sm">{t('map.no_restaurants')}</p>
          ) : (
            <ul className="space-y-1.5">
              {restaurants.slice(0, 10).map((r, i) => (
                <li
                  key={i}
                  className="bg-white rounded-lg shadow-sm p-2.5 flex justify-between items-start cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    mapRef.current?.flyTo([r.lat, r.lng], 17, { duration: 0.5 })
                    markersRef.current.eachLayer((layer) => {
                      if (layer instanceof L.Marker) {
                        const pos = layer.getLatLng()
                        if (Math.abs(pos.lat - r.lat) < 0.0001 && Math.abs(pos.lng - r.lng) < 0.0001) {
                          layer.openPopup()
                        }
                      }
                    })
                  }}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.name}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[250px]">{r.address}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 ml-2">{r.category}</span>
                </li>
              ))}
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
                <li key={i} className="bg-white rounded-xl shadow p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800 text-sm">{h.dong_name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RISK_STYLE[h.risk_level]}`}>
                      {h.risk_level.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {t('map.foreign_pop')}: {h.foreign_count.toLocaleString()}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {h.top_allergen_foods.map((f) => (
                      <span key={f} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {f}
                      </span>
                    ))}
                  </div>
                </li>
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
        <div key={i} className="bg-white rounded-xl shadow p-3 animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      ))}
    </div>
  )
}
