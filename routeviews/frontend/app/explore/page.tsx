'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { placesApi, Place } from '@/lib/placesApi';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const PlacesMap = dynamic(() => import('@/components/PlacesMap'), { ssr: false });

export default function ExplorePage() {
  const { lang } = useI18n();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);

  const [q, setQ] = useState('');
  const [category, setCategory] = useState<string>('');
  const [accessibleOnly, setAccessibleOnly] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');

  useEffect(() => {
    placesApi.listCategories().then((r) => setCategories(r.categories)).catch(() => {});
  }, []);

  const runSearch = async (coords?: { lat: number; lng: number } | null) => {
    setLoading(true);
    setErr(null);
    try {
      const r = await placesApi.search({
        q: q.trim() || undefined,
        category: category || undefined,
        lat: coords?.lat ?? userLoc?.lat,
        lng: coords?.lng ?? userLoc?.lng,
        radius_m: coords || userLoc ? 10000 : undefined,
        accessible_only: accessibleOnly || undefined,
        limit: 40,
      });
      setPlaces(r.places);
      setSelected(r.places[0] || null);
    } catch (e: any) {
      setErr(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setErr(t('Mudasobwa ntishyigikira location.', 'Geolocation not supported.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        runSearch(loc);
      },
      (e) => setErr(e.message),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  useEffect(() => {
    runSearch(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Only place objects with valid numbers may reach the map.
  const safePlaces = useMemo(
    () => places.filter((p) =>
      typeof p.lat === 'number' && typeof p.lng === 'number' &&
      Number.isFinite(p.lat) && Number.isFinite(p.lng)
    ),
    [places]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {t('Shakisha ahantu', 'Explore places')}
          </h1>
          <p className="mt-1 text-xs text-ink-100 max-w-2xl">
            {t(
              'Shakisha ahantu, ubone uko hagerwaho, kandi urebe amakuru y’ubushobozi.',
              'Search places, see how to reach them, and check accessibility information.'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-pill border border-border bg-surface p-0.5">
            <button
              onClick={() => setMapStyle('streets')}
              className={`rounded-pill px-3.5 py-1.5 text-[11px] font-semibold transition ${
                mapStyle === 'streets' ? 'bg-navy text-white' : 'text-ink-100 hover:text-ink'
              }`}
            >
              {t('Ikarita', 'Streets')}
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`rounded-pill px-3.5 py-1.5 text-[11px] font-semibold transition ${
                mapStyle === 'satellite' ? 'bg-navy text-white' : 'text-ink-100 hover:text-ink'
              }`}
            >
              {t('Satellite', 'Satellite')}
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={useMyLocation}>
            {t('Aho ndi', 'Near me')}
          </Button>
          <Link href="/submit-place">
            <Button variant="ai" size="sm">
              {t('Ongeraho ahantu', 'Add a place')}
            </Button>
          </Link>
        </div>
      </header>

      {err && (
        <div className="rounded-card border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger-600">
          {err}
        </div>
      )}

      <Card>
        <CardBody className="pt-5 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && runSearch()}
              placeholder={t('Shakisha izina, ubwoko, ibicuruzwa…', 'Search name, category, service…')}
              className="flex-1 rounded-pill border border-border bg-surface px-4 py-2.5 text-sm text-ink focus:border-electric focus:outline-none focus:shadow-focus"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-pill border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-electric focus:outline-none focus:shadow-focus"
            >
              <option value="">{t('Byose', 'All categories')}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <Button onClick={() => runSearch()} disabled={loading} variant="primary">
              {loading ? t('Turashakisha…', 'Searching…') : t('Shakisha', 'Search')}
            </Button>
          </div>

          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer select-none">
            <input
              type="checkbox"
              checked={accessibleOnly}
              onChange={(e) => setAccessibleOnly(e.target.checked)}
            />
            {t(
              'Erekana gusa ahantu hagenzuwe ko hafasha abafite ubumuga',
              'Only show places with verified wheelchair accessibility'
            )}
          </label>
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="order-2 lg:order-1 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-ink-100">
              {safePlaces.length} {t('ahantu', 'places')}
            </p>
          </div>
          {safePlaces.length === 0 && !loading && (
            <Card>
              <CardBody className="py-10 text-center text-sm text-ink-100">
                {t('Nta hantu habonetse. Gerageza ukoreshe ijambo rindi.', 'No places found. Try another search.')}
              </CardBody>
            </Card>
          )}
          <ul className="space-y-2 max-h-[calc(100vh-320px)] overflow-auto">
            {safePlaces.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelected(p)}
                  className={`w-full text-left rounded-card border transition ${
                    selected?.id === p.id
                      ? 'border-teal bg-teal/5'
                      : 'border-border bg-surface hover:border-border-strong'
                  } px-4 py-3`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {lang === 'rw' && p.name_rw ? p.name_rw : p.name}
                      </p>
                      <p className="truncate text-[11px] text-ink-100">
                        {p.category}
                        {p.distance_m != null && ` · ${formatDist(p.distance_m)}`}
                      </p>
                    </div>
                    <AccessBadge status={p.accessibility.status} lang={lang} compact />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="order-1 lg:order-2 space-y-3">
          <div className="h-[420px] lg:h-[calc(100vh-460px)] lg:min-h-[400px] rounded-card overflow-hidden">
            <PlacesMap
              userLocation={userLoc}
              places={safePlaces.map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                lat: p.lat,
                lng: p.lng,
              }))}
              selectedPlace={selected}
              onSelectPlace={(p: any) => {
                const found = safePlaces.find((x) => x.id === p.id);
                if (found) setSelected(found);
              }}
              mapStyle={mapStyle}
            />
          </div>

          {selected && (
            <Card>
              <CardBody className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-ink">
                      {lang === 'rw' && selected.name_rw ? selected.name_rw : selected.name}
                    </h2>
                    <p className="text-xs text-ink-100 mt-0.5">
                      {selected.category}
                      {selected.distance_m != null && ` · ${formatDist(selected.distance_m)}`}
                    </p>
                  </div>
                  <AccessBadge status={selected.accessibility.status} lang={lang} />
                </div>

                {selected.description && (
                  <p className="text-sm text-ink mt-3 leading-relaxed">{selected.description}</p>
                )}

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  {selected.address && (
                    <Detail label={t('Aderesi', 'Address')} value={selected.address} />
                  )}
                  {selected.phone && (
                    <Detail label={t('Telefone', 'Phone')} value={selected.phone} />
                  )}
                  {selected.opening_hours && (
                    <Detail label={t('Amasaha', 'Hours')} value={selected.opening_hours} />
                  )}
                  <Detail
                    label={t('Aho gikomoka', 'Source')}
                    value={
                      selected.source === 'osm' ? 'OpenStreetMap'
                      : selected.source === 'community' ? t('Umuryango', 'Community')
                      : selected.source === 'business' ? t('Nyir’ubucuruzi', 'Business')
                      : selected.source === 'seed' ? t('Urugero', 'Sample')
                      : selected.source
                    }
                  />
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/place/${selected.id}`}>
                    <Button variant="outline" size="sm">{t('Reba byose', 'Full details')}</Button>
                  </Link>
                  <Link
                    href={`/plan?to_lat=${selected.lat}&to_lng=${selected.lng}`}
                  >
                    <Button variant="primary" size="sm">
                      {t('Tegura urugendo', 'Plan journey')}
                    </Button>
                  </Link>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`}
                    target="_blank" rel="noreferrer"
                  >
                    <Button variant="secondary" size="sm">{t('Fungura navigation', 'Navigate')}</Button>
                  </a>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function AccessBadge({ status, lang, compact }: { status: string; lang: string; compact?: boolean }) {
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);
  if (status === 'accessible') {
    return <Badge tone="success" className={compact ? 'text-[9px]' : ''}>
      {compact ? '♿' : t('Ubushobozi bwemejwe', 'Accessible · verified')}
    </Badge>;
  }
  if (status === 'not_accessible') {
    return <Badge tone="neutral" className={compact ? 'text-[9px]' : ''}>
      {compact ? '—' : t('Ntibafasha', 'Not accessible')}
    </Badge>;
  }
  return <Badge tone="warning" className={compact ? 'text-[9px]' : ''}>
    {compact ? '?' : t('Ubushobozi ntibuzwi', 'Accessibility unknown')}
  </Badge>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-ink-100">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

function formatDist(m: number) {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}