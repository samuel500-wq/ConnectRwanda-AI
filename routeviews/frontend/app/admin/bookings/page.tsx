'use client';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type Booking = any;
type Detail = any;

const PAGE_SIZES = [10, 20, 50, 100];

// ── PREMIUM ICONS ─────────────────────────────────────────────────────────
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IconClose = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IconChevronRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>;
const IconRefresh = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;

export default function AdminBookingsPage() {
  const { lang } = useI18n();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState('');
  const [type, setType] = useState<'all' | 'urban' | 'intercity'>('all');
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [data, setData] = useState<{ total: number; page: number; pageSize: number; rows: Booking[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<{ type: 'urban' | 'intercity'; id: number } | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const debouncedQ = useDebounce(q, 350);

  const fetchBookings = () => {
    setLoading(true);
    setError(null);
    api.adminBookings({
      page,
      pageSize,
      status: status || undefined,
      type: type === 'all' ? undefined : type,
      q: debouncedQ || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined
    })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.adminBookings({
      page,
      pageSize,
      status: status || undefined,
      type: type === 'all' ? undefined : type,
      q: debouncedQ || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined
    })
      .then((r) => { if (!cancelled) setData(r); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, pageSize, status, type, debouncedQ, dateFrom, dateTo]);

  useEffect(() => { setPage(1); }, [pageSize, status, type, debouncedQ, dateFrom, dateTo]);

  useEffect(() => {
    if (!selected) { setDetail(null); return; }
    setDetailLoading(true);
    api.adminBookingDetail(selected.type, selected.id)
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [selected]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  const summary = useMemo(() => {
    if (!data) return null;
    const rows = data.rows;
    const paid = rows.filter((r) => r.status === 'paid').length;
    const pending = rows.filter((r) => r.status === 'pending').length;
    const revenue = rows.filter((r) => r.status === 'paid').reduce((s, r) => s + r.amount_rwf, 0);
    return { total: data.total, paid, pending, revenue };
  }, [data]);

  function clearFilters() {
    setStatus('');
    setType('all');
    setQ('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  }

  const activeFilters = [
    status && { key: 'status', label: status, clear: () => setStatus('') },
    type !== 'all' && { key: 'type', label: type, clear: () => setType('all') },
    debouncedQ && { key: 'q', label: `"${debouncedQ}"`, clear: () => setQ('') },
    dateFrom && { key: 'from', label: `from ${dateFrom}`, clear: () => setDateFrom('') },
    dateTo && { key: 'to', label: `to ${dateTo}`, clear: () => setDateTo('') }
  ].filter(Boolean) as any[];

  return (
    <div className="p-6 sm:p-10 max-w-[1600px] mx-auto w-full">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{t('Ingendo zose', 'All Bookings')}</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">{t('Urban na interprovincial', 'Urban and interprovincial bookings')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/validate"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10"
          >
            {t('Genzura bileti', 'Validate ticket')}
          </Link>
          <button
            onClick={fetchBookings}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all hover:-translate-y-0.5"
          >
            <IconRefresh /> {t('Vugurura', 'Refresh')}
          </button>
        </div>
      </header>

      {/* ── SUMMARY TILES ───────────────────────────────────────────────── */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <SummaryTile label={t('Zose', 'Matching')} value={summary.total.toLocaleString()} tone="slate" />
          <SummaryTile label={t('Zishyuwe', 'Paid')} value={summary.paid.toLocaleString()} tone="emerald" />
          <SummaryTile label={t('Zitegereje', 'Pending')} value={summary.pending.toLocaleString()} tone="amber" />
          <SummaryTile
            label={t('Amafaranga (iyi page)', 'Revenue (this page)')}
            value={`${summary.revenue.toLocaleString()} RWF`}
            tone="cyan"
          />
        </div>
      )}

      {/* ── FILTERS ─────────────────────────────────────────────────────── */}
      <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 mb-6">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <SearchInput value={q} onChange={setQ} t={t} />

          <Select
            label={t('Ubwoko', 'Type')}
            value={type}
            onChange={(v: string) => setType(v as any)}
            options={[
              { value: 'all', label: t('Zose', 'All') },
              { value: 'urban', label: t('Mu mujyi', 'Urban') },
              { value: 'intercity', label: t('Interprovincial', 'Interprovincial') }
            ]}
          />

          <Select
            label={t('Imimerere', 'Status')}
            value={status}
            onChange={setStatus}
            options={[
              { value: '', label: t('Zose', 'All statuses') },
              { value: 'paid', label: t('Zishyuwe', 'Paid') },
              { value: 'pending', label: t('Zitegereje', 'Pending') },
              { value: 'cancelled', label: t('Zihagaritswe', 'Cancelled') },
              { value: 'expired', label: t('Zarangiye', 'Expired') },
              { value: 'refunded', label: t('Zasubijwe', 'Refunded') }
            ]}
          />

          <div className="flex items-end gap-2">
            <DateInput label={t('Kuva', 'From')} value={dateFrom} onChange={setDateFrom} />
            <DateInput label={t('Kugera', 'To')} value={dateTo} onChange={setDateTo} />
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
              {t('Filters', 'Filters')}:
            </span>
            {activeFilters.map((f: any) => (
              <button
                key={f.key}
                onClick={f.clear}
                className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-400 transition hover:bg-cyan-500/20 border border-cyan-500/20"
              >
                {f.label}
                <span className="text-cyan-500/50 hover:text-cyan-300"><IconClose /></span>
              </button>
            ))}
            <button
              onClick={clearFilters}
              className="text-[11px] font-bold text-slate-400 hover:text-white transition-colors ml-2"
            >
              {t('Siba byose', 'Clear all')}
            </button>
          </div>
        )}
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400 font-medium mb-6">
          {error}
        </div>
      )}

      {/* ── DATA TABLE ──────────────────────────────────────────────────── */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl">
        {loading && !data ? (
          <SkeletonRows />
        ) : !data || data.rows.length === 0 ? (
          <EmptyState t={t} onClear={clearFilters} hasFilters={activeFilters.length > 0} />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-bold">{t('Kode', 'Reference')}</th>
                    <th className="px-6 py-4 font-bold">{t('Umugenzi', 'Passenger')}</th>
                    <th className="px-6 py-4 font-bold">{t('Urugendo', 'Route')}</th>
                    <th className="px-6 py-4 font-bold">{t('Itariki', 'Travel')}</th>
                    <th className="px-6 py-4 font-bold text-right">{t('Amafaranga', 'Amount')}</th>
                    <th className="px-6 py-4 font-bold">{t('Imimerere', 'Status')}</th>
                    <th className="px-6 py-4 font-bold">{t('Bileti', 'Ticket')}</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.rows.map((r) => (
                    <tr
                      key={`${r.type}-${r.id}`}
                      onClick={() => setSelected({ type: r.type, id: r.id })}
                      className="cursor-pointer transition-colors hover:bg-white/[0.04] group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 flex-shrink-0 rounded-full ${r.type === 'intercity' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]'}`} />
                          <span className="font-mono text-xs text-slate-300 font-medium group-hover:text-white transition-colors">
                            {r.reference}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{r.passenger_name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{r.user_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-md px-2 py-0.5 text-[10px] font-black text-white shadow-sm"
                            style={{ backgroundColor: r.route_color || '#3B82F6' }}
                          >
                            {r.type === 'intercity' ? 'IC' : r.route_code}
                          </span>
                          <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                            {r.type === 'intercity' ? `${r.origin} → ${r.destination}` : r.route_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">
                        {r.trip_departure
                          ? new Date(r.trip_departure).toLocaleString(undefined, {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-white">
                          {r.amount_rwf.toLocaleString()}
                        </span>
                        <span className="ml-1 text-[10px] font-bold text-cyan-500">RWF</span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusChip status={r.status} />
                      </td>
                      <td className="px-6 py-4">
                        {r.ticket_status ? (
                          <TicketChip status={r.ticket_status} />
                        ) : (
                          <span className="text-[10px] text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-600 group-hover:text-cyan-400 transition-colors"><IconChevronRight /></span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <ul className="divide-y divide-white/5 md:hidden">
              {data.rows.map((r) => (
                <li
                  key={`${r.type}-${r.id}`}
                  onClick={() => setSelected({ type: r.type, id: r.id })}
                  className="cursor-pointer px-5 py-4 transition active:bg-white/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${r.type === 'intercity' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                        <span className="font-mono text-[11px] font-bold text-slate-400">{r.reference}</span>
                      </div>
                      <p className="mt-1.5 truncate font-bold text-white">{r.passenger_name}</p>
                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {r.type === 'intercity' ? `${r.origin} → ${r.destination}` : r.route_name}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
                      <StatusChip status={r.status} />
                      <span className="text-sm font-black text-white">
                        {r.amount_rwf.toLocaleString()} <span className="text-[10px] text-cyan-500">RWF</span>
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ── PAGINATION ──────────────────────────────────────────────────── */}
      {data && data.total > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
            <span>
              {t('Kwerekana', 'Showing')}{' '}
              <span className="font-bold text-white">
                {(data.page - 1) * data.pageSize + 1}–{Math.min(data.page * data.pageSize, data.total)}
              </span>{' '}
              {t('muri', 'of')}{' '}
              <span className="font-bold text-white">{data.total.toLocaleString()}</span>
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs font-bold text-white outline-none focus:border-cyan-500/50"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s} / {t('page', 'page')}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <PageBtn onClick={() => setPage(1)} disabled={page === 1} label="«" />
            <PageBtn onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} label="‹" />
            <span className="px-2 text-xs font-medium text-slate-400">
              {t('Urupapuro', 'Page')}{' '}
              <span className="font-bold text-white">{page}</span>{' '}
              {t('muri', 'of')} {totalPages}
            </span>
            <PageBtn onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} label="›" />
            <PageBtn onClick={() => setPage(totalPages)} disabled={page === totalPages} label="»" />
          </div>
        </div>
      )}

      {selected && (
        <DetailDrawer
          selected={selected}
          detail={detail}
          loading={detailLoading}
          onClose={() => setSelected(null)}
          t={t}
        />
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-date-input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; cursor: pointer; }
      `}</style>
    </div>
  );
}

/* ================================================================== */
/*  COMPONENTS                                                         */
/* ================================================================== */

function SummaryTile({ label, value, tone }: { label: string; value: string; tone: 'slate' | 'emerald' | 'amber' | 'cyan' }) {
  const tones = {
    slate: 'text-white',
    emerald: 'text-emerald-400',
    amber: 'text-amber-400',
    cyan: 'text-cyan-400'
  };
  const borders = {
    slate: 'border-white/10',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    cyan: 'border-cyan-500/20 bg-cyan-500/5'
  };
  
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md ${borders[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1.5 text-2xl font-black tracking-tight ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function SearchInput({ value, onChange, t }: any) {
  return (
    <label className="block group">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">
        {t('Shakisha', 'Search')}
      </span>
      <div className="mt-1.5 flex items-center rounded-xl border border-white/10 bg-black/40 px-3 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-500">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ref, name, email, route…"
          className="w-full bg-transparent px-2 py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
        />
        {value && (
          <button onClick={() => onChange('')} className="text-slate-500 hover:text-white transition-colors"><IconClose /></button>
        )}
      </div>
    </label>
  );
}

function Select({ label, value, onChange, options }: any) {
  return (
    <label className="block group">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
      >
        {options.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function DateInput({ label, value, onChange }: any) {
  return (
    <label className="block flex-1 group">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="custom-date-input mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 transition-all"
      />
    </label>
  );
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-red-500/10 text-red-400 border-red-500/20',
    refunded: 'bg-slate-500/10 text-slate-300 border-slate-500/20'
  };
  return (
    <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${map[status] || map.pending}`}>
      {status}
    </span>
  );
}

function TicketChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    issued: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    used: 'bg-slate-500/10 text-slate-300 border-slate-500/20',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    expired: 'bg-red-500/10 text-red-400 border-red-500/20',
    redeemed: 'bg-slate-500/10 text-slate-300 border-slate-500/20'
  };
  return (
    <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider border ${map[status] || map.issued}`}>
      {status}
    </span>
  );
}

function PageBtn({ onClick, disabled, label }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5"
    >
      {label}
    </button>
  );
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-white/5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-6 px-6 py-5">
          <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ t, onClear, hasFilters }: any) {
  return (
    <div className="p-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/5 border border-white/10">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-500" strokeLinecap="round">
          <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" />
        </svg>
      </div>
      <p className="mt-5 font-bold text-white text-lg">
        {hasFilters ? t('Nta ngendo zihuye n’ibisabwa', 'No bookings match your filters') : t('Nta ngendo zirahari', 'No bookings yet')}
      </p>
      <p className="mt-1.5 text-sm text-slate-400">
        {hasFilters
          ? t('Gerageza uhindure filters.', 'Try adjusting the filters.')
          : t('Ingendo zizagaragara hano iyo abagenzi batangiye kugura bileti.', 'Bookings appear here as passengers purchase tickets.')}
      </p>
      {hasFilters && (
        <button onClick={onClear} className="mt-6 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-black transition hover:bg-cyan-400">
          {t('Siba filters', 'Clear filters')}
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/*  DETAIL DRAWER                                                      */
/* ================================================================== */

function DetailDrawer({ selected, detail, loading, onClose, t }: any) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog">
      <div className="absolute inset-0 bg-[#080B15]/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-[#0F1423] shadow-2xl border-l border-white/10 sm:max-w-lg animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <header className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 to-[#0A0D1A] px-6 py-5">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
              {selected.type === 'intercity' ? t('Interprovincial', 'Interprovincial') : t('Mu mujyi', 'Urban')} {t('booking', 'booking')}
            </p>
            <p className="mt-1 truncate font-mono text-lg font-black text-white">
              {detail?.booking?.reference || '…'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <IconClose />
          </button>
        </header>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading && (
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          )}

          {!loading && !detail && (
            <p className="py-12 text-center text-sm font-medium text-slate-400">
              {t('Ntibishobotse kubona amakuru.', 'Could not load booking details.')}
            </p>
          )}

          {!loading && detail && selected.type === 'urban' && <UrbanDetail detail={detail} t={t} />}
          {!loading && detail && selected.type === 'intercity' && <IntercityDetail detail={detail} t={t} />}
        </div>

        {/* Drawer Footer */}
        <footer className="border-t border-white/10 bg-[#0A0D1A] px-6 py-4">
          <p className="text-[10px] font-medium text-slate-500 text-center">
            {t('Kanda Escape cyangwa hanze kugira ngo ufunge.', 'Press Escape or click outside to close.')}
          </p>
        </footer>
      </aside>
    </div>
  );
}

function UrbanDetail({ detail, t }: any) {
  const { booking: b, route, user, ticket } = detail;
  return (
    <div className="space-y-5">
      <Section title={t('Umugenzi', 'Passenger')}>
        <Row label={t('Amazina', 'Name')} value={b.passenger_name} />
        {b.passenger_phone && <Row label={t('Telefone', 'Phone')} value={b.passenger_phone} mono />}
        <Row label={t('Email', 'Email')} value={user?.email || '—'} mono />
        {b.seat_number && <Row label={t('Umwanya', 'Seat')} value={`#${b.seat_number}`} />}
      </Section>

      <Section title={t('Urugendo', 'Route')}>
        <Row label={t('Kode', 'Code')} value={route.code} badgeColor={route.color} />
        <Row label={t('Izina', 'Name')} value={route.name_en} />
        <Row label={t('Kuva', 'From')} value={route.from_stop} />
        <Row label={t('Kugera', 'To')} value={route.to_stop} />
        <Row label={t('Igihe', 'Departure')} value={new Date(b.depart_at).toLocaleString()} />
      </Section>

      <Section title={t('Kwishyura', 'Payment')}>
        <Row label={t('Amafaranga', 'Amount')} value={`${b.amount_rwf.toLocaleString()} RWF`} bold />
        <Row label={t('Imimerere', 'Status')} value={b.status} chip />
        <Row label={t('Byakozwe', 'Created')} value={new Date(b.created_at).toLocaleString()} />
      </Section>

      {ticket && (
        <Section title={t('Bileti', 'Ticket')}>
          <Row label={t('Kode', 'Code')} value={ticket.code} mono />
          <Row label={t('Imimerere', 'Status')} value={ticket.status} chip />
          {ticket.issued_at && <Row label={t('Yatanzwe', 'Issued')} value={new Date(ticket.issued_at).toLocaleString()} />}
          {ticket.used_at && <Row label={t('Yakoreshejwe', 'Used')} value={new Date(ticket.used_at).toLocaleString()} />}
        </Section>
      )}
    </div>
  );
}

function IntercityDetail({ detail, t }: any) {
  const { booking: b, trip, route, company, user, ticket } = detail;
  return (
    <div className="space-y-5">
      <Section title={t('Umugenzi', 'Passenger')}>
        <Row label={t('Amazina', 'Name')} value={b.passenger_name} />
        {b.passenger_phone && <Row label={t('Telefone', 'Phone')} value={b.passenger_phone} mono />}
        {b.passenger_email && <Row label={t('Email', 'Email')} value={b.passenger_email} mono />}
        {b.passenger_id_no && <Row label={t('Indangamuntu', 'National ID')} value={b.passenger_id_no} mono />}
        {b.seat_number && <Row label={t('Umwanya', 'Seat')} value={`#${b.seat_number}`} />}
      </Section>

      <Section title={t('Urugendo', 'Journey')}>
        <Row label={t('Kuva', 'From')} value={`${route.origin_city} · ${route.origin_terminal}`} />
        <Row label={t('Kugera', 'To')} value={`${route.destination_city} · ${route.destination_terminal}`} />
        <Row label={t('Intera', 'Distance')} value={`${route.distance_km} km`} />
        <Row
          label={t('Igihe', 'Duration')}
          value={`${Math.floor(route.duration_min / 60)}h ${route.duration_min % 60}m`}
        />
        <Row label={t('Itariki', 'Departure')} value={new Date(trip.departure_dt).toLocaleString()} />
        <Row label={t('Intara', 'Province')} value={route.province} />
      </Section>

      <Section title={t('Sosiyete', 'Operator')}>
        <Row label={t('Izina', 'Company')} value={company.name} />
        {company.phone && <Row label={t('Telefone', 'Phone')} value={company.phone} mono />}
        <Row label={t('Imodoka', 'Plate')} value={trip.plate_number || '—'} mono />
        {trip.driver_name && <Row label={t('Umudereva', 'Driver')} value={trip.driver_name} />}
        <Row label={t('Ubwoko', 'Class')} value={trip.bus_type} />
      </Section>

      <Section title={t('Kwishyura', 'Payment')}>
        <Row label={t('Amafaranga', 'Amount')} value={`${b.amount_rwf.toLocaleString()} RWF`} bold />
        <Row label={t('Imimerere', 'Status')} value={b.status} chip />
        <Row label={t('Byakozwe', 'Created')} value={new Date(b.created_at).toLocaleString()} />
      </Section>

      {ticket && (
        <Section title={t('Bileti', 'Ticket')}>
          <Row label={t('Kode', 'Code')} value={ticket.code} mono />
          <Row label={t('Imimerere', 'Status')} value={ticket.status} chip />
          {ticket.issued_at && <Row label={t('Yatanzwe', 'Issued')} value={new Date(ticket.issued_at).toLocaleString()} />}
          {ticket.used_at && <Row label={t('Yakoreshejwe', 'Used')} value={new Date(ticket.used_at).toLocaleString()} />}
          {ticket.scanned_plate && <Row label={t('Yasomwe kuri', 'Scanned at')} value={ticket.scanned_plate} mono />}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-cyan-500">{title}</p>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}

function Row({ label, value, bold, mono, chip, badgeColor }: any) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="flex-shrink-0 text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`truncate text-right ${bold ? 'text-base font-black' : 'font-semibold'} text-white ${mono ? 'font-mono text-xs' : ''}`}>
        {badgeColor ? (
          <span className="rounded-md px-2 py-0.5 text-xs font-bold text-white shadow-sm" style={{ backgroundColor: badgeColor }}>
            {value}
          </span>
        ) : chip ? (
          <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
            {value}
          </span>
        ) : value}
      </dd>
    </div>
  );
}

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  const timer = useRef<any>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDebounced(value), ms);
    return () => timer.current && clearTimeout(timer.current);
  }, [value, ms]);
  return debounced;
}