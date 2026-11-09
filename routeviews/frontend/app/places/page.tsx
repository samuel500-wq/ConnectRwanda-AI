'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { placesApi } from '@/lib/placesApi';
import { useI18n } from '@/lib/i18n';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const PlacesMap = dynamic(() => import('@/components/PlacesMap'), { ssr: false });

type Msg = { role: 'user' | 'assistant'; content: string; isTyping?: boolean };
type Place = any;
type Coords = { lat: number; lng: number; accuracy?: number };

// Local detection for "near me" queries
const NEAR_ME_PATTERNS = [
  'near me', 'nearby', 'close by', 'around here', 'around me', 'in my area',
  'near here', 'near my location', 'nearby me', 'close to me',
  'hafi yanjye', 'hafi yacu', 'ho hafi', 'biri hafi', 'hafi aha',
];

function wantsNearMe(text: string): boolean {
  const t = text.toLowerCase();
  return NEAR_ME_PATTERNS.some((p) => t.includes(p));
}

const PRICE_HINTS: Record<string, { min: number; max: number; labelEn: string; labelRw: string }> = {
  restaurant: { min: 3000, max: 8000, labelEn: 'Meals typically 3,000–8,000 RWF', labelRw: 'Ibiryo bisanzwe 3,000–8,000 RWF' },
  cafe:       { min: 1500, max: 4000, labelEn: 'Coffee & snacks 1,500–4,000 RWF', labelRw: 'Ikawa n’ibiryo bishya 1,500–4,000 RWF' },
  fast_food:  { min: 2000, max: 5000, labelEn: 'Fast food 2,000–5,000 RWF', labelRw: 'Ibiryo byihuse 2,000–5,000 RWF' },
  bar:        { min: 2000, max: 6000, labelEn: 'Drinks & snacks 2,000–6,000 RWF', labelRw: 'Ibinyobwa n’ibiryo 2,000–6,000 RWF' },
  pharmacy:   { min: 1000, max: 5000, labelEn: 'Pharmacy items 1,000–5,000 RWF', labelRw: 'Imiti 1,000–5,000 RWF' },
  supermarket:{ min: 500,  max: 20000, labelEn: 'Groceries 500–20,000 RWF', labelRw: 'Ibiribwa 500–20,000 RWF' },
};

function intentToKeyword(text: string): string {
  const t = text.toLowerCase();
  if (/eat|food|restaurant|meal|ibiryo|resitora|kurya/.test(t)) return 'restaurant';
  if (/coffee|cafe|ikawa/.test(t)) return 'cafe';
  if (/pharmac|imiti|drug/.test(t)) return 'pharmacy';
  if (/supermarket|grocer|isoko|ibicuruzwa/.test(t)) return 'supermarket';
  if (/bank|atm|amafaranga|banki/.test(t)) return 'bank';
  if (/fuel|petrol|essence|mazutu/.test(t)) return 'fuel';
  if (/hotel|icumbi/.test(t)) return 'hotel';
  if (/hospital|clinic|ivuriro|bitaro/.test(t)) return 'hospital';
  return 'restaurant';
}

export default function PlacesPage() {
  const { lang } = useI18n();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [geoState, setGeoState] = useState<'idle' | 'pending' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [geoError, setGeoError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coords | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [autoResuming, setAutoResuming] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);
  const watchRef = useRef<number | null>(null);

  const needsLocationRef = useRef(false);
  const lastUserMessageRef = useRef<string | null>(null);
  const messagesRef = useRef<Msg[]>([]);

  useEffect(() => { needsLocationRef.current = needsLocation; }, [needsLocation]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, busy, autoResuming]);

  useEffect(() => {
    return () => {
      if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  /* ---------------- Manual fallback (no AI needed) ---------------- */
  async function manualSearch(query: string, coords?: Coords | null) {
    const keyword = intentToKeyword(query);
    const loc = coords ?? userLocation;
    setBusy(true);
    try {
      const r = await placesApi.search({
        q: keyword,
        lat: loc?.lat,
        lng: loc?.lng,
        radius_m: loc ? 5000 : undefined,
        limit: 15,
      });
      const results = (r.places ?? []).slice(0, 10);
      setPlaces(results);
      setSelectedPlace(results[0] ?? null);
      setSource('manual');
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: results.length > 0
            ? t(`Nabonye ahantu ${results.length} hafi yawe. Reba ibi hakurikira.`, `I found ${results.length} places near you. Here they are.`)
            : t('Nta hantu nabonye hafi yawe. Gerageza kwagura intera cyangwa ubwoko.', 'No places found nearby. Try widening the search.'),
        },
      ]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${e?.message || 'Search failed'}` }]);
    } finally {
      setBusy(false);
    }
  }

  /* ---------------- Main send (AI first, fallback to manual) ---------------- */
  async function send(text?: string, locationOverride?: Coords | null) {
    const message = (text ?? input).trim();
    if (!message || busy) return;

    setInput('');
    setBusy(true);
    setAutoResuming(false);

    lastUserMessageRef.current = message;
    const nextHistory: Msg[] = [...messagesRef.current, { role: 'user', content: message }];
    setMessages(nextHistory);

    // Append AI typing indicator
    const aiMsgId = Date.now().toString();
    setMessages((m) => [...m, { id: aiMsgId, role: 'assistant', content: '', isTyping: true } as any]);

    const loc = locationOverride !== undefined ? locationOverride : userLocation;
    if (!loc && wantsNearMe(message)) {
      setNeedsLocation(true);
      needsLocationRef.current = true;
    }

    try {
      const r = await api.placesChat({
        message,
        lang,
        history: messagesRef.current.slice(-6),
        userLocation: loc,
      });

      // Replace typing indicator with actual reply
      setMessages((m) => m.map(msg => (msg as any).id === aiMsgId ? { ...msg, isTyping: false, content: r.reply } : msg));

      if (r.action === 'request_location') {
        setNeedsLocation(true);
        needsLocationRef.current = true;
      } else {
        setNeedsLocation(false);
        needsLocationRef.current = false;
      }

      if (r.action === 'show_places' && Array.isArray(r.places) && r.places.length > 0) {
        setPlaces(r.places);
        setSelectedPlace(r.places[0] || null);
        setSource(r.source || null);
      } else if (!loc && wantsNearMe(message)) {
        // AI didn't return places and we have no location — leave CTA up.
      } else if (loc) {
        // AI didn't return places but we have a location → manual fallback.
        await manualSearch(message, loc);
      }
    } catch (e: any) {
      const detail = e?.message || 'AI unavailable';
      setMessages((m) => m.map(msg => (msg as any).id === aiMsgId ? { ...msg, isTyping: false, content: `Error: ${detail}` } : msg));

      if (loc) {
        await manualSearch(message, loc);
      } else {
        if (wantsNearMe(message)) {
          setNeedsLocation(true);
          needsLocationRef.current = true;
        }
      }
    } finally {
      setBusy(false);
      setAutoResuming(false);
    }
  }

  /* ---------------- Location handling ---------------- */
  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setGeoState('unsupported');
      setGeoError(t('Mudasobwa ntishyigikira location.', 'Geolocation not supported.'));
      return;
    }
    setGeoState('pending');
    setGeoError(null);
    if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current);

    let hasAutoResumed = false;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc: Coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        };
        setUserLocation(loc);
        setGeoState('granted');

        if (!hasAutoResumed && needsLocationRef.current && lastUserMessageRef.current) {
          hasAutoResumed = true;
          setNeedsLocation(false);
          needsLocationRef.current = false;
          setAutoResuming(true);
          setTimeout(() => {
            send(lastUserMessageRef.current!, loc);
          }, 350);
        }
      },
      (err) => {
        setGeoState('denied');
        setGeoError(err.message || 'Location permission denied.');
        if (watchRef.current != null) {
          navigator.geolocation.clearWatch(watchRef.current);
          watchRef.current = null;
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  }

  const suggestions = useMemo(
    () =>
      lang === 'rw'
        ? ['Nshaka aho ndya hafi yanjye', 'Resitora iri hafi', 'Nshaka kugura imiti', 'ATM iri hafi', 'Supermarket iri hafi']
        : ['Where can I eat near me?', 'Any restaurants nearby?', 'Find a pharmacy close to me', 'Nearest ATM', 'Supermarket near me'],
    [lang]
  );

  const needsLocationCTA = needsLocation && geoState !== 'pending' && !busy && !autoResuming && geoState !== 'granted';

  /* ---------------- Render ---------------- */
  return (
    <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {t('Shakisha ahantu', 'Find places')}
          </h1>
          <p className="mt-1 text-xs text-ink-100 max-w-2xl">
            {t('Baza umufasha mu magambo yawe. Ahawe location yawe, aguha ahantu hafi yawe n’uburyo bwo kuhagera n’ibiciro.', 'Ask the assistant in your own words. Share your location and get nearby places with transport options and prices.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-pill border border-border bg-surface p-0.5">
            <button onClick={() => setMapStyle('streets')} className={`rounded-pill px-3.5 py-1.5 text-[11px] font-semibold transition ${mapStyle === 'streets' ? 'bg-navy text-white shadow-sm' : 'text-ink-100 hover:text-ink'}`}>
              {t('Ikarita', 'Streets')}
            </button>
            <button onClick={() => setMapStyle('satellite')} className={`rounded-pill px-3.5 py-1.5 text-[11px] font-semibold transition ${mapStyle === 'satellite' ? 'bg-navy text-white shadow-sm' : 'text-ink-100 hover:text-ink'}`}>
              {t('Satellite', 'Satellite')}
            </button>
          </div>

          <button onClick={requestLocation} className={`inline-flex items-center gap-1.5 rounded-pill border px-3.5 py-2 text-xs font-semibold transition ${geoState === 'granted' ? 'border-electric/30 bg-electric/10 text-electric-700' : geoState === 'pending' ? 'border-border bg-surface text-ink-100' : 'border-border bg-surface text-ink hover:border-border-strong'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
            {geoState === 'granted' ? t('Aho ndi ✓', 'Location on') : geoState === 'pending' ? t('Turashaka…', 'Locating…') : t('Aho ndi', 'My location')}
          </button>
        </div>
      </header>

      {geoError && <div className="rounded-card border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">{geoError}</div>}

      <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
        {/* Chat panel */}
        <Card className="order-1 lg:order-1 flex flex-col overflow-hidden h-[72vh] min-h-[440px] lg:h-[calc(100vh-260px)] lg:min-h-[560px]">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3 bg-[#0F172A]">
            <span className="inline-flex h-2 w-2 rounded-full bg-teal animate-pulse" />
            <p className="text-sm font-bold text-white">{t('Umufasha w’ahantu', 'Place assistant')}</p>
            <Badge tone="ai" className="ml-auto text-[9px] py-0.5 px-2">AI</Badge>
          </div>

          <div ref={chatRef} className="flex-1 space-y-4 overflow-auto p-4 bg-[#0B1120]">
            {messages.length === 0 && (
              <div className="rounded-xl border border-slate-700 bg-[#1E293B] p-4 text-sm text-slate-200">
                <p className="font-bold text-white mb-1">{t('Murakaza neza 👋', 'Welcome 👋')}</p>
                <p className="text-xs leading-relaxed text-slate-400">
                  {t('Baza ikintu ushaka (ibiryo, imiti, banki…) hanyuma unyereke aho uri.', 'Ask what you need (food, pharmacy, bank…) then share your location.')}
                </p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${m.role === 'user' ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-[#1E293B] text-slate-200 border border-slate-700 rounded-bl-none'}`}>
                  {m.isTyping ? (
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></div>
                    </div>
                  ) : (
                    <div className="leading-relaxed whitespace-pre-wrap">
                      {m.content.split('\n').map((line, idx) => (
                        <p key={idx} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>') }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {needsLocationCTA && (
              <button onClick={requestLocation} className="w-full rounded-xl border-2 border-dashed border-cyan-500/40 bg-cyan-500/5 px-4 py-4 text-left transition hover:border-cyan-500 hover:bg-cyan-500/10">
                <div className="flex items-center gap-3">
                  <span className="shrink-0 w-10 h-10 rounded-full bg-cyan-500 text-black flex items-center justify-center text-lg shadow-lg">📍</span>
                  <div>
                    <div className="text-sm font-bold text-cyan-400">{t('Kanda hano usangize aho uri', 'Tap to share your location')}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{t('Bikoreshwa gusa gushakisha ahantu hafi yawe', 'Used only to find places near you')}</div>
                  </div>
                </div>
              </button>
            )}

            {needsLocation && geoState === 'pending' && (
              <div className="w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-center text-sm text-cyan-400 font-bold">
                {t('Turashaka aho uri…', 'Getting your location…')}
              </div>
            )}
          </div>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-800 px-3 py-3 bg-[#0F172A]">
              {suggestions.slice(0, 3).map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-700 bg-[#1E293B] px-3 py-1.5 text-[10px] font-medium text-slate-300 transition hover:border-cyan-500 hover:text-cyan-400">
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="border-t border-slate-800 p-3 bg-[#0F172A]">
            <div className="relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                disabled={autoResuming}
                placeholder={autoResuming ? t('Turashakisha…', 'Finding places…') : t('Andika ikintu ushaka…', 'Type what you need…')}
                className="w-full rounded-full border border-slate-700 bg-[#1E293B] px-5 py-3 pr-12 text-sm text-white outline-none transition focus:border-cyan-500 disabled:opacity-60"
              />
              <button onClick={() => send()} disabled={!input.trim() || busy || autoResuming} className="absolute right-2 top-2 bottom-2 w-9 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full flex items-center justify-center font-bold disabled:opacity-50">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
            {source && (
              <p className="mt-2 text-[10px] text-slate-500 text-center">
                {source === 'osm' ? 'Data from OpenStreetMap' : source === 'manual' ? 'Results from local database' : 'Demonstration dataset'}
              </p>
            )}
          </div>
        </Card>

        {/* Map & Results */}
        <div className="order-2 lg:order-2 flex flex-col gap-4">
          <div className="h-[300px] lg:h-[400px] rounded-card overflow-hidden border border-border shadow-sm">
            <PlacesMap
              userLocation={userLocation}
              places={places}
              selectedPlace={selectedPlace}
              onSelectPlace={(p) => setSelectedPlace(p)}
              mapStyle={mapStyle}
            />
          </div>

          {places.length > 0 && !busy && !autoResuming && (
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 pb-4">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {t('Ahantu hafi yawe', 'Nearby places')} · {places.length}
              </p>
              {places.map((p) => (
                <PlaceCard
                  key={p.id}
                  place={p}
                  lang={lang}
                  selected={selectedPlace?.id === p.id}
                  onSelect={() => setSelectedPlace(p)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Place card with transport & price hints ---------------- */

function PlaceCard({ place, lang, selected, onSelect }: any) {
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);
  const [expanded, setExpanded] = useState(false);

  const accessibility: 'verified' | 'not_verified' | 'unknown' =
    place.accessibility === 'verified' ? 'verified'
    : place.accessibility === 'not_verified' ? 'not_verified'
    : place.accessibility?.status === 'accessible' ? 'verified'
    : place.accessibility?.status === 'not_accessible' ? 'not_verified'
    : 'unknown';

  const priceHint = PRICE_HINTS[place.category];

  return (
    <div className={`overflow-hidden rounded-xl border transition-all ${selected ? 'border-cyan-500 ring-2 ring-cyan-500/20 bg-[#1E293B]' : 'border-slate-700 bg-[#0F172A] hover:border-slate-600'}`}>
      <button onClick={onSelect} className="flex w-full items-start gap-4 p-4 text-left">
        <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-lg shadow-inner">
          {categoryEmoji(place.category)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{place.name}</p>
          <p className="truncate text-[11px] text-slate-400 mt-0.5">
            {place.distance_m != null ? `${formatDistance(place.distance_m)} · ` : ''}
            {place.category}
            {priceHint && ` · ${formatPriceRange(priceHint.min, priceHint.max)}`}
          </p>
        </div>
        <svg className={`mt-1 h-5 w-5 flex-shrink-0 text-slate-500 transition ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {(selected || expanded) && (
        <div className="border-t border-slate-700 bg-[#111827] p-4 space-y-4">
          
          <div className="grid gap-3 sm:grid-cols-2">
            {priceHint && (
              <div className="rounded-lg border border-teal-500/20 bg-teal-500/10 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-teal-400">{t('Igiciro gisanzwe', 'Typical prices')}</p>
                <p className="text-sm font-bold text-white mt-0.5">{formatPriceRange(priceHint.min, priceHint.max)}</p>
              </div>
            )}
            
            <div className="rounded-lg border border-slate-700 bg-[#0F172A] px-3 py-2 flex items-center justify-between">
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Access</span>
               <Badge tone={accessibility === 'verified' ? 'success' : accessibility === 'not_verified' ? 'neutral' : 'warning'} className="text-[10px]">
                  {accessibility === 'verified' ? 'Verified' : accessibility === 'not_verified' ? 'Unverified' : 'Unknown'}
               </Badge>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {place.moto && place.moto.fare_rwf != null && (
              <TransportTile icon="🛵" label={t('Moto', 'Moto')} primary={`${Number(place.moto.fare_rwf).toLocaleString()} RWF`} secondary={place.moto.duration_min ? `~${place.moto.duration_min} min` : undefined} tone="electric" />
            )}
            {place.bus && place.bus.fare_rwf != null && (
              <TransportTile icon="🚌" label={t('Bisi', 'Bus')} primary={`${Number(place.bus.fare_rwf).toLocaleString()} RWF`} secondary={place.bus.duration_min ? `~${place.bus.duration_min} min` : undefined} extra={place.bus.route_code ? `Route ${place.bus.route_code}` : undefined} tone="teal" />
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Link href="/plan" className="flex-1">
              <Button variant="secondary" size="sm" className="w-full bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
                {t('Tegura urugendo', 'Plan journey')}
              </Button>
            </Link>
            <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noreferrer" className="flex-1">
              <Button variant="primary" size="sm" className="w-full">
                {t('Fungura', 'Navigate')}
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function TransportTile({ icon, label, primary, secondary, extra, tone }: any) {
  const border = tone === 'electric' ? 'border-cyan-500/20' : 'border-teal-500/20';
  const bg = tone === 'electric' ? 'bg-cyan-500/10' : 'bg-teal-500/10';
  const fg = tone === 'electric' ? 'text-cyan-400' : 'text-teal-400';

  return (
    <div className={`rounded-lg border ${border} ${bg} px-3 py-2.5`}>
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <span className={`text-[10px] font-bold uppercase tracking-wider ${fg}`}>{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold text-white">{primary}</p>
      {secondary && <p className="text-[10px] text-slate-400">{secondary}</p>}
      {extra && <p className="mt-0.5 truncate text-[10px] text-slate-400">{extra}</p>}
    </div>
  );
}

function categoryEmoji(cat: string): string {
  const m: Record<string, string> = {
    restaurant: '🍽️', cafe: '☕', fast_food: '🍔', bar: '🍺',
    supermarket: '🛒', market: '🏪', pharmacy: '💊', hospital: '🏥',
    clinic: '🩺', bank: '🏦', atm: '🏧', fuel: '⛽',
    hotel: '🏨', school: '🎓', university: '🎓',
    place_of_worship: '⛪', government: '🏛️', transport: '🚌',
    electronics: '📱', clothing: '👕', repair: '🔧',
    hardware: '🔨', beauty: '💇', other: '📍',
  };
  return m[cat] || '📍';
}

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

function formatPriceRange(min: number, max: number): string {
  return `${min.toLocaleString()}–${max.toLocaleString()} RWF`;
}