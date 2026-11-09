'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import Modal from '@/components/Modal';
import { useConfirm } from '@/components/Confirm';

type Route = {
  id: number;
  code: string;
  name_rw: string;
  name_en: string;
  direction_label: string;
  color_hex: string;
  is_active: number | boolean;
  stop_count?: number;
};

const PRESET_COLORS = [
  '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#ef4444', '#14b8a6', '#6366f1'
];

// ── PREMIUM ICONS ─────────────────────────────────────────────────────────
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IconClose = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconRoute = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M6 17V9a4 4 0 0 1 4-4h4"/></svg>;

export default function AdminRoutesPage() {
  const { lang } = useI18n();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);
  const confirm = useConfirm();

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'code' | 'name' | 'stops'>('code');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editing, setEditing] = useState<Partial<Route> | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.adminListRoutes();
      // Ensure we are setting the full list of routes returned by the backend
      setRoutes(r.routes || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(() => {
    let out = routes;
    const needle = q.trim().toLowerCase();
    if (needle) {
      out = out.filter((r) =>
        `${r.code} ${r.name_en} ${r.name_rw} ${r.direction_label}`.toLowerCase().includes(needle)
      );
    }
    if (filter !== 'all') {
      out = out.filter((r) => filter === 'active' ? Boolean(r.is_active) : !r.is_active);
    }
    const sorted = [...out];
    if (sort === 'name') {
      sorted.sort((a, b) => (lang === 'rw' ? a.name_rw : a.name_en).localeCompare(lang === 'rw' ? b.name_rw : b.name_en));
    } else if (sort === 'stops') {
      sorted.sort((a, b) => (b.stop_count || 0) - (a.stop_count || 0));
    } else {
      sorted.sort((a, b) => a.code.localeCompare(b.code));
    }
    return sorted;
  }, [routes, q, sort, filter, lang]);

  async function save() {
    if (!editing) return;
    const payload = {
      code: (editing.code || '').trim().toUpperCase(),
      name_rw: (editing.name_rw || '').trim(),
      name_en: (editing.name_en || '').trim(),
      direction_label: (editing.direction_label || '').trim(),
      color_hex: editing.color_hex || '#0ea5e9',
      is_active: editing.is_active === 0 || editing.is_active === false ? false : true
    };
    if (!payload.code || !payload.name_rw || !payload.name_en || !payload.direction_label) {
      setToast({ kind: 'err', msg: t('Uzuza ibisabwa byose.', 'Fill in all required fields.') });
      return;
    }
    setBusy(true);
    try {
      if (editing.id) {
        await api.adminUpdateRoute(editing.id, payload);
        setToast({ kind: 'ok', msg: t('Byahinduwe.', 'Route updated.') });
      } else {
        await api.adminCreateRoute(payload);
        setToast({ kind: 'ok', msg: t('Byongewe.', 'Route created.') });
      }
      setEditing(null);
      refresh();
    } catch (e: any) {
      setToast({ kind: 'err', msg: e.message });
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(r: Route) {
    try {
      await api.adminUpdateRoute(r.id, { is_active: !Boolean(r.is_active) });
      setRoutes((cur) => cur.map((x) => (x.id === r.id ? { ...x, is_active: !Boolean(x.is_active) } : x)));
      setToast({
        kind: 'ok',
        msg: !Boolean(r.is_active) ? t('Yongeye gukora.', 'Route activated.') : t('Yahagaritswe.', 'Route deactivated.')
      });
    } catch (e: any) {
      setToast({ kind: 'err', msg: e.message });
    }
  }

  async function remove(r: Route) {
    const ok = await confirm({
      title: t('Gusiba ingendo', 'Delete route'),
      message: t(`Gusiba ${r.code} — ${r.name_en}? Ibi bizasiba kandi ahantu h’iyi ngendo.`, `Delete ${r.code} — ${r.name_en}? This also removes its stops.`),
      destructive: true,
      confirmLabel: t('Siba', 'Delete')
    });
    if (!ok) return;
    try {
      await api.adminDeleteRoute(r.id);
      setToast({ kind: 'ok', msg: t('Byasibwe.', 'Route deleted.') });
      refresh();
    } catch (e: any) {
      setToast({ kind: 'err', msg: e.message });
    }
  }

  const total = routes.length;
  const active = routes.filter((r) => Boolean(r.is_active)).length;
  const inactive = total - active;
  const totalStops = routes.reduce((s, r) => s + (r.stop_count || 0), 0);

  return (
    <div className="p-6 sm:p-10 max-w-[1600px] mx-auto w-full relative z-10">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{t('Ingendo z’umujyi', 'Urban Routes')}</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">{t('Gucunga ingendo, amabara n’imiterere yazo.', 'Manage routes, colours and their status.')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/routes"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10"
          >
            {t('Reba ku rubuga', 'Public view')}
          </Link>
          <button
            onClick={() => setEditing({ color_hex: '#0ea5e9', is_active: 1 })}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all hover:-translate-y-0.5"
          >
            + {t('Ingendo nshya', 'New Route')}
          </button>
        </div>
      </header>

      {/* ── STAT TILES ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatTile label={t('Ingendo zose', 'Total routes')} value={total} tone="slate" />
        <StatTile label={t('Zikora', 'Active')} value={active} tone="emerald" />
        <StatTile label={t('Zahagaritswe', 'Inactive')} value={inactive} tone="rose" />
        <StatTile label={t('Ahantu hose', 'Total stops')} value={totalStops} tone="cyan" />
      </div>

      {/* ── FILTERS ─────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 mb-8">
        <div className="grid gap-5 md:grid-cols-[1fr_200px_200px]">
          <label className="block group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Shakisha', 'Search')}</span>
            <div className="mt-1.5 flex items-center rounded-xl border border-white/10 bg-black/40 px-3 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
              <span className="text-slate-500"><IconSearch /></span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('Kode cyangwa izina…', 'Code or name…')}
                className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600"
              />
              {q && (
                <button onClick={() => setQ('')} className="text-slate-500 hover:text-white transition-colors"><IconClose /></button>
              )}
            </div>
          </label>

          <label className="block group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Imimerere', 'Status')}</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="all">{t('Zose', 'All')}</option>
              <option value="active">{t('Zikora gusa', 'Active only')}</option>
              <option value="inactive">{t('Zahagaritswe gusa', 'Inactive only')}</option>
            </select>
          </label>

          <label className="block group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Gutondeka', 'Sort')}</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              <option value="code">{t('Kode', 'Code')}</option>
              <option value="name">{t('Izina', 'Name')}</option>
              <option value="stops">{t('Ahantu', 'Stops')}</option>
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400 font-medium mb-6">
          {error}
        </div>
      )}

      {/* ── ROUTE GRID ──────────────────────────────────────────────────── */}
      {loading && routes.length === 0 ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState t={t} hasFilters={q !== '' || filter !== 'all'} onClear={() => { setQ(''); setFilter('all'); }} onCreate={() => setEditing({ color_hex: '#0ea5e9', is_active: 1 })} />
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <li key={r.id}>
              <RouteCard route={r} lang={lang} t={t} onEdit={() => setEditing(r)} onToggle={() => toggleActive(r)} onDelete={() => remove(r)} />
            </li>
          ))}
        </ul>
      )}

      {/* ── MODAL ───────────────────────────────────────────────────────── */}
      {editing && (
        <RouteModal editing={editing} setEditing={setEditing} onSave={save} onCancel={() => setEditing(null)} busy={busy} t={t} />
      )}

      {/* ── TOAST ───────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-6 py-3 text-sm font-bold shadow-2xl border ${
          toast.kind === 'ok' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
        } backdrop-blur-md`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  COMPONENTS                                                         */
/* ================================================================== */

function RouteCard({ route: r, lang, t, onEdit, onToggle, onDelete }: any) {
  const active = Boolean(r.is_active);
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
      {/* Glowing Colour Bar */}
      <div className="h-1.5 w-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: r.color_hex, color: r.color_hex }} />

      <div className="flex flex-1 flex-col p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 min-w-[64px] items-center justify-center rounded-xl px-3 text-sm font-black text-white shadow-lg" style={{ backgroundColor: r.color_hex, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {r.code}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-white text-base">
                {lang === 'rw' ? r.name_rw : r.name_en}
              </p>
              <p className="truncate text-xs font-medium text-slate-400 mt-0.5">{r.direction_label}</p>
            </div>
          </div>

          <span className={`flex-shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${
            active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
          }`}>
            {active ? t('Irakora', 'Active') : t('Yahagaritswe', 'Inactive')}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">{t('Ahantu', 'Stops')}</p>
            <p className="text-sm font-bold text-white">{r.stop_count ?? 0}</p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
            <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-1">{t('Ibara', 'Colour')}</p>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded shadow-sm" style={{ backgroundColor: r.color_hex }} />
              <span className="font-mono text-[11px] font-bold text-slate-300">{r.color_hex}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2">
          <Link href={`/routes/${r.id}`} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-center text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white">
            {t('Reba', 'View')}
          </Link>
          <button onClick={onEdit} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white">
            {t('Hindura', 'Edit')}
          </button>
          <button
            onClick={onToggle}
            className={`flex-1 rounded-xl py-2 text-xs font-bold transition border ${
              active ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
          >
            {active ? t('Hagarika', 'Deactivate') : t('Kora', 'Activate')}
          </button>
          <button onClick={onDelete} className="flex-shrink-0 rounded-xl border border-transparent p-2 text-slate-500 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400" title={t('Siba', 'Delete')}>
            <IconTrash />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'emerald' | 'rose' | 'cyan' }) {
  const styles = {
    slate: 'text-white border-white/10 bg-white/[0.02]',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    rose: 'text-red-400 border-red-500/20 bg-red-500/5',
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5'
  };
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md ${styles[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1.5 text-3xl font-black tracking-tight ${styles[tone].split(' ')[0]}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-64 animate-pulse rounded-3xl bg-white/5 border border-white/5" />
      ))}
    </div>
  );
}

function EmptyState({ t, hasFilters, onClear, onCreate }: any) {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/5 text-slate-500 border border-white/10">
        <IconRoute />
      </div>
      <p className="mt-6 text-xl font-bold text-white">
        {hasFilters ? t('Nta ndege ihuye n’ibisabwa', 'No routes match your filters') : t('Nta ndege zirahari', 'No routes yet')}
      </p>
      <p className="mt-2 text-sm text-slate-400">
        {hasFilters ? t('Gerageza uhindure ibisabwa.', 'Try adjusting the filters.') : t('Kora ingendo ya mbere.', 'Create your first route.')}
      </p>
      {hasFilters ? (
        <button onClick={onClear} className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-cyan-400">
          {t('Siba filters', 'Clear filters')}
        </button>
      ) : (
        <button onClick={onCreate} className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:-translate-y-0.5">
          + {t('Ingendo nshya', 'New route')}
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/*  MODAL                                                              */
/* ================================================================== */

function RouteModal({ editing, setEditing, onSave, onCancel, busy, t }: any) {
  const set = (patch: Partial<Route>) => setEditing({ ...editing, ...patch });
  const isNew = !editing.id;

  return (
    <Modal
      open
      onClose={onCancel}
      title={isNew ? t('Ingendo nshya', 'New route') : `${t('Hindura', 'Edit')} ${editing.code}`}
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
          <Field label={t('Kode', 'Code')} required hint={t('Nka R1, R2', 'e.g. R1, R2')}>
            <input
              value={editing.code || ''}
              onChange={(e) => set({ code: e.target.value.toUpperCase() })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm uppercase tracking-wider text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
              placeholder="R1"
              maxLength={20}
            />
          </Field>

          <Field label={t('Ijambo ry’icyerekezo', 'Direction label')} required hint={t('Urugero: Outbound', 'e.g. Outbound')}>
            <input
              value={editing.direction_label || ''}
              onChange={(e) => set({ direction_label: e.target.value })}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
              placeholder="Outbound"
              maxLength={160}
            />
          </Field>
        </div>

        <Field label={t('Izina mu Kinyarwanda', 'Name (Kinyarwanda)')} required>
          <input
            value={editing.name_rw || ''}
            onChange={(e) => set({ name_rw: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
            placeholder="Nyabugogo – Kimironko"
            maxLength={160}
          />
        </Field>

        <Field label={t('Izina mu Cyongereza', 'Name (English)')} required>
          <input
            value={editing.name_en || ''}
            onChange={(e) => set({ name_en: e.target.value })}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
            placeholder="Nyabugogo – Kimironko"
            maxLength={160}
          />
        </Field>

        {/* Colour */}
        <div>
          <p className="text-xs font-bold text-slate-400 mb-3">{t('Ibara ry’urugendo', 'Route colour')}</p>
          <div className="flex flex-wrap items-center gap-3">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ color_hex: c })}
                className={`h-10 w-10 rounded-xl border-2 transition-all flex items-center justify-center ${
                  editing.color_hex === c ? 'border-white scale-110 shadow-[0_0_15px_currentColor]' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c, color: c }}
                title={c}
              >
                {editing.color_hex === c && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
            <label className="ml-auto flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs cursor-pointer hover:bg-white/5 transition-colors">
              <input
                type="color"
                value={editing.color_hex || '#0ea5e9'}
                onChange={(e) => set({ color_hex: e.target.value })}
                className="h-6 w-6 cursor-pointer border-0 bg-transparent p-0 rounded overflow-hidden"
              />
              <span className="font-mono text-[11px] font-bold text-slate-300 uppercase">
                {editing.color_hex || '#0ea5e9'}
              </span>
            </label>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">{t('Igaragaza', 'Preview')}</p>
          <div className="flex items-center gap-4">
            <span className="flex h-12 min-w-[64px] items-center justify-center rounded-xl px-3 text-sm font-black text-white shadow-lg" style={{ backgroundColor: editing.color_hex || '#0ea5e9', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
              {editing.code || 'R1'}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-white text-base">{editing.name_en || t('Izina ry’urugendo', 'Route name')}</p>
              <p className="truncate text-xs font-medium text-slate-400 mt-0.5">{editing.direction_label || t('Icyerekezo', 'Direction')}</p>
            </div>
          </div>
        </div>

        {/* Active toggle */}
        <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-5 cursor-pointer hover:bg-white/5 transition-colors">
          <div>
            <p className="text-sm font-bold text-white">{t('Irakora', 'Active')}</p>
            <p className="mt-1 text-xs font-medium text-slate-400">{t('Ingendo zidakora ntizigaragara ku rubuga rusanzwe.', 'Inactive routes are hidden from the public site.')}</p>
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