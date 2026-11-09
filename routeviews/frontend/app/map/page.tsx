'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const LiveMap = dynamic(() => import('@/components/LiveMap'), { ssr: false });

type MapStyle = 'streets' | 'satellite';

export default function MapPage() {
  const { lang } = useI18n();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routeOverlays, setRouteOverlays] = useState<any[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [routeFilter, setRouteFilter] = useState<number | 'all'>('all');
  const [query, setQuery] = useState('');
  const [mapStyle, setMapStyle] = useState<MapStyle>('streets');

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [followUser, setFollowUser] = useState(false);
  const [geoState, setGeoState] = useState<'idle' | 'pending' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);

  const [arrival, setArrival] = useState<any | null>(null);
  const [arrivalBusy, setArrivalBusy] = useState(false);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const watchRef = useRef<number | null>(null);

  /* ---- Load routes + their stops once ---- */
  useEffect(() => {
    (async () => {
      try {
        const { routes } = await api.listRoutes();
        const detailed = await Promise.all(
          routes.map((r: any) =>
            api.getRoute(r.id)
              .then((d: any) => ({
                id: r.id,
                code: r.code,
                color: r.color_hex,
                stops: d.stops.map((s: any) => ({
                  id: s.id,
                  code: s.code,
                  name_en: s.name_en,
                  name_rw: s.name_rw,
                  lat: Number(s.lat),
                  lng: Number(s.lng),
                })),
              }))
              .catch(() => null)
          )
        );
        setRouteOverlays(detailed.filter(Boolean));
      } catch { /* ignore */ }
    })();
  }, []);

  /* ---- Poll vehicles every 3s ---- */
  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await api.vehicles();
        if (cancelled) return;
        setVehicles(r.vehicles);
        setLastUpdate(new Date());
        setVehiclesLoaded(true);
        setSelected((cur: any) =>
          cur ? r.vehicles.find((v: any) => v.vehicle_id === cur.vehicle_id) || cur : null
        );
      } catch { /* ignore */ }
    };
    tick();
    const id = setInterval(tick, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  /* ---- Cleanup geolocation on unmount ---- */
  useEffect(() => {
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  function toggleUserLocation() {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
      setUserLocation(null);
      setFollowUser(false);
      setGeoState('idle');
      setGeoError(null);
      return;
    }
    if (!('geolocation' in navigator)) {
      setGeoState('unsupported');
      setGeoError(t('Mudasobwa ntishyigikira location.', 'Your browser does not support geolocation.'));
      return;
    }
    setGeoState('pending');
    setGeoError(null);
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoState('granted');
        setFollowUser(true);
      },
      (err) => {
        setGeoState('denied');
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? t('Wanzeho uruhushya rwo kumenya aho uri.', 'You denied location permission.')
            : err.message
        );
        if (watchRef.current != null) {
          navigator.geolocation.clearWatch(watchRef.current);
          watchRef.current = null;
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = vehicles;
    if (routeFilter !== 'all') list = list.filter((v) => v.route_id === routeFilter);
    if (needle) {
      list = list.filter((v) =>
        `${v.plate} ${v.label} ${v.route_code} ${v.next_stop?.name_en || ''} ${v.destination?.name_en || ''}`
          .toLowerCase()
          .includes(needle)
      );
    }
    return list;
  }, [vehicles, routeFilter, query]);

  const visibleOverlays = useMemo(() => {
    if (routeFilter === 'all') return routeOverlays;
    return routeOverlays.filter((r) => r.id === routeFilter);
  }, [routeOverlays, routeFilter]);

  const selectedOverlay = useMemo(() => {
    if (!selected?.route_id) return null;
    const found = routeOverlays.find((r) => r.id === selected.route_id);
    return found ? { ...found, color: selected.color_hex } : null;
  }, [selected, routeOverlays]);

  useEffect(() => {
    if (!selected?.vehicle_id || !selected?.next_stop?.id) {
      setArrival(null);
      return;
    }
    setArrivalBusy(true);
    api
      .arrival(selected.vehicle_id, selected.next_stop.id)
      .then(setArrival)
      .catch(() => setArrival(null))
      .finally(() => setArrivalBusy(false));
  }, [selected?.vehicle_id, selected?.next_stop?.id]);

  return (
    // ADDED w-full HERE to fix the shrinking issue caused by the flex parent layout
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
      {/* ---------------- Header ---------------- */}
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {t('Ikarita y’ibihe nyacyo', 'Live map')}
          </h1>
          <p className="mt-1 text-xs text-ink-100">
            {lastUpdate ? `${t('Byavuguruwe', 'Updated')} ${lastUpdate.toLocaleTimeString()} · ` : ''}
            <span className={filtered.length > 0 ? 'font-medium text-teal-700' : ''}>
              {filtered.length}{' '}
              {t(
                filtered.length === 1 ? 'bisi ku ikarita' : 'bisi ku ikarita',
                filtered.length === 1 ? 'bus on map' : 'buses on map'
              )}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Map style toggle */}
          <div className="inline-flex rounded-pill border border-border bg-surface p-0.5">
            <button
              onClick={() => setMapStyle('streets')}
              className={`rounded-pill px-3.5 py-1.5 text-[11px] font-semibold transition ${
                mapStyle === 'streets'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-ink-100 hover:text-ink'
              }`}
            >
              {t('Ikarita', 'Streets')}
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`rounded-pill px-3.5 py-1.5 text-[11px] font-semibold transition ${
                mapStyle === 'satellite'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-ink-100 hover:text-ink'
              }`}
            >
              {t('Satellite', 'Satellite')}
            </button>
          </div>

          {/* My location toggle */}
          <button
            onClick={toggleUserLocation}
            className={`inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-2 text-xs font-semibold transition ${
              geoState === 'granted'
                ? 'border-electric/30 bg-electric/10 text-electric-700'
                : geoState === 'pending'
                ? 'border-border bg-surface text-ink-100'
                : 'border-border bg-surface text-ink hover:border-border-strong'
            }`}
          >
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
            </svg>
            {geoState === 'granted'
              ? t('Hagarika', 'Stop tracking')
              : geoState === 'pending'
              ? t('Turashaka…', 'Locating…')
              : t('Aho ndi', 'My location')}
          </button>
        </div>
      </header>

      {geoError && (
        <div className="rounded-card border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {geoError}
        </div>
      )}

      {/* ---------------- Filters ---------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('Shakisha bisi, ingendo, ahantu…', 'Search buses, routes, stops…')}
          className="min-w-[200px] flex-1 rounded-pill border border-border bg-surface px-4 py-2 text-sm text-ink transition focus:border-electric focus:outline-none focus:shadow-focus"
        />
        <select
          value={routeFilter === 'all' ? 'all' : String(routeFilter)}
          onChange={(e) => setRouteFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-pill border border-border bg-surface px-3.5 py-2 text-sm text-ink transition focus:border-electric focus:outline-none focus:shadow-focus"
        >
          <option value="all">{t('Ingendo zose', 'All routes')}</option>
          {routeOverlays.map((r) => (
            <option key={r.id} value={r.id}>{r.code}</option>
          ))}
        </select>
      </div>

      {/* ---------------- Layout ---------------- */}
      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        {/* ---- Map (order 1 on mobile, order 2 on desktop) ---- */}
        <div className="order-1 lg:order-2 h-[420px] sm:h-[520px] lg:h-[calc(100vh-260px)] lg:min-h-[600px] rounded-card overflow-hidden">
          <LiveMap
            vehicles={filtered}
            routeOverlays={selectedOverlay ? [selectedOverlay] : visibleOverlays}
            selectedVehicleId={selected?.vehicle_id ?? null}
            onSelectVehicle={(v) => setSelected(v)}
            userLocation={userLocation}
            followUser={followUser}
            showAllRoutes
            mapStyle={mapStyle}
          />
        </div>

        {/* ---- Sidebar (order 2 on mobile, order 1 on desktop) ---- */}
        <aside className="order-2 lg:order-1 space-y-3">
          {/* Selected vehicle card */}
          {selected && (
            <Card className="border-2" style={{ borderColor: selected.color_hex }}>
              <CardBody className="pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-7 min-w-[38px] items-center justify-center rounded-lg px-2 text-xs font-bold text-white"
                        style={{ backgroundColor: selected.color_hex }}
                      >
                        {selected.route_code}
                      </span>
                      <p className="truncate font-semibold text-ink">{selected.plate}</p>
                    </div>
                    <p className="mt-1 text-xs text-ink-100">{selected.label}</p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-ink-100 hover:text-ink text-lg leading-none px-1"
                    aria-label={t('Funga', 'Close')}
                  >
                    ✕
                  </button>
                </div>

                {/* Source badge — unmissable */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selected.simulated ? (
                    <>
                      <Badge tone="simulated">
                        {t('Ikigereranyo', 'Simulated')}
                      </Badge>
                      <span className="text-[11px] text-ink-100 self-center">
                        {t('Iyi bisi ntabwo ari iy’ukuri kuri ubu.', 'This position is not a physical bus.')}
                      </span>
                    </>
                  ) : (
                    <Badge tone="success">{t('GPS · nyayo', 'GPS · live')}</Badge>
                  )}
                </div>

                {/* Occupancy */}
                <div className="mt-4">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="font-medium text-ink-100">{t('Abagenzi', 'Passengers')}</span>
                    <span className="font-semibold text-ink">
                      {selected.passengers} / {selected.capacity}
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-canvas">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round((selected.passengers / selected.capacity) * 100)}%`,
                        backgroundColor:
                          selected.passengers / selected.capacity > 0.85
                            ? '#F59E0B'
                            : selected.passengers / selected.capacity > 0.6
                            ? '#2563EB'
                            : '#0F9D91',
                      }}
                    />
                  </div>
                </div>

                <dl className="mt-4 space-y-2 text-xs">
                  {selected.prev_stop && (
                    <Row label={t('Kuva', 'From')} value={selected.prev_stop.name_en} muted />
                  )}
                  {selected.next_stop && (
                    <Row label={t('Akurikira', 'Next stop')} value={selected.next_stop.name_en} />
                  )}
                  {selected.destination && (
                    <Row label={t('Aho ijya', 'Destination')} value={selected.destination.name_en} />
                  )}
                  {selected.speed_kmh != null && (
                    <Row label={t('Umuvuduko', 'Speed')} value={`${Math.round(selected.speed_kmh)} km/h`} />
                  )}
                </dl>

                {/* Arrival estimate */}
                <div className="mt-4 rounded-card border border-border bg-canvas p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-100">
                    {t('Igihe kizagera', 'Arrival estimate')}
                  </p>
                  {arrivalBusy && (
                    <p className="mt-1 text-xs text-ink-100">{t('Bibarwa…', 'Predicting…')}</p>
                  )}
                  {!arrivalBusy && arrival && (
                    <>
                      <p className="mt-1 text-2xl font-bold text-ink">
                        {Math.max(1, Math.round(arrival.seconds / 60))}
                        <span className="ml-1 text-sm font-normal text-ink-100">
                          {t('min', 'min')}
                        </span>
                      </p>
                      <p className="mt-0.5 text-[10px] text-ink-100">
                        {arrival.source === 'model'
                          ? `${t('Moderi yacu', 'ML model')} v${arrival.model_version}`
                          : t('Ibarwa ry’igihe gito', 'Physics fallback')}
                      </p>
                    </>
                  )}
                  {!arrivalBusy && !arrival && (
                    <p className="mt-1 text-xs text-ink-100">{t('Nta makuru', 'No data')}</p>
                  )}
                </div>

                <Link href={`/routes/${selected.route_id}`} className="mt-4 block">
                  <Button variant="secondary" size="sm" className="w-full">
                    {t('Reba iyi nzira', 'View this route')} →
                  </Button>
                </Link>
              </CardBody>
            </Card>
          )}

          {/* Vehicle list */}
          <Card>
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-100">
                {t('Bisi kuri ikarita', 'Buses on map')}
              </p>
              <Badge tone="success">{filtered.length}</Badge>
            </div>

            {!vehiclesLoaded && (
              <div className="space-y-2 p-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-canvas" />
                ))}
              </div>
            )}

            {vehiclesLoaded && filtered.length === 0 && (
              <div className="p-5 text-center text-xs text-ink-100">
                <p className="font-medium text-ink">{t('Nta bisi ibonetse.', 'No buses match.')}</p>
                <p className="mt-1">
                  {t('Bisi zigenda gutangira kugaragara.', 'Buses will appear shortly.')}
                </p>
              </div>
            )}

            <ul className="max-h-[420px] divide-y divide-border overflow-auto">
              {filtered.map((v) => (
                <li key={v.vehicle_id}>
                  <button
                    onClick={() => setSelected(v)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition ${
                      selected?.vehicle_id === v.vehicle_id
                        ? 'bg-canvas'
                        : 'hover:bg-canvas/60'
                    }`}
                  >
                    <span
                      className="flex h-7 min-w-[38px] items-center justify-center rounded-lg px-2 text-[10px] font-bold text-white"
                      style={{ backgroundColor: v.color_hex }}
                    >
                      {v.route_code}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{v.plate}</p>
                      <p className="truncate text-[11px] text-ink-100">
                        {v.next_stop
                          ? `${t('Kuri', 'Next')} ${v.next_stop.name_en}`
                          : v.label}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] font-semibold text-ink">
                        {v.passengers}/{v.capacity}
                      </span>
                      <Badge tone={v.simulated ? 'simulated' : 'success'} className="text-[9px] py-0 px-1.5">
                        {v.simulated ? t('sim', 'sim') : 'GPS'}
                      </Badge>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>
    </div>
  );
}

/* ---------------- Small helpers ---------------- */

function Row({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="flex-shrink-0 text-[10px] uppercase tracking-widest text-ink-100">{label}</dt>
      <dd className={`truncate text-right font-medium ${muted ? 'text-ink-100' : 'text-ink'}`}>
        {value}
      </dd>
    </div>
  );
}