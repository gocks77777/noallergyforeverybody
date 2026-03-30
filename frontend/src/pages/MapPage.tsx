import { useState, useEffect } from 'react'
import { getRestaurants, getHotspots, type Restaurant, type Hotspot } from '@/lib/api'

const RISK_STYLE = {
  high:   'bg-danger-500 text-white',
  medium: 'bg-warning-500 text-white',
  low:    'bg-primary-500 text-white',
} as const

export default function MapPage() {
  const [tab, setTab] = useState<'restaurants' | 'hotspots'>('restaurants')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [hotspots, setHotspots] = useState<Hotspot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [radius, setRadius] = useState(500)

  // Get nearby restaurants based on current location
  useEffect(() => {
    if (tab !== 'restaurants') return
    setLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await getRestaurants(pos.coords.latitude, pos.coords.longitude, radius)
          setRestaurants(data)
        } catch (e: any) {
          setError(e.message)
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Location access denied. Please allow location permission.')
        setLoading(false)
      },
    )
  }, [tab, radius])

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

  return (
    <div className="p-4 space-y-4">
      {/* Tab */}
      <div className="flex gap-2">
        {(['restaurants', 'hotspots'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              tab === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {t === 'restaurants' ? 'Nearby Restaurants' : 'Foreigner Hotspots'}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger-600 bg-danger-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Restaurants Tab */}
      {tab === 'restaurants' && (
        <>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Radius:</label>
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
          </div>

          {loading ? (
            <Skeleton count={5} />
          ) : restaurants.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No restaurants found nearby.</p>
          ) : (
            <ul className="space-y-2">
              {restaurants.map((r, i) => (
                <li key={i} className="bg-white rounded-xl shadow p-3 space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-gray-800 text-sm">{r.name}</h3>
                    <span className="text-xs text-gray-400 shrink-0">{r.category}</span>
                  </div>
                  <p className="text-xs text-gray-500">{r.address}</p>
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
            <p className="text-center text-gray-400 py-10">No hotspot data available.</p>
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
                    Foreign population: {h.foreign_count.toLocaleString()}
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
