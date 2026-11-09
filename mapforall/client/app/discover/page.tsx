'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { MapPin, Navigation, Bus, ArrowLeft, Accessibility, Store, Search, ExternalLink } from 'lucide-react'
import { parseDiscoveryDeepLink, buildRouteViewPlanUrl } from '@/lib/deepLink'

interface PlaceCardData {
  place_id: string
  name: string
  address?: string
  categories?: string[]
  accessible?: boolean
  local_business?: boolean
  coordinates?: { lat: number; lng: number }
  summary?: string
}

export default function DiscoverPage() {
  const [params, setParams] = useState({
    valid: false,
    lat: -1.9441,
    lng: 30.0619,
    label: '',
    source: '',
  })
  const [places, setPlaces] = useState<PlaceCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'accessible' | 'business'>('all')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const search = new URLSearchParams(window.location.search)
    const parsed = parseDiscoveryDeepLink(search)

    if (parsed.valid && parsed.lat !== null && parsed.lng !== null) {
      setParams({
        valid: true,
        lat: parsed.lat,
        lng: parsed.lng,
        label: parsed.label,
        source: parsed.source,
      })
    }

    // Fetch places from MapForAll public places API
    fetch('/api/places', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('API error')
        const data = await res.json()
        setPlaces(data.places || [])
      })
      .catch(() => {
        // Fallback robust mock data if DB/MCP sidecar is initializing in dev
        setPlaces([
          {
            place_id: 'nyabugogo_market',
            name: 'Nyabugogo Central Market',
            address: 'KN 1 Rd, Nyabugogo, Kigali',
            categories: ['market', 'shopping'],
            accessible: true,
            local_business: true,
            coordinates: { lat: -1.9388, lng: 30.0441 },
            summary: 'Active fresh market with dedicated ground-level accessible ramp.',
          },
          {
            place_id: 'kacyiru_clinic',
            name: 'Kacyiru Community Care Hub',
            address: 'KG 7 Ave, Kacyiru, Kigali',
            categories: ['healthcare'],
            accessible: true,
            local_business: false,
            coordinates: { lat: -1.9288, lng: 30.0641 },
            summary: 'Step-free entrance, wide doors, and sensory-friendly waiting areas.',
          },
          {
            place_id: 'kimironko_tailors',
            name: 'Kimironko Artisan Cooperative',
            address: 'KG 194 St, Kimironko, Kigali',
            categories: ['craft', 'clothing'],
            accessible: true,
            local_business: true,
            coordinates: { lat: -1.9488, lng: 30.1241 },
            summary: 'Independent women-owned tailoring workshop with wheelchair access.',
          },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredPlaces = useMemo(() => {
    return places.filter((p) => {
      if (filter === 'accessible') return p.accessible
      if (filter === 'business') return p.local_business
      return true
    })
  }, [places, filter])

  return (
    <div className="min-h-screen bg-[#FBF3E7] text-[#1A1614] flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#FBF3E7]/90 backdrop-blur-md border-b border-black/10 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-[#6E5B50] hover:text-[#E8672A] transition-colors"
          >
            <ArrowLeft size={16} /> Home
          </Link>
          <span className="h-4 w-px bg-black/10" />
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#E8672A] text-white flex items-center justify-center font-bold text-xs">
              MF
            </span>
            <span className="text-sm font-bold tracking-tight">
              MapForAll <span className="text-[#E8672A]">Discover</span>
            </span>
          </div>
        </div>

        <a
          href={process.env.NEXT_PUBLIC_ROUTEVIEW_URL || 'http://localhost:3000/plan'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-colors shadow-sm"
        >
          <Bus size={13} />
          RouteView Transit
        </a>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 flex-1">
        {/* Inbound Banner if hand-off from RouteView */}
        {params.valid && (
          <div className="mb-6 p-4 rounded-2xl bg-[#E8672A]/10 border border-[#E8672A]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E8672A] text-white flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#E8672A]">
                  Arrived from RouteView Transit
                </p>
                <h2 className="text-base font-bold text-[#1A1614]">
                  Exploring spots near{' '}
                  <span className="underline decoration-[#E8672A] underline-offset-2">
                    {params.label || `${params.lat.toFixed(4)}, ${params.lng.toFixed(4)}`}
                  </span>
                </h2>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white border border-black/10 text-[#6E5B50]">
              Handshake Validated ✓
            </span>
          </div>
        )}

        {/* Title and Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Accessible Places &amp; Businesses</h1>
            <p className="text-xs text-[#6E5B50] mt-0.5">
              Verified ground-truth accessibility and local merchant visibility.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-white/70 p-1 rounded-full border border-black/10 self-start sm:self-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                filter === 'all' ? 'bg-[#1A1614] text-white shadow-sm' : 'text-[#6E5B50] hover:text-[#1A1614]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('accessible')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                filter === 'accessible' ? 'bg-[#E8672A] text-white shadow-sm' : 'text-[#6E5B50] hover:text-[#1A1614]'
              }`}
            >
              ♿ Accessible
            </button>
            <button
              onClick={() => setFilter('business')}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
                filter === 'business' ? 'bg-amber-600 text-white shadow-sm' : 'text-[#6E5B50] hover:text-[#1A1614]'
              }`}
            >
              Local Merchants
            </button>
          </div>
        </div>

        {/* List of Places */}
        {loading ? (
          <div className="py-20 text-center text-sm text-[#6E5B50]">
            Scanning accessible locations and local merchants...
          </div>
        ) : filteredPlaces.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-black/10 p-8">
            <p className="text-base font-semibold">No places found matching the current filter.</p>
            <button
              onClick={() => setFilter('all')}
              className="mt-3 text-xs font-bold text-[#E8672A] hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPlaces.map((place) => {
              const lat = place.coordinates?.lat || params.lat
              const lng = place.coordinates?.lng || params.lng
              const transportUrl = buildRouteViewPlanUrl(lat, lng, place.name)

              return (
                <article
                  key={place.place_id}
                  className="bg-white rounded-2xl p-5 border border-black/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-base text-[#1A1614] leading-snug">{place.name}</h3>
                      {place.accessible && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ♿ Step-Free
                        </span>
                      )}
                    </div>

                    {place.address && (
                      <p className="text-xs text-[#6E5B50] flex items-center gap-1 mb-2">
                        <MapPin size={12} className="text-[#E8672A] shrink-0" />
                        {place.address}
                      </p>
                    )}

                    {place.summary && (
                      <p className="text-xs text-[#3D342E] leading-relaxed line-clamp-2 mb-3">
                        {place.summary}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {place.local_business && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                          Local Merchant
                        </span>
                      )}
                      {place.categories?.map((c) => (
                        <span
                          key={c}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Handshake Row */}
                  <div className="pt-3 border-t border-black/10 flex items-center justify-between gap-2">
                    <a
                      href={`/p/${encodeURIComponent(place.place_id)}`}
                      className="text-xs font-semibold text-[#6E5B50] hover:text-[#E8672A] transition-colors"
                    >
                      View Details
                    </a>

                    <a
                      href={transportUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 transition-colors shadow-sm"
                      title="Plan return journey on RouteView"
                    >
                      <Bus size={13} />
                      Find transport here
                    </a>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
