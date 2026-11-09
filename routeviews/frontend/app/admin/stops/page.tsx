'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import Modal from '@/components/Modal';
import { useConfirm } from '@/components/Confirm';
import BarChart from '@/components/admin/BarChart';
import DonutChart from '@/components/admin/DonutChart';

type Stop = {
  id: number;
  code: string;
  name_rw: string;
  name_en: string;
  lat: number;
  lng: number;
  is_active: number | boolean;
};

// ── PREMIUM ICONS ─────────────────────────────────────────────────────────
const IconSparkle = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 9 9l-7 3 7 3 3 7 3-7 7-3-7-3z"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconPin = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11Z"/><circle cx="12" cy="10" r="3"/></svg>;
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IconClose = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

export default function AdminStopsPage() {
  const { lang } = useI18n();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);
  const confirm = useConfirm();

  const [stops, setStops] = useState<Stop[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState<'name' | 'code' | 'routes' | 'boardings'>('routes');

  const [editing, setEditing] = useState<Partial<Stop> | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  async function refreshStops() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.adminListStops();
      setStops(r.stops);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshAnalytics() {
    setAnalyticsLoading(true);
    try {
      const r = await api.adminStopsAnalytics();
      setAnalytics(r);
    } catch { /* ignore */ }
    finally { setAnalyticsLoading(false); }
  }

  async function refreshAll() {
    await Promise.all([refreshStops(), refreshAnalytics()]);
  }

  useEffect(() => { refreshAll(); }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const enrichedStops = useMemo(() => {
    if (!analytics) return stops.map((s) => ({ ...s, route_count: 0, departures_30d: 0 }));
    const byId = new Map<number, any>();
    for (const r of analytics.top_by_routes) byId.set(r.id, r);
    return stops.map((s) => {
      const found = byId.get(s.id);
      return {
        ...s,
        route_count: found?.route_count ?? 0,
        departures_30d: found?.departures_30d ?? 0
      };
    });
  }, [stops, analytics]);

  const filtered = useMemo(() => {
    let out = enrichedStops;
    const needle = q.trim().toLowerCase();
    if (needle) {
      out = out.filter((s) => `${s.code} ${s.name_en} ${s.name_rw}`.toLowerCase().includes(needle));
    }
    if (status !== 'all') {
      out = out.filter((s) => status === 'active' ? Boolean(s.is_active) : !s.is_active);
    }
    const sorted = [...out];
    if (sort === 'name') sorted.sort((a, b) => a.name_en.localeCompare(b.name_en));
    else if (sort === 'code') sorted.sort((a, b) => a.code.localeCompare(b.code));
    else if (sort === 'routes') sorted.sort((a, b) => b.route_count - a.route_count);
    else if (sort === 'boardings') sorted.sort((a, b) => b.departures_30d - a.departures_30d);
    return sorted;
  }, [enrichedStops, q, status, sort]);

  async function save() {
    if (!editing) return;
    const payload = {
      code: (editing.code || '').trim().toUpperCase(),
      name_rw: (editing.name_rw || '').trim(),
      name_en: (editing.name_en || '').trim(),
      lat: Number(editing.lat),
      lng: Number(editing.lng),
      is_active: editing.is_active === 0 || editing.is_active === false ? false : true
    };
    if (!payload.code || !payload.name_rw || !payload.name_en || !Number.isFinite(payload.lat) || !Number.isFinite(payload.lng)) {
      setToast({ kind: 'err', msg: t('Uzuza ibisabwa byose.', 'Fill in all required fields.') });
      return;
    }
    setBusy(true);
    try {
      if (editing.id) {
        await api.adminUpdateStop(editing.id, payload);
        setToast({ kind: 'ok', msg: t('Byahinduwe.', 'Stop updated.') });
      } else {
        await api.adminCreateStop(payload);
        setToast({ kind: 'ok', msg: t('Byongewe.', 'Stop created.') });
      }
      setEditing(null);
      refreshAll();
    } catch (e: any) {
      setToast({ kind: 'err', msg: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(s: Stop) {
    try {
      await api.adminUpdateStop(s.id, { is_active: !Boolean(s.is_active) });
      setStops((cur) => cur.map((x) => (x.id === s.id ? { ...x, is_active: !Boolean(x.is_active) } : x)));
      setToast({
        kind: 'ok',
        msg: !Boolean(s.is_active) ? t('Yongeye gukora.', 'Stop activated.') : t('Yahagaritswe.', 'Stop deactivated.')
      });
    } catch (e: any) {
      setToast({ kind: 'err', msg: e.message });
    }
  }

  async function remove(s: Stop) {
    const ok = await confirm({
      title: t('Gusiba ahantu', 'Delete stop'),
      message: t(`Gusiba ${s.code} — ${s.name_en}? Ibi bizasiba kandi aho hari kuri ingendo.`, `Delete ${s.code} — ${s.name_en}? This also removes it from all routes.`),
      destructive: true,
      confirmLabel: t('Siba', 'Delete')
    });
    if (!ok) return;
    try {
      await api.adminDeleteStop(s.id);
      setToast({ kind: 'ok', msg: t('Byasibwe.', 'Stop deleted.') });
      refreshAll();
    } catch (e: any) {
      setToast({ kind: 'err', msg: e.message });
    }
  }

  const routesPerStopData = useMemo(() => {
    if (!analytics) return [];
    return analytics.top_by_routes.map((s: any) => ({ label: s.name_en, value: s.route_count, color: '#06B6D4' }));
  }, [analytics]);

  const boardingsData = useMemo(() => {
    if (!analytics) return [];
    return analytics.top_by_boardings.map((s: any) => ({ label: s.name_en, value: s.departures_30d, color: '#10B981' }));
  }, [analytics]);

  const revenueData = useMemo(() => {
    if (!analytics) return [];
    return analytics.top_by_revenue.map((s: any) => ({ label: s.name_en, value: Math.round(s.revenue_30d / 100) / 10, color: '#8B5CF6' }));
  }, [analytics]);

  const o = analytics?.overview;

  return (
    <div className="p-6 sm:p-10 max-w-[1600px] mx-auto w-full relative z-10">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{t('Ahantu ho guhagarara', 'Stops')}</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">{t('Gucunga ahantu n’isesengura ry’urubuga.', 'Manage stops and see how they connect to the network.')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/map" className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10">
            {t('Reba ku ikarita', 'Open map')}
          </Link>
          <button
            onClick={() => setEditing({ is_active: 1, lat: -1.9441, lng: 30.0619 })}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all hover:-translate-y-0.5"
          >
            + {t('Ahantu hashya', 'New Stop')}
          </button>
        </div>
      </header>

      {/* ── KPI TILES ───────────────────────────────────────────────────── */}
      {o && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatTile label={t('Ahantu hose', 'Total stops')} value={o.total} tone="slate" />
          <StatTile label={t('Bikora', 'Active')} value={o.active} tone="emerald" />
          <StatTile label={t('Bitagikora', 'Inactive')} value={o.inactive} tone="rose" />
          <StatTile label={t('Bitarafatanywa n’ingendo', 'Orphaned')} value={o.orphaned} tone="amber" hint={t('Nta ndege ibikoresha', 'Not on any route')} />
        </div>
      )}

      {/* ── INSIGHTS ────────────────────────────────────────────────────── */}
      {analytics?.recommendations?.length > 0 && (
        <section className="overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-950/40 to-[#0A0D1A] mb-8 shadow-2xl">
          <header className="flex items-center gap-3 border-b border-violet-500/20 px-6 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 border border-violet-500/30">
              <IconSparkle />
            </span>
            <div>
              <p className="text-base font-bold text-white">{t('Incamake', 'Insights & recommendations')}</p>
              <p className="text-xs font-bold text-violet-500 uppercase tracking-widest mt-0.5">{t('Bishingiye ku makuru y’urubuga', 'Grounded in live network data')}</p>
            </div>
          </header>
          <div className="grid gap-4 p-6 md:grid-cols-2">
            {analytics.recommendations.map((rec: any, i: number) => (
              <RecommendationCard key={i} {...rec} />
            ))}
          </div>
        </section>
      )}

      {/* ── ANALYTICS GRID ──────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 shadow-2xl">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">{t('Ahantu hahuza ingendo nyinshi', 'Most connected stops')}</h2>
            <p className="text-xs font-medium text-slate-400 mt-1">{t('Amatungo y’urubuga', 'Transfer hubs by route count')}</p>
          </div>
          {analyticsLoading ? <Skeleton /> : routesPerStopData.length === 0 ? <EmptyChart /> : <BarChart data={routesPerStopData} vertical accent="#06B6D4" />}
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 shadow-2xl">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">{t('Ahantu abantu bakundira', 'Busiest stops')}</h2>
            <p className="text-xs font-medium text-slate-400 mt-1">{t('Kwinjira · iminsi 30', 'Boardings · last 30 days')}</p>
          </div>
          {analyticsLoading ? <Skeleton /> : boardingsData.length === 0 ? <EmptyChart /> : <BarChart data={boardingsData} vertical accent="#10B981" />}
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 shadow-2xl">
          <div className="mb-4">
            <h2 className="text-base font-bold text-white">{t('Ikwirakwizwa ry’ingendo', 'Route coverage')}</h2>
            <p className="text-xs font-medium text-slate-400 mt-1">{t('Abantu ku ngendo', 'Stops grouped by routes served')}</p>
          </div>
          {analyticsLoading ? <Skeleton /> : analytics?.route_distribution ? <DonutChart data={analytics.route_distribution} size={180} thickness={20} /> : <EmptyChart />}
        </section>
      </div>

      {/* ── TOP REVENUE ─────────────────────────────────────────────────── */}
      {revenueData.length > 0 && (
        <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 shadow-2xl mb-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">{t('Amafaranga yinjira ku ahantu', 'Revenue by origin stop')}</h2>
              <p className="text-xs font-medium text-slate-400 mt-1">{t('Mu bihumbi by’amafaranga · iminsi 30', 'In thousands RWF · last 30 days')}</p>
            </div>
          </div>
          <BarChart data={revenueData} vertical accent="#8B5CF6" />
        </section>
      )}

      {/* ── ALERTS ──────────────────────────────────────────────────────── */}
      {(analytics?.orphaned?.length > 0 || analytics?.duplicates?.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {analytics?.orphaned?.length > 0 && (
            <Panel title={t('Ahantu hatagira ingendo', 'Orphaned stops')} subtitle={t('Nta ndege ibikoresha', 'Not served by any active route')} tone="amber">
              <ul className="space-y-2">
                {analytics.orphaned.map((s: any) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{s.name_en}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-0.5">{s.code}</p>
                    </div>
                    <button onClick={() => setEditing(s)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10">
                      {t('Hindura', 'Edit')}
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {analytics?.duplicates?.length > 0 && (
            <Panel title={t('Ahantu hafi ya hamwe', 'Near-duplicate stops')} subtitle={t('Hafi ya metero 200', 'Within 200 metres of each other')} tone="violet">
              <ul className="space-y-2">
                {analytics.duplicates.map((d: any, i: number) => (
                  <li key={i} className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{d.a.name_en} · {d.b.name_en}</p>
                        <p className="text-[11px] font-medium text-slate-400 mt-0.5">{d.a.code} · {d.b.code}</p>
                      </div>
                      <span className="flex-shrink-0 rounded-md bg-violet-500/20 px-2 py-1 text-[10px] font-bold text-violet-300">
                        {d.distance_m} m
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}

      {/* ── FILTERS ─────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 mb-8 shadow-2xl">
        <div className="grid gap-5 md:grid-cols-[1fr_200px_200px]">
          <label className="block group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Shakisha', 'Search')}</span>
            <div className="mt-1.5 flex items-center rounded-xl border border-white/10 bg-black/40 px-3 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
              <span className="text-slate-500"><IconSearch /></span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Kode cyangwa izina…', 'Code or name…')} className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
              {q && <button onClick={() => setQ('')} className="text-slate-500 hover:text-white transition-colors"><IconClose /></button>}
            </div>
          </label>

          <label className="block group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Imimerere', 'Status')}</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer">
              <option value="all">{t('Byose', 'All')}</option>
              <option value="active">{t('Bikora', 'Active')}</option>
              <option value="inactive">{t('Bitagikora', 'Inactive')}</option>
            </select>
          </label>

          <label className="block group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Gutondeka', 'Sort by')}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer">
              <option value="routes">{t('Ingendo nyinshi', 'Most routes')}</option>
              <option value="boardings">{t('Abantu benshi', 'Most boardings')}</option>
              <option value="name">{t('Izina', 'Name')}</option>
              <option value="code">{t('Kode', 'Code')}</option>
            </select>
          </label>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400 font-medium mb-6">{error}</div>}

      {/* ── TABLE / LIST ────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl shadow-2xl mb-8">
        {loading && stops.length === 0 ? (
          <SkeletonTable />
        ) : filtered.length === 0 ? (
          <EmptyState t={t} hasFilters={q !== '' || status !== 'all'} onClear={() => { setQ(''); setStatus('all'); }} onCreate={() => setEditing({ is_active: 1, lat: -1.9441, lng: 30.0619 })} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-bold">{t('Kode', 'Code')}</th>
                    <th className="px-6 py-4 font-bold">{t('Izina', 'Name')}</th>
                    <th className="px-6 py-4 font-bold">{t('Aho hari', 'Location')}</th>
                    <th className="px-6 py-4 font-bold text-center">{t('Ingendo', 'Routes')}</th>
                    <th className="px-6 py-4 font-bold text-center">{t('Kwinjira', 'Boardings')}</th>
                    <th className="px-6 py-4 font-bold">{t('Imimerere', 'Status')}</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-white/[0.04] group">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-cyan-400">{s.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{lang === 'rw' ? s.name_rw : s.name_en}</p>
                        <p className="text-[11px] font-medium text-slate-500 mt-0.5">{lang === 'rw' ? s.name_en : s.name_rw}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-[11px] font-medium text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/5">{Number(s.lat).toFixed(4)}, {Number(s.lng).toFixed(4)}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <RouteBadge count={s.route_count} t={t} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <BoardingBadge count={s.departures_30d} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge active={Boolean(s.is_active)} t={t} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditing(s)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors">
                            {t('Hindura', 'Edit')}
                          </button>
                          <button onClick={() => remove(s)} className="rounded-lg border border-transparent p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all" title={t('Siba', 'Delete')}>
                            <IconTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <ul className="divide-y divide-white/5 md:hidden">
              {filtered.map((s) => (
                <li key={s.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{lang === 'rw' ? s.name_rw : s.name_en}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{s.code}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <RouteBadge count={s.route_count} t={t} />
                        <BoardingBadge count={s.departures_30d} />
                        <StatusBadge active={Boolean(s.is_active)} t={t} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => setEditing(s)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300">
                        {t('Hindura', 'Edit')}
                      </button>
                      <button onClick={() => remove(s)} className="rounded-lg border border-transparent p-1.5 text-slate-500 hover:text-red-400 self-end">
                        <IconTrash />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ── MODAL ───────────────────────────────────────────────────────── */}
      {editing && (
        <StopModal editing={editing} setEditing={setEditing} onSave={save} onCancel={() => setEditing(null)} busy={busy} t={t} />
      )}

      {/* ── TOAST ───────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-6 py-3 text-sm font-bold shadow-2xl border ${
          toast.kind === 'ok' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
        } backdrop-blur-md`}>
          {toast.msg}
        </div>
      )}

      <style jsx global>{`
        /* Automatically inverts the OSM iframe to dark mode */
        .dark-map-iframe iframe {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
      `}</style>
    </div>
  );
}

/* ================================================================== */
/*  COMPONENTS                                                         */
/* ================================================================== */

function StatTile({ label, value, tone, hint }: { label: string; value: number; tone: 'slate' | 'emerald' | 'rose' | 'amber'; hint?: string }) {
  const styles = {
    slate: 'text-white border-white/10 bg-white/[0.02]',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    rose: 'text-red-400 border-red-500/20 bg-red-500/5',
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5'
  };
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md ${styles[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1.5 text-3xl font-black tracking-tight ${styles[tone].split(' ')[0]}`}>{value.toLocaleString()}</p>
      {hint && <p className="mt-1 text-[10px] font-medium text-slate-500">{hint}</p>}
    </div>
  );
}

function Panel({ title, subtitle, tone, children }: { title: string; subtitle?: string; tone: 'amber' | 'violet'; children: React.ReactNode }) {
  const border = tone === 'amber' ? 'border-amber-500/20' : 'border-violet-500/20';
  const header = tone === 'amber' ? 'border-amber-500/20 bg-amber-500/5' : 'border-violet-500/20 bg-violet-500/5';
  return (
    <section className={`overflow-hidden rounded-3xl border ${border} bg-[#0A0D1A]/80 backdrop-blur-xl shadow-2xl`}>
      <header className={`border-b ${header} px-6 py-4`}>
        <p className="text-base font-bold text-white">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-400">{subtitle}</p>}
      </header>
      <div className="max-h-[320px] overflow-auto custom-scrollbar p-5">{children}</div>
    </section>
  );
}

function RecommendationCard({ tone, title, body }: any) {
  const tones: Record<string, { dot: string; bg: string; border: string }> = {
    positive: { dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    warning:  { dot: 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
    info:     { dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]',      bg: 'bg-cyan-500/10',    border: 'border-cyan-500/20' }
  };
  const t = tones[tone] || tones.info;
  return (
    <div className={`rounded-xl border ${t.border} ${t.bg} p-4`}>
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 inline-block h-2 w-2 flex-shrink-0 rounded-full ${t.dot}`} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">{body}</p>
        </div>
      </div>
    </div>
  );
}

function RouteBadge({ count, t }: { count: number; t: any }) {
  const cls =
    count === 0 ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : count === 1 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    : count >= 3 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
  return (
    <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold border ${cls}`}>
      {count} {count === 1 ? t('urugendo', 'route') : t('ingendo', 'routes')}
    </span>
  );
}

function BoardingBadge({ count }: { count: number }) {
  if (count === 0) return <span className="text-[11px] font-bold text-slate-600">—</span>;
  return (
    <span className="inline-block rounded-md bg-white/5 border border-white/10 px-2 py-1 text-[10px] font-bold tabular-nums text-slate-300">
      {count}
    </span>
  );
}

function StatusBadge({ active, t }: { active: boolean, t: any }) {
  return (
    <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${
      active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    }`}>
      {active ? t('Irakora', 'Active') : t('Yahagaritswe', 'Inactive')}
    </span>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3].map((i) => <div key={i} className="h-8 animate-pulse rounded-lg bg-white/5" />)}
    </div>
  );
}

function EmptyChart() {
  return <p className="py-12 text-center text-xs font-bold text-slate-500">No data available</p>;
}

function SkeletonTable() {
  return (
    <div className="divide-y divide-white/5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-5">
          <div className="h-4 w-16 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          <div className="ml-auto h-4 w-16 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ t, hasFilters, onClear, onCreate }: any) {
  return (
    <div className="p-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-slate-500 border border-white/10">
        <IconPin />
      </div>
      <p className="mt-6 text-xl font-bold text-white">
        {hasFilters ? t('Nta hantu hihuye n’ibisabwa', 'No stops match your filters') : t('Nta hantu hari', 'No stops yet')}
      </p>
      <p className="mt-2 text-sm text-slate-400">
        {hasFilters ? t('Gerageza uhindure ibisabwa.', 'Try adjusting the filters.') : t('Kora ahantu ha mbere.', 'Create your first stop.')}
      </p>
      {hasFilters ? (
        <button onClick={onClear} className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-cyan-400">
          {t('Siba filters', 'Clear filters')}
        </button>
      ) : (
        <button onClick={onCreate} className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:-translate-y-0.5">
          + {t('Ahantu hashya', 'New stop')}
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/*  MODAL                                                              */
/* ================================================================== */

function StopModal({ editing, setEditing, onSave, onCancel, busy, t }: any) {
  const set = (patch: Partial<Stop>) => setEditing({ ...editing, ...patch });
  const isNew = !editing.id;

  return (
    <Modal
      open
      onClose={onCancel}
      title={isNew ? t('Ahantu hashya', 'New stop') : `${t('Hindura', 'Edit')} ${editing.code}`}
      wide
      footer={
        <div className="flex gap-3 w-full">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">
            {t('Reka', 'Cancel')}
          </button>
          <button onClick={onSave} disabled={busy} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">
            {busy ? t('Turabika…', 'Saving…') : t('Bika', 'Save')}
          </button>
        </div>
      }
    >
      <div className="bg-[#0A0D1A] -m-6 p-6 sm:p-8 rounded-t-2xl space-y-6">
        
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('Kode', 'Code')} required hint={t('Nka ST-NYAB', 'e.g. ST-NYAB')}>
            <input value={editing.code || ''} onChange={(e) => set({ code: e.target.value.toUpperCase() })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm uppercase tracking-wider text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" placeholder="ST-XXX" maxLength={30} />
          </Field>

          <Field label={t('Izina ry’ikinyarwanda', 'Name (Kinyarwanda)')} required>
            <input value={editing.name_rw || ''} onChange={(e) => set({ name_rw: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" placeholder="Nyabugogo" maxLength={160} />
          </Field>
        </div>

        <Field label={t('Izina ry’icyongereza', 'Name (English)')} required>
          <input value={editing.name_en || ''} onChange={(e) => set({ name_en: e.target.value })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" placeholder="Nyabugogo" maxLength={160} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label={t('Latitude', 'Latitude')} required hint={t('Nka -1.9441', 'e.g. -1.9441')}>
            <input type="number" step="0.0000001" value={editing.lat ?? ''} onChange={(e) => set({ lat: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" placeholder="-1.9441" />
          </Field>
          <Field label={t('Longitude', 'Longitude')} required hint={t('Nka 30.0619', 'e.g. 30.0619')}>
            <input type="number" step="0.0000001" value={editing.lng ?? ''} onChange={(e) => set({ lng: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" placeholder="30.0619" />
          </Field>
        </div>

        {/* Map Preview (Dark Mode Wrapper) */}
        {Number.isFinite(editing.lat) && Number.isFinite(editing.lng) && (
          <div className="dark-map-iframe overflow-hidden rounded-2xl border border-white/10 shadow-inner">
            <iframe
              title="stop-preview"
              width="100%"
              height="220"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0 }}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${editing.lng - 0.005}%2C${editing.lat - 0.005}%2C${editing.lng + 0.005}%2C${editing.lat + 0.005}&layer=mapnik&marker=${editing.lat}%2C${editing.lng}`}
            />
          </div>
        )}

        {/* Toggle Active */}
        <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-5 cursor-pointer hover:bg-white/5 transition-colors">
          <div>
            <p className="text-sm font-bold text-white">{t('Irakora', 'Active')}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">{t('Ahantu hadakora ntihagaragara ku rubuga rusanzwe.', 'Inactive stops are hidden from the public site.')}</p>
          </div>
          <button
            type="button"
            onClick={() => set({ is_active: editing.is_active === 0 || editing.is_active === false ? 1 : 0 })}
            className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${
              editing.is_active === 0 || editing.is_active === false ? 'bg-slate-700' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
            }`}
          >
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${editing.is_active === 0 || editing.is_active === false ? 'left-1' : 'left-6'}`} />
          </button>
        </label>
      </div>
    </Modal>
  );
}

function Field({ label, required, hint, children }: any) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-slate-400">{label}{required && <span className="text-cyan-500 ml-1">*</span>}</span>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1.5 text-[10px] font-medium text-slate-500">{hint}</p>}
    </label>
  );
}