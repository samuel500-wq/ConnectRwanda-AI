'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

type Issue = {
  id: string;
  ts: number;
  level: 'error' | 'warning' | 'info';
  source: string;
  message: string;
  detail: string | null;
  meta: any;
  resolved: boolean;
  resolvedAt: number | null;
  fix: string | null;
};

type ServiceState = { ok: boolean; [k: string]: any };

export default function AdminStatusPage() {
  const { lang } = useI18n();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);

  const [status, setStatus] = useState<any>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [busyFix, setBusyFix] = useState<string | null>(null);

  const [issueFilter, setIssueFilter] = useState<'all' | 'unresolved' | 'error' | 'warning'>('unresolved');

  /* ---------- Load everything ---------- */
  async function loadAll(showSpinner = true) {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    try {
      const [s, i, d] = await Promise.all([
        api.adminSystemStatus().catch(() => null),
        api.adminSystemIssues({
          only_unresolved: issueFilter === 'unresolved' || issueFilter === 'all' ? undefined : undefined,
          level: issueFilter === 'error' || issueFilter === 'warning' ? issueFilter : undefined,
          limit: 50
        }).catch(() => ({ issues: [] })),
        api.adminDiagnostics().catch(() => null)
      ]);
      if (s) setStatus(s);
      setIssues(i.issues || []);
      if (d) setDiagnostics(d);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const id = setInterval(() => loadAll(false), 15000);
    return () => clearInterval(id);
  }, [issueFilter]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  /* ---------- Apply a fix ---------- */
  async function fix(kind: string, successMsg?: string) {
    setBusyFix(kind);
    try {
      const r = await api.adminApplyFix(kind);
      setToast({
        kind: r.ok ? 'ok' : 'err',
        msg: successMsg || r.note || (r.ok ? t('Byakunze.', 'Done.') : t('Byanze.', 'Failed.'))
      });
      if (r.ok) await loadAll(false);
    } catch (e: any) {
      setToast({ kind: 'err', msg: e.message });
    } finally {
      setBusyFix(null);
    }
  }

  /* ---------- Resolve an issue ---------- */
  async function resolveIssue(id: string) {
    try {
      await api.adminResolveIssue(id);
      setIssues((cur) => cur.map((i) => (i.id === id ? { ...i, resolved: true, resolvedAt: Date.now() } : i)));
      setToast({ kind: 'ok', msg: t('Byakemuwe.', 'Marked as resolved.') });
    } catch (e: any) {
      setToast({ kind: 'err', msg: e.message });
    }
  }

  /* ---------- Filtered issues ---------- */
  const filteredIssues = useMemo(() => {
    if (issueFilter === 'unresolved') return issues.filter((i) => !i.resolved);
    if (issueFilter === 'error') return issues.filter((i) => i.level === 'error');
    if (issueFilter === 'warning') return issues.filter((i) => i.level === 'warning');
    return issues;
  }, [issues, issueFilter]);

  /* ---------- Summary counts ---------- */
  const summary = useMemo(() => {
    if (!status) return null;
    const services = ['db', 'ml', 'ai', 'simulator', 'osrm', 'overpass'];
    const healthy = services.filter((s) => status[s]?.ok).length;
    return { healthy, total: services.length };
  }, [status]);

  if (loading && !status) {
    return (
      <div className="p-6 sm:p-10 max-w-[1600px] mx-auto w-full relative z-10 space-y-6">
        <div className="h-10 w-64 animate-pulse rounded-lg bg-white/5" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-3xl bg-white/5 border border-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-[1600px] mx-auto w-full relative z-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {t('Imiterere ya sisitemu', 'System Status')}
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            {t('Kugenzura no gukemura ibibazo by’urubuga.', 'Monitor the platform and repair issues directly.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold border ${
            summary && summary.healthy === summary.total
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
              : summary && summary.healthy > 0
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
              : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
          }`}>
            <span className={`inline-block h-2 w-2 rounded-full ${
              summary && summary.healthy === summary.total ? 'bg-emerald-400'
              : summary && summary.healthy > 0 ? 'bg-amber-400' : 'bg-red-400'
            } ${refreshing ? 'animate-pulse' : ''}`} />
            {summary ? `${summary.healthy} / ${summary.total} ${t('bikora', 'healthy')}` : '—'}
          </span>
          <button
            onClick={() => loadAll(false)}
            disabled={refreshing}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50"
          >
            {refreshing ? t('Turashakisha…', 'Refreshing…') : t('Vugurura', 'Refresh')}
          </button>
        </div>
      </header>

      {/* Service cards */}
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <ServiceCard
          name={t('Database', 'Database')}
          subtitle={`${status?.db?.host || ''} · ${status?.db?.database || ''}`}
          service={status?.db}
          t={t}
          actions={[{ label: t('Ping', 'Ping'), kind: 'reconnect_db' }]}
          onFix={fix}
          busyFix={busyFix}
        />
        <ServiceCard
          name={t('ML service', 'ML service')}
          subtitle={status?.ml?.url || '—'}
          service={status?.ml}
          t={t}
          extra={status?.ml?.model_version && <span className="text-[10px] font-medium text-slate-500">Model v{status.ml.model_version}</span>}
          actions={[{ label: t('Gerageza', 'Test'), kind: 'test_ml' }]}
          onFix={fix}
          busyFix={busyFix}
        />
        <ServiceCard
          name={t('AI provider', 'AI provider')}
          subtitle={status?.ai?.model || '—'}
          service={status?.ai}
          t={t}
          extra={status?.ai?.key_prefix && <span className="text-[10px] font-mono text-slate-500">{status.ai.key_prefix}</span>}
          actions={status?.ai?.configured ? [{ label: t('Gerageza', 'Test'), kind: 'test_ai' }] : []}
          onFix={fix}
          busyFix={busyFix}
        />
        <ServiceCard
          name={t('Fleet simulator', 'Fleet simulator')}
          subtitle={`${status?.simulator?.vehicles || 0} ${t('bisi', 'vehicles')}`}
          service={status?.simulator}
          t={t}
          actions={[{ label: t('Ongera utangire', 'Restart'), kind: 'restart_simulator' }]}
          onFix={fix}
          busyFix={busyFix}
        />
        <ServiceCard
          name="OSRM"
          subtitle={t('Inzira z’imihanda', 'Road routing')}
          service={status?.osrm}
          t={t}
          actions={[{ label: t('Siba cache', 'Clear cache'), kind: 'clear_osrm_cache' }]}
          onFix={fix}
          busyFix={busyFix}
        />
        <ServiceCard
          name="Overpass"
          subtitle={t('Ahantu (OpenStreetMap)', 'Places (OpenStreetMap)')}
          service={status?.overpass}
          t={t}
          actions={[]}
          onFix={fix}
          busyFix={busyFix}
        />
      </section>

      {/* Backend info strip */}
      {status?.backend && (
        <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 mb-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-white">{t('Seriveri', 'Backend Process')}</h2>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Env: {status.backend.env}</span>
          </div>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <InfoCell label="Node" value={status.backend.node_version} />
            <InfoCell label={t('Igihe', 'Uptime')} value={formatUptime(status.backend.uptime_seconds)} />
            <InfoCell label={t('Memory', 'Memory')} value={`${status.backend.memory_mb} MB`} tone={status.backend.memory_mb > 500 ? 'amber' : undefined} />
            <InfoCell label="Port" value={String(status.backend.port)} />
          </dl>
        </section>
      )}

      {/* Database row counts */}
      {status?.db_stats && (
        <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-white">{t('Imibare y’ububiko', 'Database Contents')}</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => fix('purge_positions')} disabled={busyFix === 'purge_positions'} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50">
                {busyFix === 'purge_positions' ? '...' : t('Siba positions za kera', 'Purge old positions')}
              </button>
              <button onClick={() => fix('purge_ai_history')} disabled={busyFix === 'purge_ai_history'} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50">
                {busyFix === 'purge_ai_history' ? '...' : t('Siba AI history', 'Purge AI history')}
              </button>
              <button onClick={() => fix('extend_intercity')} disabled={busyFix === 'extend_intercity'} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50">
                {busyFix === 'extend_intercity' ? '...' : t('Ongera intercity', 'Extend intercity')}
              </button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            <CountCell label={t('Abakoresha', 'Users')} value={status.db_stats.users} />
            <CountCell label={t('Ahantu', 'Stops')} value={status.db_stats.stops} />
            <CountCell label={t('Ingendo', 'Routes')} value={status.db_stats.routes} />
            <CountCell label={t('Imodoka', 'Vehicles')} value={status.db_stats.vehicles} />
            <CountCell label={t('Ingendo za intercity', 'Intercity trips')} value={status.db_stats.intercity_trips} />
            <CountCell label={t('Bookings (urban)', 'Urban bookings')} value={status.db_stats.urban_bookings} />
            <CountCell label={t('Bookings (intercity)', 'Intercity bookings')} value={status.db_stats.intercity_bookings} />
            <CountCell label={t('Positions', 'Vehicle positions')} value={status.db_stats.vehicle_positions} />
            <CountCell label={t('AI messages', 'AI messages')} value={status.db_stats.ai_messages} />
          </dl>
        </section>
      )}

      {/* Diagnostics */}
      {diagnostics && (
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl mb-8">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-white">{t('Kugenzura urubuga', 'Network Diagnostics')}</h2>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                {diagnostics.total === 0 ? t('Nta kibazo kibonetse.', 'No issues detected.') : t(`${diagnostics.total} ibibazo byabonetse.`, `${diagnostics.total} issue${diagnostics.total > 1 ? 's' : ''} detected.`)}
              </p>
            </div>
            <button onClick={() => loadAll(false)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors">
              {t('Ongera ugenzure', 'Re-run')}
            </button>
          </header>

          {diagnostics.issues.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <p className="text-lg font-bold text-white">{t('Byose birasa neza.', 'Everything looks good.')}</p>
              <p className="mt-1 text-sm text-slate-400">{t('Nta kibazo cyabonetse mu bubiko, ingendo cyangwa ibisi.', 'No issues detected in the database, routes or fleet.')}</p>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {diagnostics.issues.map((issue: any, i: number) => (
                <li key={i} className="flex flex-wrap items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <SeverityDot severity={issue.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{issue.message}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{issue.area}</p>
                  </div>
                  {issue.fix && issue.fix !== 'manual' && (
                    <button onClick={() => fix(issue.fix)} disabled={busyFix === issue.fix} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-bold text-white hover:-translate-y-0.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50">
                      {busyFix === issue.fix ? '...' : t('Gukosora', 'Fix now')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Error log */}
      <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white">{t('Ibibazo byanditswe', 'Recorded Issues')}</h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              {status?.error_log ? `${status.error_log.total} ${t('byose', 'total')} · ${status.error_log.unresolved} ${t('bitarakemurwa', 'unresolved')} · ${status.error_log.last_hour} ${t('mu isaha', 'in the last hour')}` : '—'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterTab active={issueFilter === 'unresolved'} onClick={() => setIssueFilter('unresolved')}>{t('Bitarakemurwa', 'Unresolved')}</FilterTab>
            <FilterTab active={issueFilter === 'error'} onClick={() => setIssueFilter('error')}>{t('Amakosa', 'Errors')}</FilterTab>
            <FilterTab active={issueFilter === 'warning'} onClick={() => setIssueFilter('warning')}>{t('Iburira', 'Warnings')}</FilterTab>
            <FilterTab active={issueFilter === 'all'} onClick={() => setIssueFilter('all')}>{t('Byose', 'All')}</FilterTab>
            <button onClick={() => fix('clear_error_log')} disabled={busyFix === 'clear_error_log'} className="ml-2 rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50">
              {t('Siba log', 'Clear')}
            </button>
          </div>
        </header>

        {filteredIssues.length === 0 ? (
          <p className="p-12 text-center text-sm font-medium text-slate-500">
            {issueFilter === 'unresolved' ? t('Nta kibazo kitarakemurwa.', 'No unresolved issues.') : t('Nta makosa yanditswe.', 'No issues logged.')}
          </p>
        ) : (
          <ul className="divide-y divide-white/5">
            {filteredIssues.map((e) => (
              <IssueRow key={e.id} issue={e} onResolve={() => resolveIssue(e.id)} t={t} />
            ))}
          </ul>
        )}
      </section>

      {/* Toast */}
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

/* ================================================================== *
 *  Components
 * ================================================================== */

function ServiceCard({ name, subtitle, service, t, extra, actions, onFix, busyFix }: any) {
  if (!service) {
    return (
      <div className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6">
        <p className="text-base font-bold text-white">{name}</p>
        <p className="mt-1 text-xs font-medium text-slate-500">{subtitle}</p>
        <p className="mt-4 text-sm text-slate-400">{t('Turashakisha…', 'Loading…')}</p>
      </div>
    );
  }

  const ok = service.ok;

  return (
    <div className={`relative overflow-hidden rounded-3xl border bg-[#0A0D1A]/80 backdrop-blur-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] ${
      ok ? 'border-white/10 hover:border-white/20' : 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]'
    }`}>
      {/* Status dot top-right */}
      <span className={`absolute right-6 top-6 flex h-3 w-3 items-center justify-center rounded-full shadow-[0_0_10px_currentColor] ${
        ok ? 'bg-emerald-500 text-emerald-500' : 'bg-red-500 text-red-500'
      }`}>
        {!ok && <span className="absolute inline-block h-3 w-3 animate-ping rounded-full bg-red-500 opacity-60" />}
      </span>

      <p className="pr-8 text-base font-bold text-white">{name}</p>
      <p className="mt-1 truncate text-xs font-medium text-slate-400">{subtitle}</p>
      {extra && <div className="mt-1.5">{extra}</div>}

      <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className={`text-xs font-black uppercase tracking-wider ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {ok ? t('Irakora', 'Operational') : t('Ifunze', 'Down')}
        </span>
        {service.latency_ms != null && (
          <span className="text-xs font-medium text-slate-500">{service.latency_ms} ms</span>
        )}
      </div>

      {!ok && service.error && (
        <p className="mt-3 truncate rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-mono text-red-400">
          {service.error}
        </p>
      )}

      {actions.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map((a: any) => (
            <button key={a.kind} onClick={() => onFix(a.kind)} disabled={busyFix === a.kind} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50">
              {busyFix === a.kind ? '...' : a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value, tone }: any) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</dt>
      <dd className={`mt-1 text-sm font-bold ${tone === 'amber' ? 'text-amber-400' : 'text-white'}`}>{value}</dd>
    </div>
  );
}

function CountCell({ label, value }: any) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <dt className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-black tabular-nums text-white">{value.toLocaleString()}</dd>
    </div>
  );
}

function FilterTab({ active, onClick, children }: any) {
  return (
    <button onClick={onClick} className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${active ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
      {children}
    </button>
  );
}

function SeverityDot({ severity }: any) {
  const cls = severity === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
    : severity === 'warning' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
    : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]';
  return <span className={`inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full ${cls}`} />;
}

function IssueRow({ issue, onResolve, t }: any) {
  const [expanded, setExpanded] = useState(false);
  const color = issue.level === 'error' ? 'text-red-400'
    : issue.level === 'warning' ? 'text-amber-400'
    : 'text-cyan-400';

  return (
    <li className={`px-6 py-4 transition hover:bg-white/[0.02] ${issue.resolved ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-4">
        <SeverityDot severity={issue.level} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <p className={`text-sm font-bold ${color}`}>{issue.message}</p>
            <span className="rounded-md bg-white/5 border border-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {issue.source}
            </span>
            {issue.resolved && (
              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {t('Byakemuwe', 'Resolved')}
              </span>
            )}
          </div>

          {issue.meta?.path && (
            <p className="mt-1 text-xs font-mono text-slate-500">
              {issue.meta.method} {issue.meta.path}
            </p>
          )}

          <div className="mt-2 flex items-center gap-4 text-[11px] font-medium text-slate-500">
            <span>{timeAgo(issue.ts)}</span>
            {issue.detail && (
              <button onClick={() => setExpanded((x) => !x)} className="font-bold text-cyan-500 hover:text-cyan-400 transition-colors">
                {expanded ? t('Hisha', 'Hide') : t('Reba', 'Show')} {t('amakuru', 'details')}
              </button>
            )}
          </div>

          {expanded && issue.detail && (
            <pre className="mt-3 max-h-40 overflow-auto rounded-xl bg-black/40 border border-white/5 p-4 text-xs leading-relaxed text-slate-300 custom-scrollbar">
              {issue.detail}
            </pre>
          )}
        </div>

        {!issue.resolved && (
          <button onClick={onResolve} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10">
            {t('Kemura', 'Resolve')}
          </button>
        )}
      </div>
    </li>
  );
}

/* ================================================================== *
 *  Helpers
 * ================================================================== */

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return `${h}h ${rm}m`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return `${d}d ${rh}h`;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}