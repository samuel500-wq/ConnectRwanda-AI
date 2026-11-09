'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n';
import { api } from '@/lib/api';
import { placesApi } from '@/lib/placesApi';

interface Stats {
  routes: number;
  stops: number;
  vehicles: number;
  alerts: number;
  places: number;
}

interface PlaceSnippet {
  id: number;
  name: string;
  category: string;
  distance_m: number | null;
}

export default function HomePage() {
  const { lang } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats>({ routes: 0, stops: 0, vehicles: 0, alerts: 0, places: 0 });
  const [recentPlaces, setRecentPlaces] = useState<PlaceSnippet[]>([]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.allSettled([
        api.listRoutes(),
        api.listStops(),
        api.vehicles(),
        api.alerts(),
        placesApi.search({ limit: 6 }),
      ]);
      if (cancelled) return;
      const [routesR, stopsR, vehiclesR, alertsR, placesR] = results;

      const alertsList = alertsR.status === 'fulfilled'
        ? (Array.isArray(alertsR.value) ? alertsR.value : ((alertsR.value as any)?.data ?? (alertsR.value as any)?.alerts ?? []))
        : [];

      setStats({
        routes: routesR.status === 'fulfilled' ? ((routesR.value as any)?.routes?.length ?? 0) : 0,
        stops: stopsR.status === 'fulfilled' ? ((stopsR.value as any)?.stops?.length ?? 0) : 0,
        vehicles: vehiclesR.status === 'fulfilled' ? ((vehiclesR.value as any)?.vehicles?.length ?? 0) : 0,
        alerts: alertsList.length,
        places: placesR.status === 'fulfilled' ? ((placesR.value as any)?.count ?? (placesR.value as any)?.places?.length ?? 0) : 0,
      });
      setAlerts(alertsList.slice(0, 2));

      if (placesR.status === 'fulfilled' && Array.isArray((placesR.value as any)?.places)) {
        setRecentPlaces(
          (placesR.value as any).places.slice(0, 6).map((p: any) => ({
            id: p.id, name: p.name, category: p.category, distance_m: p.distance_m ?? null,
          }))
        );
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayLang = mounted ? lang : 'en';
  const t = (en: string, rw: string) => (displayLang === 'rw' ? rw : en);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    window.location.href = `/plan${qs.toString() ? '?' + qs.toString() : ''}`;
  };

  const networkStats = [
    { key: 'routes', labelEn: 'Routes', labelRw: 'Inzira', value: stats.routes },
    { key: 'stops', labelEn: 'Stops', labelRw: 'Ahantu', value: stats.stops },
    { key: 'vehicles', labelEn: 'Vehicles', labelRw: 'Imodoka', value: stats.vehicles },
    { key: 'places', labelEn: 'Places', labelRw: 'Ahantu hagenzuwe', value: stats.places },
    { key: 'alerts', labelEn: 'Alerts', labelRw: 'Amatangazo', value: stats.alerts },
  ].filter((s) => s.value > 0);

  return (
    <div className="bg-canvas">
      <style>{`
        @keyframes float-y {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-y-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-16px); }
        }
        @keyframes dash-move {
          to { stroke-dashoffset: -24; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>

      {/* ============================================================
          HERO
         ============================================================ */}
      <section className="relative overflow-hidden bg-navy flex items-center min-h-[calc(100vh-4rem)]">
        {/* Background Gradients */}
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            backgroundImage:
              'radial-gradient(50% 50% at 10% 10%, rgba(37,99,235,0.4) 0%, transparent 60%),' +
              'radial-gradient(50% 50% at 90% 90%, rgba(15,157,145,0.4) 0%, transparent 60%)',
          }}
        />
        {/* Grid Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px),' +
              'linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24 w-full">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center">
            
            {/* LEFT COLUMN: Text & Search */}
            <div className="max-w-2xl">
              <Badge tone="ai" className="mb-6 bg-teal/15 text-mint border-teal/40 text-xs py-1 px-3">
                <span className="w-1.5 h-1.5 rounded-full bg-teal mr-1.5 animate-pulse" />
                {t('Built in Rwanda · Kinyarwanda & English', 'Yubatswe mu Rwanda · Ikinyarwanda n’Icyongereza')}
              </Badge>

              <h1 className="text-white text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.05]">
                {t('Move through Rwanda,', 'Genda mu Rwanda,')}
                <span className="block bg-gradient-to-r from-teal via-mint to-electric bg-clip-text text-transparent pb-2">
                  {t('intelligently.', 'mu bwenge.')}
                </span>
              </h1>

              <p className="mt-6 text-white/75 text-base sm:text-lg max-w-xl leading-relaxed">
                {t(
                  'One platform to plan journeys, track vehicles, discover nearby places, and check accessibility — grounded in real transport data, never guessed.',
                  'Urubuga rumwe rwo gutegura ingendo, gukurikirana imodoka, gushakisha ahantu hafi, no kugenzura ubushobozi — hushingiye ku makuru nyayo y’ingendo, ntabwo ari ugutekereza.'
                )}
              </p>

              <form
                onSubmit={onSearch}
                className="mt-8 bg-white/10 backdrop-blur-md rounded-full shadow-lift p-1.5 sm:p-2 flex flex-col sm:flex-row gap-2 max-w-xl border border-white/20"
              >
                <div className="flex-1 flex items-center px-4 bg-white rounded-full">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-100 mr-2 shrink-0">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                  <input
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder={t('From', 'Uva')}
                    className="w-full py-3 text-sm text-ink bg-transparent focus:outline-none placeholder:text-ink-100"
                  />
                </div>
                <div className="flex-1 flex items-center px-4 bg-white rounded-full">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-ink-100 mr-2 shrink-0">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder={t('To', 'Ujya')}
                    className="w-full py-3 text-sm text-ink bg-transparent focus:outline-none placeholder:text-ink-100"
                  />
                </div>
                <Button type="submit" variant="primary" size="lg" className="whitespace-nowrap rounded-full px-8">
                  {t('Plan journey', 'Tegura urugendo')}
                </Button>
              </form>

              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white/60">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal" />
                  {t('Urban & intercity', 'Mu mujyi n’intara')}
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-electric" />
                  {t('AI-grounded answers', 'Ibisubizo by’AI by’ukuri')}
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-mint" />
                  {t('Accessibility-aware', 'Yita ku bushobozi')}
                </span>
              </div>
            </div>

            {/* RIGHT COLUMN: Visuals */}
            <div className="relative hidden lg:flex items-center justify-center h-full min-h-[450px]">
              {/* Glow Effects */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[350px] h-[350px] rounded-full bg-teal/20 blur-[100px]" />
                <div className="w-[250px] h-[250px] rounded-full bg-electric/20 blur-[80px] translate-y-24 translate-x-12" />
              </div>

              {/* Main Mockup Card */}
              <div className="relative z-10 w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-white/40 transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                  
                  {/* Faux Map Graphic */}
                  <div className="h-32 bg-canvas relative overflow-hidden flex items-center justify-center border-b border-border">
                    <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path d="M0,50 Q25,20 50,50 T100,50" fill="none" stroke="#CBD5E1" strokeWidth="2" />
                      <path d="M0,80 L40,40 L80,80 L100,20" fill="none" stroke="#CBD5E1" strokeWidth="1" />
                      <path d="M20,0 L20,100 M60,0 L60,100 M0,60 L100,60" fill="none" stroke="#CBD5E1" strokeWidth="0.5" />
                    </svg>
                    
                    {/* Animated Route Path */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <path
                        d="M15,80 Q30,40 80,20"
                        fill="none"
                        stroke="#2563EB"
                        strokeWidth="3"
                        strokeDasharray="8 6"
                        style={{ animation: 'dash-move 1.5s linear infinite' }}
                      />
                    </svg>

                    {/* Map Pins */}
                    <div className="absolute left-[13%] bottom-[15%] flex items-center justify-center">
                      <div className="absolute w-8 h-8 rounded-full bg-electric/30" style={{ animation: 'pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite' }} />
                      <div className="w-4 h-4 rounded-full bg-electric border-2 border-white shadow" />
                    </div>
                    <div className="absolute right-[18%] top-[18%] w-4 h-4 rounded-full bg-teal border-2 border-white shadow" />
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-[10px] font-bold tracking-widest text-ink-100 uppercase mb-1">Best match</p>
                        <h3 className="text-lg font-bold text-ink leading-tight">Nyabugogo to Kimironko</h3>
                      </div>
                      <span className="px-2.5 py-1 bg-electric text-white text-[10px] font-bold rounded-full shadow-sm">Route 102</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-ink-100">
                      <span className="flex items-center gap-1.5 font-medium">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                        15 min
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                        400 RWF
                      </span>
                      <span className="ml-auto flex items-center gap-1.5 text-teal-700 bg-teal/10 px-2.5 py-1 rounded-full font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
                        Live
                      </span>
                    </div>
                  </div>
                </div>

                {/* Floating Badge 1: AI Agent */}
                <div
                  className="absolute -right-8 -top-6 z-20 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-xl flex items-center gap-3"
                  style={{ animation: 'float-y 4s ease-in-out infinite' }}
                >
                  <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white shadow-inner">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">AI Agent</p>
                    <p className="text-sm font-medium text-white">Fastest route found</p>
                  </div>
                </div>

                {/* Floating Badge 2: Accessibility */}
                <div
                  className="absolute -left-10 bottom-8 z-20 bg-navy/90 backdrop-blur-md border border-white/10 p-3 rounded-2xl shadow-xl flex items-center gap-3"
                  style={{ animation: 'float-y-delayed 5s ease-in-out infinite' }}
                >
                  <div className="w-9 h-9 rounded-full bg-electric flex items-center justify-center text-white text-lg shadow-inner">
                    ♿
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Accessibility</p>
                    <p className="text-sm font-medium text-white">Entrance verified</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================================
          LIVE NETWORK PULSE
         ============================================================ */}
      {networkStats.length > 0 && (
        <section className="relative z-20 -mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-surface border border-border shadow-lift px-5 sm:px-8 py-4 flex flex-wrap items-center gap-y-3 gap-x-6 sm:gap-x-10">
              <div className="flex items-center gap-2 shrink-0">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-widest text-ink-100">
                  {t('Live network', 'Urusobe ruriho')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                {networkStats.map((s) => (
                  <div key={s.key} className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-ink tabular-nums">{s.value}</span>
                    <span className="text-xs text-ink-100">
                      {displayLang === 'rw' ? s.labelRw : s.labelEn}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href="/map"
                className="ml-auto text-sm font-semibold text-electric hover:text-electric-700 inline-flex items-center gap-1"
              >
                {t('Open live map', 'Fungura ikarita')} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          STORY
         ============================================================ */}
      <section className="bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
            <div>
              <Badge tone="info" className="mb-5">
                {t('The idea', 'Igitekerezo')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-ink leading-tight tracking-tight">
                {t('Every morning, Rwanda moves.', 'Buri gitondo, u Rwanda rugenda.')}
              </h2>
              <div className="mt-6 space-y-4 text-base sm:text-lg text-ink-100 leading-relaxed">
                <p>
                  {t(
                    'From the hills of Nyamirambo to the bus park at Nyabugogo, from the busy streets of Remera to the long road north to Musanze — millions of journeys begin every day.',
                    'Kuva ku misozi ya Nyamirambo kugera kuri sitasiyo ya Nyabugogo, kuva mu mihanda ya Remera kugera ku rugendo rurerure rugana Amajyaruguru i Musanze — ingendo miriyoni zitangira buri munsi.'
                  )}
                </p>
                <p>
                  {t(
                    'And with every journey comes a question. Which bus, and when does it come? How do I get there, and how much will it cost? Can the destination actually be reached — by me, with my own needs?',
                    'Kandi kuri buri rugendo haza ikibazo. Ni iyihe modoka, kandi izaza ryari? Nzagerayo nte, kandi bizatwara angahe? Ese aho njya hashobora kugerwa — njyewe, n’ibyo nkeneye?'
                  )}
                </p>
                <p className="text-ink font-medium">
                  {t(
                    'For a person using a wheelchair, for a mother with a stroller, for a visitor who does not speak Kinyarwanda — those questions can feel impossible.',
                    'Ku muntu ukoresha intebe y’ubumuga, ku mubyeyi ufite ikibyimba, ku mushyitsi utavuga Ikinyarwanda — ibyo bibazo bishobora kumera nk’ibitabaho igisubizo.'
                  )}
                </p>
                <p className="text-ink font-semibold text-lg">
                  {t(
                    'ConnectRwanda AI exists to answer them — clearly, honestly, and in the language you speak.',
                    'ConnectRwanda AI ibaho kugira ngo isubize ibyo bibazo — mu buryo bweruye, mu kuri, kandi mu rurimi uvuga.'
                  )}
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-card bg-gradient-to-br from-navy via-navy-700 to-navy-900 p-6 sm:p-8 text-white shadow-lift relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(60% 60% at 90% 10%, rgba(15,157,145,0.5) 0%, transparent 60%)',
                  }}
                />
                <div className="relative">
                  <p className="text-xs uppercase tracking-widest text-white/50 mb-4">
                    {t('One journey, three questions', 'Urugendo rumwe, ibibazo bitatu')}
                  </p>

                  <div className="space-y-3">
                    {[
                      {
                        n: '01',
                        icon: '↗',
                        titleEn: 'Which route?',
                        titleRw: 'Iyihe nzira?',
                        bodyEn: 'Compare time, fare, transfers, and walking side-by-side.',
                        bodyRw: 'Gereranya igihe, amafaranga, guhindura, no kugenda n’amaguru.',
                      },
                      {
                        n: '02',
                        icon: '◷',
                        titleEn: 'When does it come?',
                        titleRw: 'Izaza ryari?',
                        bodyEn: 'Live vehicle positions with clearly labelled source and freshness.',
                        bodyRw: 'Aho imodoka ziri ubu, zigaragara n’aho zikomoka n’igihe.',
                      },
                      {
                        n: '03',
                        icon: '♿',
                        titleEn: 'Can I actually get in?',
                        titleRw: 'Nshobora kwinjira?',
                        bodyEn: 'Accessibility marked as verified, not verified, or unknown — never guessed.',
                        bodyRw: 'Ubushobozi bwerekanyijwe nk’ubwemejwe, butemejwe, cyangwa butazwi — ntabwo buhimbwa.',
                      },
                    ].map((row) => (
                      <div
                        key={row.n}
                        className="flex items-start gap-3 rounded-card bg-white/5 border border-white/10 p-4 hover:bg-white/[0.07] transition"
                      >
                        <div className="shrink-0 w-9 h-9 rounded-lg bg-teal/20 text-mint flex items-center justify-center text-sm font-bold">
                          {row.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[10px] font-mono text-white/40">{row.n}</span>
                            <p className="font-semibold text-white">
                              {displayLang === 'rw' ? row.titleRw : row.titleEn}
                            </p>
                          </div>
                          <p className="text-xs text-white/60 mt-0.5 leading-relaxed">
                            {displayLang === 'rw' ? row.bodyRw : row.bodyEn}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          THREE PILLARS
         ============================================================ */}
      <section className="bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="max-w-2xl mb-12">
            <Badge tone="ai" className="mb-4">
              {t('What you can do', 'Ibyo ushobora gukora')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight leading-tight">
              {t('Three things, done well.', 'Ibintu bitatu, bikorwa neza.')}
            </h2>
            <p className="mt-3 text-base text-ink-100 leading-relaxed">
              {t(
                'We focus on the essentials — so each one actually works, in both languages, on any device.',
                'Twibanda ku by’ingenzi — kugira ngo buri kimwe gikore neza, mu ndimi zombi, kuri telefone iyo ari yo yose.'
              )}
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="18" r="2" />
                    <circle cx="18" cy="6" r="2" />
                    <path d="M8 18h6a4 4 0 0 0 4-4v-4" />
                  </svg>
                ),
                accent: 'electric',
                titleEn: 'Plan with intelligence',
                titleRw: 'Tegura n’ubwenge',
                bodyEn: 'Ranked journey options with real fare, duration, transfers, and walking — and the reasoning shown.',
                bodyRw: 'Amahitamo y’ingendo atondekanyijwe n’amafaranga, igihe, guhindura, no kugenda n’amaguru — n’impamvu zigaragara.',
                ctaHref: '/plan',
                ctaEn: 'Open planner',
                ctaRw: 'Fungura gahunda',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                ),
                accent: 'teal',
                titleEn: 'Track the network',
                titleRw: 'Kurikirana urusobe',
                bodyEn: 'Live map of vehicles, each clearly marked by source and last-updated time. No hidden ambiguity.',
                bodyRw: 'Ikarita y’imodoka ziriho ubu, buri imwe igaragara n’aho ikomoka n’igihe yavuguruwe.',
                ctaHref: '/map',
                ctaEn: 'Open live map',
                ctaRw: 'Fungura ikarita',
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="4" r="2" />
                    <path d="M12 7v7" />
                    <path d="M7 10h10" />
                    <path d="M9 22l3-6 3 6" />
                  </svg>
                ),
                accent: 'amber',
                titleEn: 'Discover with confidence',
                titleRw: 'Shakisha ufite icyizere',
                bodyEn: 'Nearby places and businesses, with accessibility shown honestly — verified, unverified, or unknown.',
                bodyRw: 'Ahantu n’ubucuruzi buri hafi, n’ubushobozi bugaragara mu kuri — bwemejwe, butemejwe, cyangwa butazwi.',
                ctaHref: '/explore',
                ctaEn: 'Explore places',
                ctaRw: 'Shakisha ahantu',
              },
            ].map((p) => {
              const accentMap = {
                electric: { bg: 'bg-electric/10', text: 'text-electric-700', border: 'hover:border-electric/40' },
                teal: { bg: 'bg-teal/10', text: 'text-teal-700', border: 'hover:border-teal/40' },
                amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'hover:border-amber/40' },
              } as const;
              const a = accentMap[p.accent as keyof typeof accentMap];
              return (
                <Card key={p.ctaHref} className={`group transition-all hover:shadow-lift ${a.border}`}>
                  <CardBody className="pt-6">
                    <div className={`w-12 h-12 rounded-xl ${a.bg} ${a.text} flex items-center justify-center mb-5`}>
                      {p.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-ink">
                      {displayLang === 'rw' ? p.titleRw : p.titleEn}
                    </h3>
                    <p className="mt-2 text-sm text-ink-100 leading-relaxed">
                      {displayLang === 'rw' ? p.bodyRw : p.bodyEn}
                    </p>
                    <Link
                      href={p.ctaHref}
                      className={`mt-5 inline-flex items-center gap-1 text-sm font-semibold ${a.text} group-hover:gap-2 transition-all`}
                    >
                      {displayLang === 'rw' ? p.ctaRw : p.ctaEn}
                      <span aria-hidden>→</span>
                    </Link>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          USE CASES
         ============================================================ */}
      <section className="bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="max-w-2xl mb-12">
            <Badge tone="info" className="mb-4">
              {t('Who it is for', 'Ni iya ba nde')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight leading-tight">
              {t('Every kind of traveller.', 'Buri mugenzi, uko ari we.')}
            </h2>
            <p className="mt-3 text-base text-ink-100 leading-relaxed">
              {t(
                'The same platform serves very different needs — that is the point.',
                'Urubuga rumwe rukorera ibikenewe bitandukanye cyane — ni cyo kintu.'
              )}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: '🎒',
                accent: 'electric',
                titleEn: 'Daily commuters',
                titleRw: 'Abagenda buri munsi',
                bodyEn: 'Compare two or three real options to work, school, or market — with fares and transfer counts.',
                bodyRw: 'Gereranya uburyo bubiri cyangwa butatu nyakuri bwo kujya ku kazi, ku ishuri, cyangwa ku isoko — n’amafaranga n’ingendo.',
              },
              {
                icon: '♿',
                accent: 'teal',
                titleEn: 'Wheelchair users',
                titleRw: 'Abakoresha intebe y’ubumuga',
                bodyEn: 'See exactly what is verified, what is unverified, and what is unknown — never assumed.',
                bodyRw: 'Reba neza ibyemejwe, ibitaramenyekana, n’ibitazwi — ntabwo twiyumvira.',
              },
              {
                icon: '🏪',
                accent: 'amber',
                titleEn: 'Business owners',
                titleRw: 'Ba nyir’ubucuruzi',
                bodyEn: 'Claim your listing, keep details current, and manage staff attendance.',
                bodyRw: 'Fata urutonde rwawe, komeza amakuru ku gihe, kandi ucunge abakozi.',
              },
              {
                icon: '🌍',
                accent: 'navy',
                titleEn: 'Visitors to Rwanda',
                titleRw: 'Abashyitsi mu Rwanda',
                bodyEn: 'Everything available in Kinyarwanda and English — no local language required.',
                bodyRw: 'Byose biraboneka mu Kinyarwanda n’Icyongereza — nta rurimi rw’iwacu bikenewe.',
              },
            ].map((u) => {
              const accents = {
                electric: 'bg-electric/10 text-electric-700',
                teal: 'bg-teal/10 text-teal-700',
                amber: 'bg-amber-50 text-amber-700',
                navy: 'bg-navy/10 text-navy',
              } as const;
              return (
                <Card key={u.titleEn} className="hover:shadow-lift transition-shadow">
                  <CardBody className="pt-6">
                    <div className={`w-12 h-12 rounded-xl ${accents[u.accent as keyof typeof accents]} flex items-center justify-center text-2xl`}>
                      {u.icon}
                    </div>
                    <h3 className="mt-4 text-base font-semibold text-ink">
                      {displayLang === 'rw' ? u.titleRw : u.titleEn}
                    </h3>
                    <p className="mt-2 text-sm text-ink-100 leading-relaxed">
                      {displayLang === 'rw' ? u.bodyRw : u.bodyEn}
                    </p>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS
         ============================================================ */}
      <section className="bg-canvas">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="max-w-2xl mb-14">
            <Badge tone="info" className="mb-4">
              {t('How it works', 'Uko bikora')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight leading-tight">
              {t('From question to journey in three steps.', 'Kuva ku kibazo kugera ku rugendo mu ntambwe eshatu.')}
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                n: '1',
                titleEn: 'Search or describe',
                titleRw: 'Shakisha cyangwa sobanura',
                bodyEn: 'Pick two stops, or just tell the assistant what you need — in English or Kinyarwanda.',
                bodyRw: 'Hitamo ahantu habiri, cyangwa ubwire umufasha icyo ukeneye — mu Cyongereza cyangwa Ikinyarwanda.',
                color: 'electric',
              },
              {
                n: '2',
                titleEn: 'See grounded options',
                titleRw: 'Reba amahitamo y’ukuri',
                bodyEn: 'Every option is ranked by time, fare, transfers, walking, and accessibility — with visible reasoning.',
                bodyRw: 'Buri hitamo ritondekanijwe n’igihe, amafaranga, guhindura, kugenda n’amaguru, n’ubushobozi — n’impamvu zigaragara.',
                color: 'teal',
              },
              {
                n: '3',
                titleEn: 'Go, with live data',
                titleRw: 'Genda, n’amakuru ariho',
                bodyEn: 'Track the vehicle, get an arrival estimate, and know where the bus is right now.',
                bodyRw: 'Kurikirana imodoka, menya igihe izagera, kandi umenye aho iri ubu.',
                color: 'amber',
              },
            ].map((s) => {
              const dotColor =
                s.color === 'electric' ? 'bg-electric' :
                s.color === 'teal' ? 'bg-teal' : 'bg-amber';
              const ringColor =
                s.color === 'electric' ? 'ring-electric/20' :
                s.color === 'teal' ? 'ring-teal/20' : 'ring-amber/20';
              return (
                <div key={s.n} className="relative">
                  <div className={`w-16 h-16 rounded-full ${dotColor} ring-8 ${ringColor} flex items-center justify-center text-white font-bold text-xl shadow-card`}>
                    {s.n}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-ink">
                    {displayLang === 'rw' ? s.titleRw : s.titleEn}
                  </h3>
                  <p className="mt-2 text-sm text-ink-100 leading-relaxed">
                    {displayLang === 'rw' ? s.bodyRw : s.bodyEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          RECENT PLACES
         ============================================================ */}
      {recentPlaces.length > 0 && (
        <section className="bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
            <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
              <div className="max-w-xl">
                <Badge tone="ai" className="mb-4">
                  {t('From the map', 'Ku ikarita')}
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight leading-tight">
                  {t('Recently on the map.', 'Vuba aha ku ikarita.')}
                </h2>
                <p className="mt-3 text-base text-ink-100 leading-relaxed">
                  {t(
                    'Real businesses and public places people have mapped so far.',
                    'Ubucuruzi nyakuri n’ahantu rusange abantu bagaragaje kugeza ubu.'
                  )}
                </p>
              </div>
              <Link href="/explore" className="text-sm font-semibold text-electric hover:text-electric-700">
                {t('Explore all places', 'Reba ahantu hose')} →
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentPlaces.map((p) => (
                <Link
                  key={p.id}
                  href={`/place/${p.id}`}
                  className="group rounded-card border border-border bg-surface hover:border-border-strong hover:shadow-card transition p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink group-hover:text-electric transition">
                        {p.name}
                      </p>
                      <p className="text-xs text-ink-100 mt-0.5 truncate">
                        {p.category}
                        {p.distance_m != null && ` · ${formatDistance(p.distance_m)}`}
                      </p>
                    </div>
                    <span className="shrink-0 w-8 h-8 rounded-lg bg-teal/10 text-teal-700 flex items-center justify-center text-sm">
                      {categoryIcon(p.category)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          ACCESSIBILITY
         ============================================================ */}
      <section className="bg-gradient-to-br from-teal/5 via-canvas to-electric/5 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <Badge tone="ai" className="mb-4">
                {t('Accessibility', 'Ubushobozi')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight leading-tight">
                {t('Honest accessibility, not wishful thinking.', 'Ubushobozi bw’ukuri, ntabwo ari amagambo gusa.')}
              </h2>
              <p className="mt-5 text-base sm:text-lg text-ink-100 leading-relaxed">
                {t(
                  'Anyone can add a place and describe its accessibility. But we do not assume. Every attribute has one of three states: verified, not verified, or unknown. An empty field is never treated as "accessible".',
                  'Uwo ari we wese ashobora kongeraho ahantu no gusobanura ubushobozi bwahwo. Ariko ntitwiyumvira. Buri kintu kigira kimwe mu byiciro bitatu: byemejwe, ntibyemejwe, cyangwa ntibizwi. Umwanya wubusa ntacyo usobanura ku bushobozi.'
                )}
              </p>
              <div className="mt-6 space-y-2">
                {[
                  {
                    tone: 'success' as const,
                    labelEn: 'Verified — community-trusted or source confirmed',
                    labelRw: 'Byemejwe — n’umuryango cyangwa inkomoko yemeje',
                  },
                  {
                    tone: 'neutral' as const,
                    labelEn: 'Not verified — reported by a user, pending review',
                    labelRw: 'Ntibyemejwe — byatanzwe n’umukoresha, bitegereje igenzura',
                  },
                  {
                    tone: 'warning' as const,
                    labelEn: 'Unknown — no information available',
                    labelRw: 'Ntibizwi — nta makuru ahari',
                  },
                ].map((row, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge tone={row.tone} className="shrink-0 mt-0.5">
                      {displayLang === 'rw' ? row.labelRw.split('—')[0].trim() : row.labelEn.split('—')[0].trim()}
                    </Badge>
                    <span className="text-sm text-ink-100">
                      {displayLang === 'rw'
                        ? row.labelRw.split('—')[1]?.trim()
                        : row.labelEn.split('—')[1]?.trim()}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/explore" className="mt-6 inline-flex">
                <Button variant="ai">{t('See accessibility on the map', 'Reba ubushobozi ku ikarita')}</Button>
              </Link>
            </div>

            <div className="order-1 lg:order-2">
              <Card>
                <CardBody className="pt-6">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {t('A place card on the map', 'Ikarita y’ahantu ku ikarita')}
                    </p>
                    <p className="text-xs text-ink-100 mt-0.5">
                      {t('Illustrative only — real places vary', 'Urugero gusa — ahantu nyayo biratandukanye')}
                    </p>
                  </div>
                  <div className="mt-4 rounded-card border border-border bg-surface p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-ink">{t('Community center', 'Ikigo cy’umuryango')}</p>
                        <p className="text-xs text-ink-100">{t('Public services · 400 m', 'Serivisi rusange · 400 m')}</p>
                      </div>
                      <Badge tone="success">{t('Verified', 'Byemejwe')}</Badge>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-ink-100">{t('Wheelchair entrance', 'Ubwinjiriro bw’intebe')}</span>
                        <span className="text-ink font-medium">✓ {t('Yes', 'Yego')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-100">{t('Accessible toilet', 'Ubwiherero bufasha')}</span>
                        <span className="text-ink font-medium">✓ {t('Yes', 'Yego')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-100">{t('Tactile paving', 'Ibuye ryumvwa')}</span>
                        <span className="text-ink-100">— {t('Unknown', 'Ntibizwi')}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
                      <Link href="/explore" className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">{t('See on map', 'Reba ku ikarita')}</Button>
                      </Link>
                      <Link href="/plan" className="flex-1">
                        <Button variant="primary" size="sm" className="w-full">{t('Plan here', 'Tegura hano')}</Button>
                      </Link>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          AI SHOWCASE
         ============================================================ */}
      <section className="bg-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <Badge tone="ai" className="mb-5 bg-teal/20 text-mint border-teal/40">
                {t('AI assistant', 'Umufasha wa AI')}
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight tracking-tight">
                {t('Ask in your words. Get real answers.', 'Baza mu magambo yawe. Akira ibisubizo nyayo.')}
              </h2>
              <p className="mt-5 text-base sm:text-lg text-white/75 leading-relaxed">
                {t(
                  'Type or speak a question. The assistant looks up routes, fares, stops, and arrivals from live application data — it never invents them. When it does not know, it says so.',
                  'Andika cyangwa vuga ikibazo. Umufasha ashakisha inzira, ibiciro, ahantu, n’ibihe mu makuru ariho — ntatanga ibisubizo yihimbiye. Iyo atazi, aribwira.'
                )}
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/plan">
                  <Button variant="ai" size="lg">{t('Try the planner', 'Gerageza gahunda')}</Button>
                </Link>
                <Link href="/places">
                  <Button variant="outline" size="lg" className="bg-transparent text-white border-white/25 hover:bg-white/5">
                    {t('Ask about places', 'Baza ku hantu')}
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-xs text-white/45">
                {t(
                  'Voice input is English-first. Kinyarwanda voice depends on your browser; text always works.',
                  'Ijwi ritangira mu Cyongereza. Ijwi ry’Ikinyarwanda rishingiye kuri mushakisha; inyandiko zikora buri gihe.'
                )}
              </p>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute -inset-8 rounded-full bg-teal/10 blur-3xl pointer-events-none" />
                <div className="relative rounded-full bg-white/5 p-6 backdrop-blur-sm border border-white/10">
                  <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-br from-teal to-electric flex items-center justify-center shadow-lift">
                    <svg viewBox="0 0 100 100" className="w-28 h-28 sm:w-32 sm:h-32" aria-hidden="true">
                      <circle cx="35" cy="45" r="4.5" fill="#fff" />
                      <circle cx="65" cy="45" r="4.5" fill="#fff" />
                      <path d="M 40 65 Q 50 72 60 65" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <p className="mt-5 text-center text-xs text-white/50">
                  {t('Look for the teal button, bottom-right.', 'Reba buto ya teal, iburyo hepfo.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FAQ
         ============================================================ */}
      <section className="bg-surface">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <div className="text-center mb-12">
            <Badge tone="info" className="mb-4">
              {t('Common questions', 'Ibibazo bisanzwe')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-ink tracking-tight leading-tight">
              {t('Everything you were about to ask.', 'Ibyose wari ugize kubaza.')}
            </h2>
          </div>

          <div className="space-y-3">
            {[
              {
                qEn: 'Is the vehicle position data real-time?',
                qRw: 'Amakuru y’aho imodoka ziri ni ay’igihe nyacyo?',
                aEn: 'Every marker on the live map is labelled with its source and last-updated time. Some buses come from a simulator (for demonstration), others from GPS hardware. You can always tell which.',
                aRw: 'Buri kimenyetso ku ikarita kigaragaza aho gikomoka n’igihe byavuguruwe. Bimwe biva mu igereranyo (kubera kwerekana), ibindi biva kuri GPS. Ushobora kubimenya buri gihe.',
              },
              {
                qEn: 'Does the AI assistant understand Kinyarwanda?',
                qRw: 'Umufasha wa AI yumva Ikinyarwanda?',
                aEn: 'Yes — the assistant accepts questions in Kinyarwanda and replies in Kinyarwanda. Voice input in Kinyarwanda depends on your browser; typing always works.',
                aRw: 'Yego — umufasha yemera ibibazo mu Kinyarwanda kandi asubiza mu Kinyarwanda. Ijwi mu Kinyarwanda rishingiye kuri mushakisha; kwandika bikora buri gihe.',
              },
              {
                qEn: 'What do the three accessibility badges mean?',
                qRw: 'Utumenyetso dutatu tw’ubushobozi dusobanura iki?',
                aEn: 'Verified means a source or the community has confirmed it. Not verified means a user reported it but it awaits review. Unknown means nobody has provided information yet — this does not mean inaccessible.',
                aRw: 'Byemejwe bisobanura ko inkomoko cyangwa umuryango byemeje. Ntibyemejwe bisobanura ko umukoresha yabitangaje ariko bitegereje igenzura. Ntibizwi bisobanura ko nta muntu watanze amakuru — ntibisobanura ko bidashobora kugerwaho.',
              },
              {
                qEn: 'How accurate are the arrival time predictions?',
                qRw: 'Igihe cy’uko imodoka izagera gikwiye kangana?',
                aEn: 'The prediction model has been trained on demonstration data, not verified against real-world arrivals yet. Each estimate is labelled "ML model" or "Physics fallback" so you know where the number came from.',
                aRw: 'Moderi y’ubuhanuzi yahinduwe ku makuru y’igereranyo, ntabwo yagenzuwe ku bisubizo by’ukuri. Buri gereranya ryanditseho "ML model" cyangwa "Physics fallback" kugira ngo umenye aho umubare wavuye.',
              },
              {
                qEn: 'Can I add a place that is missing?',
                qRw: 'Nshobora kongeraho ahantu hatarabonetse?',
                aEn: 'Yes. Sign in, go to "Add a place", fill the form, and an admin will review it. Approved places appear on the map for everyone.',
                aRw: 'Yego. Injira, jya kuri "Ongeraho ahantu", wuzuze ifishi, hanyuma umuyobozi azayigenzura. Ahantu hemewe hazagaragara ku ikarita kuri bose.',
              },
              {
                qEn: 'Is this an official government platform?',
                qRw: 'Uru ni urubuga rwa leta?',
                aEn: 'No. This is an independent engineering project focused on mobility and accessibility. Some data is demonstration-quality until formal partnerships are established.',
                aRw: 'Oya. Uru ni umushinga wigenga w’ubuhanga uhuza ingendo n’ubushobozi. Amwe mu makuru ni ay’igereranyo kugeza ubwo ubufatanye bwemewe.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group rounded-card border border-border bg-surface open:border-border-strong open:shadow-card transition"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-4 sm:p-5">
                  <span className="font-medium text-ink text-sm sm:text-base pr-4">
                    {displayLang === 'rw' ? item.qRw : item.qEn}
                  </span>
                  <span className="shrink-0 w-6 h-6 rounded-full bg-canvas text-ink-100 flex items-center justify-center transition group-open:rotate-180 group-open:bg-electric/10 group-open:text-electric">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </summary>
                <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-1 text-sm text-ink-100 leading-relaxed">
                  {displayLang === 'rw' ? item.aRw : item.aEn}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          ALERTS
         ============================================================ */}
      {alerts.length > 0 && (
        <section className="bg-canvas">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  {t('Service alerts', 'Amatangazo y’imirimo')}
                </h2>
                <p className="text-sm text-ink-100 mt-0.5">
                  {t('Live updates from the network', 'Amakuru ariho ava ku rusobe')}
                </p>
              </div>
              <Link href="/routes" className="text-sm text-electric hover:text-electric-700 font-medium">
                {t('View all', 'Reba byose')} →
              </Link>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {alerts.map((a: any, i) => (
                <Card key={a.id ?? i} className="border-l-4" style={{ borderLeftColor: '#F59E0B' }}>
                  <CardBody className="py-4">
                    <div className="flex items-start gap-3">
                      <Badge tone="warning" className="shrink-0">{t('Alert', 'Itangazo')}</Badge>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-ink truncate">
                          {a.title ?? a.message ?? 'Service update'}
                        </div>
                        {a.description && (
                          <p className="text-sm text-ink-100 mt-1 line-clamp-2">{a.description}</p>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================================================
          INTERCITY CTA
         ============================================================ */}
      <section className="bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
          <Card className="overflow-hidden">
            <div className="grid lg:grid-cols-2">
              <CardBody className="py-10 lg:py-14">
                <Badge tone="info" className="mb-4">{t('Intercity', 'Intara')}</Badge>
                <h2 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight leading-tight">
                  {t('Travelling between cities?', 'Urajya mu yindi mijyi?')}
                </h2>
                <p className="mt-3 text-base text-ink-100 leading-relaxed max-w-lg">
                  {t(
                    'Search buses between Kigali, Musanze, Huye, Rubavu, and more. Book a seat, receive a QR ticket, and validate on boarding.',
                    'Shakisha imodoka hagati ya Kigali, Musanze, Huye, Rubavu, n’izindi. Fata umwanya, haboneke tiketi ya QR, kandi yemezwe mu modoka.'
                  )}
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/tickets">
                    <Button variant="secondary" size="lg">{t('Book a ticket', 'Fata tiketi')}</Button>
                  </Link>
                  <Link href="/routes">
                    <Button variant="outline" size="lg">{t('See all routes', 'Reba inzira zose')}</Button>
                  </Link>
                </div>
              </CardBody>
              <div className="bg-gradient-to-br from-navy via-navy-700 to-navy-900 relative overflow-hidden min-h-[240px]">
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    backgroundImage:
                      'radial-gradient(60% 60% at 20% 20%, rgba(15,157,145,0.5) 0%, transparent 60%),' +
                      'radial-gradient(60% 60% at 90% 90%, rgba(37,99,235,0.5) 0%, transparent 60%)',
                  }}
                />
                <div className="relative h-full flex items-center justify-center p-8 text-center">
                  <div>
                    <div className="text-6xl sm:text-7xl" aria-hidden>🚌</div>
                    <p className="mt-4 text-white/70 text-sm max-w-xs mx-auto">
                      {t(
                        'Kigali · Musanze · Huye · Rubavu · Nyagatare',
                        'Kigali · Musanze · Huye · Rubavu · Nyagatare'
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ============================================================
          VISION / CLOSING
         ============================================================ */}
      <section className="bg-canvas border-t border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center">
          <svg className="w-8 h-8 text-teal mx-auto mb-6 opacity-60" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
          </svg>
          <p className="text-xl sm:text-2xl lg:text-3xl font-medium text-ink leading-relaxed tracking-tight max-w-3xl mx-auto">
            {t(
              '"Rwanda is one of the most connected nations on this continent. Its transport should feel the same way."',
              '"U Rwanda ni kimwe mu bihugu bikomeye mu guhuza abantu kuri uyu mugabane. Ingendo zarwo zigomba kumera nk’ibyo."'
            )}
          </p>
          <p className="mt-6 text-sm text-ink-100">
            {t('Built with care in Rwanda. For everyone who moves.', 'Yubatswe n’urukundo mu Rwanda. Ku bose bagenda.')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Link href="/plan">
              <Button variant="primary" size="lg">{t('Start planning', 'Tangira gutegura')}</Button>
            </Link>
            <Link href="/explore">
              <Button variant="outline" size="lg">{t('Explore the map', 'Reba ikarita')}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------------- helpers ---------------- */

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

function categoryIcon(cat: string): string {
  const map: Record<string, string> = {
    restaurant: '🍽️', cafe: '☕', fast_food: '🍔', bar: '🍺',
    supermarket: '🛒', market: '🏪', pharmacy: '💊', hospital: '🏥',
    clinic: '🩺', bank: '🏦', atm: '🏧', fuel: '⛽',
    hotel: '🏨', school: '🎓', university: '🎓',
    place_of_worship: '⛪', government: '🏛️',
    repair: '🔧', electronics: '📱', clothing: '👕', hardware: '🔨',
    beauty: '💇', transport: '🚌', other: '📍',
  };
  return map[cat] || '📍';
}