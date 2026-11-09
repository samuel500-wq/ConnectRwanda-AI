'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import Modal from '@/components/Modal';
import { useConfirm } from '@/components/Confirm';
import { useAuth } from '@/lib/auth';

type Role = 'passenger' | 'operator' | 'admin';

type User = {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: Role;
  is_active: number | boolean;
  created_at: string;
};

const ROLES: { value: Role; label_rw: string; label_en: string; tone: string }[] = [
  { value: 'passenger', label_rw: 'Umugenzi',  label_en: 'Passenger', tone: 'sky' },
  { value: 'operator',  label_rw: 'Umukoresha', label_en: 'Operator',  tone: 'emerald' },
  { value: 'admin',     label_rw: 'Umuyobozi',  label_en: 'Admin',     tone: 'violet' }
];

// ── DATA MASKING HELPERS (Privacy Protection) ─────────────────────────────
function maskEmail(email: string) {
  if (!email) return '—';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local.length > 2 
    ? `${local[0]}***${local[local.length - 1]}` 
    : `${local[0]}***`;
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string | null) {
  if (!phone) return '—';
  const clean = phone.replace(/\D/g, '');
  if (clean.length < 4) return '***';
  const last3 = clean.slice(-3);
  return `+250 *** *** ${last3}`;
}

export default function AdminUsersPage() {
  const { lang } = useI18n();
  const { user: currentUser } = useAuth();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);
  const confirm = useConfirm();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [stateFilter, setStateFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState<'newest' | 'name' | 'role'>('newest');

  const [selected, setSelected] = useState<User | null>(null);
  const [editing, setEditing] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const r = await api.adminUsers();
      setUsers(r.users);
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

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => Boolean(u.is_active)).length;
    const inactive = total - active;
    const passengers = users.filter((u) => u.role === 'passenger').length;
    const operators = users.filter((u) => u.role === 'operator').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const newThisMonth = users.filter((u) => new Date(u.created_at) >= monthStart).length;
    return { total, active, inactive, passengers, operators, admins, newThisMonth };
  }, [users]);

  const filtered = useMemo(() => {
    let out = users;
    const needle = q.trim().toLowerCase();
    if (needle) {
      out = out.filter((u) =>
        `${u.email} ${u.full_name} ${u.phone || ''}`.toLowerCase().includes(needle)
      );
    }
    if (roleFilter !== 'all') out = out.filter((u) => u.role === roleFilter);
    if (stateFilter === 'active') out = out.filter((u) => Boolean(u.is_active));
    else if (stateFilter === 'inactive') out = out.filter((u) => !u.is_active);

    const sorted = [...out];
    if (sort === 'name') {
      sorted.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else if (sort === 'role') {
      const order: Record<Role, number> = { admin: 0, operator: 1, passenger: 2 };
      sorted.sort((a, b) => order[a.role] - order[b.role] || a.full_name.localeCompare(b.full_name));
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return sorted;
  }, [users, q, roleFilter, stateFilter, sort]);

  async function saveUser(patch: Partial<User>) {
    if (!editing) return;
    setBusy(true);
    try {
      await api.adminUpdateUser(editing.id, {
        role: patch.role,
        is_active: patch.is_active === undefined ? undefined : Boolean(patch.is_active),
        full_name: patch.full_name,
        phone: patch.phone
      });
      setToast({ kind: 'ok', msg: t('Byahinduwe.', 'User updated.') });
      setEditing(null);
      refresh();
    } catch (e: any) {
      const msg = String(e?.message || '');
      setToast({
        kind: 'err',
        msg: msg.includes('cannot_change_own_role')
          ? t('Ntushobora guhindura uruhare rwawe.', 'You cannot change your own role.')
          : msg.includes('cannot_deactivate_self')
          ? t('Ntushobora kwifunga.', 'You cannot deactivate your own account.')
          : msg
      });
    } finally {
      setBusy(false);
    }
  }

  async function quickRole(u: User, role: Role) {
    if (u.id === currentUser?.id && role !== 'admin') {
      setToast({ kind: 'err', msg: t('Ntushobora guhindura uruhare rwawe.', 'You cannot change your own role.') });
      return;
    }
    try {
      await api.adminUpdateUser(u.id, { role });
      setUsers((cur) => cur.map((x) => (x.id === u.id ? { ...x, role } : x)));
      setToast({ kind: 'ok', msg: t('Uruhare rwahinduwe.', 'Role changed.') });
    } catch (e: any) {
      setToast({ kind: 'err', msg: e.message });
    }
  }

  async function toggleActive(u: User) {
    if (u.id === currentUser?.id) {
      setToast({ kind: 'err', msg: t('Ntushobora kwifunga.', 'You cannot deactivate yourself.') });
      return;
    }
    const target = !Boolean(u.is_active);
    const ok = target
      ? true
      : await confirm({
          title: t('Gufunga konti', 'Deactivate account'),
          message: t(`Gufunga konti ya ${u.full_name}?`, `Deactivate ${u.full_name}'s account?`),
          destructive: true,
          confirmLabel: t('Funga', 'Deactivate')
        });
    if (!ok) return;
    try {
      await api.adminUpdateUser(u.id, { is_active: target });
      setUsers((cur) => cur.map((x) => (x.id === u.id ? { ...x, is_active: target ? 1 : 0 } : x)));
      setToast({ kind: 'ok', msg: target ? t('Yafunguwe.', 'User activated.') : t('Yafunzwe.', 'User deactivated.') });
    } catch (e: any) {
      setToast({ kind: 'err', msg: e.message });
    }
  }

  return (
    <div className="p-6 sm:p-10 max-w-[1600px] mx-auto w-full relative z-10">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{t('Abakoresha', 'Users')}</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">{t('Abagenzi, abakoresha n’abayobozi. Amakuru y’ibanga arinzwe.', 'Passengers, operators and administrators. Confidential data is masked.')}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={refresh} className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10">
            {t('Vugurura', 'Refresh')}
          </button>
        </div>
      </header>

      {/* KPI strip */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatTile label={t('Abakoresha bose', 'Total users')} value={stats.total} hint={`${stats.newThisMonth} ${t('bashya uku kwezi', 'new this month')}`} tone="slate" icon={<Users />} />
        <StatTile label={t('Bakora', 'Active')} value={stats.active} hint={`${stats.inactive} ${t('bafunze', 'inactive')}`} tone="emerald" icon={<Check />} />
        <StatTile label={t('Abagenzi', 'Passengers')} value={stats.passengers} hint={t('Abakoresha urubuga', 'End users')} tone="cyan" icon={<Person />} />
        <StatTile label={t('Abayobozi', 'Staff')} value={stats.operators + stats.admins} hint={`${stats.admins} admin · ${stats.operators} operator`} tone="violet" icon={<Shield />} />
      </div>

      {/* Role breakdown bar */}
      {stats.total > 0 && (
        <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 mb-8">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-bold text-white">{t('Ikwirakwizwa ry’uruhare', 'Role distribution')}</h2>
            <span className="text-xs font-medium text-slate-400">{stats.total} {t('abakoresha', 'users')}</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
            {stats.passengers > 0 && <div className="h-full bg-cyan-500 transition-all" style={{ width: `${(stats.passengers / stats.total) * 100}%` }} />}
            {stats.operators > 0 && <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(stats.operators / stats.total) * 100}%` }} />}
            {stats.admins > 0 && <div className="h-full bg-violet-500 transition-all" style={{ width: `${(stats.admins / stats.total) * 100}%` }} />}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs font-medium text-slate-400">
            <Legend dot="bg-cyan-500" label={`${t('Abagenzi', 'Passengers')} · ${stats.passengers}`} />
            <Legend dot="bg-emerald-500" label={`${t('Abakoresha', 'Operators')} · ${stats.operators}`} />
            <Legend dot="bg-violet-500" label={`${t('Abayobozi', 'Admins')} · ${stats.admins}`} />
          </div>
        </section>
      )}

      {/* Filters */}
      <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 mb-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <label className="block group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Shakisha', 'Search')}</span>
            <div className="mt-1.5 flex items-center rounded-xl border border-white/10 bg-black/40 px-3 focus-within:border-cyan-500/50 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-slate-500"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Amazina…', 'Name…')} className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
              {q && <button onClick={() => setQ('')} className="text-slate-500 hover:text-white transition-colors">✕</button>}
            </div>
          </label>

          <label className="block group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Uruhare', 'Role')}</span>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer">
              <option value="all">{t('Bose', 'All roles')}</option>
              {ROLES.map((r) => <option key={r.value} value={r.value}>{lang === 'rw' ? r.label_rw : r.label_en}</option>)}
            </select>
          </label>

          <label className="block group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Imimerere', 'State')}</span>
            <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value as any)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer">
              <option value="all">{t('Bose', 'All')}</option>
              <option value="active">{t('Bakora', 'Active')}</option>
              <option value="inactive">{t('Bafunze', 'Inactive')}</option>
            </select>
          </label>

          <label className="block group">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Gutondeka', 'Sort by')}</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer">
              <option value="newest">{t('Bashya mbere', 'Newest first')}</option>
              <option value="name">{t('Amazina', 'Name')}</option>
              <option value="role">{t('Uruhare', 'Role')}</option>
            </select>
          </label>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400 font-medium mb-6">{error}</div>}

      {/* List */}
      {loading && users.length === 0 ? (
        <SkeletonTable />
      ) : filtered.length === 0 ? (
        <EmptyState t={t} hasFilters={q !== '' || roleFilter !== 'all' || stateFilter !== 'all'} onClear={() => { setQ(''); setRoleFilter('all'); setStateFilter('all'); }} />
      ) : (
        <>
          {/* Desktop Table */}
          <section className="hidden overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl md:block mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-bold">{t('Umukoresha', 'User')}</th>
                    <th className="px-6 py-4 font-bold">{t('Email (Yarinzwe)', 'Email (Masked)')}</th>
                    <th className="px-6 py-4 font-bold">{t('Telefone (Yarinzwe)', 'Phone (Masked)')}</th>
                    <th className="px-6 py-4 font-bold">{t('Uruhare', 'Role')}</th>
                    <th className="px-6 py-4 font-bold">{t('Imimerere', 'State')}</th>
                    <th className="px-6 py-4 font-bold">{t('Byakozwe', 'Joined')}</th>
                    <th className="px-6 py-4 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map((u) => (
                    <tr key={u.id} onClick={() => setSelected(u)} className="cursor-pointer transition-colors hover:bg-white/[0.04] group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar user={u} size={36} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">
                              {u.full_name}
                              {u.id === currentUser?.id && <span className="ml-2 rounded bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-400">YOU</span>}
                            </p>
                            <p className="text-[10px] font-medium text-slate-500 mt-0.5">#{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-medium text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/5">{maskEmail(u.email)}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-400">
                        {u.phone ? <span className="font-mono bg-white/5 px-2 py-1 rounded-md border border-white/5">{maskPhone(u.phone)}</span> : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <RoleChip role={u.role} lang={lang} />
                      </td>
                      <td className="px-6 py-4">
                        <StateChip active={Boolean(u.is_active)} t={t} />
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-500">
                        {new Date(u.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => setEditing(u)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10">
                            {t('Hindura', 'Edit')}
                          </button>
                          {u.id !== currentUser?.id && (
                            <button onClick={() => toggleActive(u)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition border ${u.is_active ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                              {u.is_active ? t('Funga', 'Disable') : t('Kora', 'Enable')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mobile Cards */}
          <ul className="space-y-4 md:hidden">
            {filtered.map((u) => (
              <li key={u.id} className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 p-5 backdrop-blur-md">
                <div onClick={() => setSelected(u)} className="cursor-pointer">
                  <div className="flex items-start gap-4">
                    <Avatar user={u} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{u.full_name}</p>
                      <p className="truncate font-mono text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded inline-block mt-1">{maskEmail(u.email)}</p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <RoleChip role={u.role} lang={lang} />
                        <StateChip active={Boolean(u.is_active)} t={t} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2 border-t border-white/5 pt-4" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => setEditing(u)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-white/10">{t('Hindura', 'Edit')}</button>
                  {u.id !== currentUser?.id && (
                    <button onClick={() => toggleActive(u)} className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${u.is_active ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'}`}>
                      {u.is_active ? t('Funga', 'Disable') : t('Kora', 'Enable')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Drawer & Modal */}
      {selected && <UserDrawer user={selected} lang={lang} t={t} isSelf={selected.id === currentUser?.id} onClose={() => setSelected(null)} onEdit={() => { setEditing(selected); setSelected(null); }} onQuickRole={(role) => quickRole(selected, role)} onToggleActive={() => toggleActive(selected)} />}
      {editing && <EditUserModal user={editing} setUser={setEditing} isSelf={editing.id === currentUser?.id} onSave={saveUser} onCancel={() => setEditing(null)} busy={busy} lang={lang} t={t} />}

      {toast && <div className={`fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-6 py-3 text-sm font-bold shadow-2xl border ${toast.kind === 'ok' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} backdrop-blur-md`}>{toast.msg}</div>}
    </div>
  );
}

/* ================================================================== */
/*  COMPONENTS                                                        */
/* ================================================================== */

function Avatar({ user, size = 36 }: { user: User; size?: number }) {
  const initials = user.full_name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const palettes: Record<Role, string> = {
    admin: 'from-violet-500 to-violet-700 shadow-[0_0_15px_rgba(139,92,246,0.3)]',
    operator: 'from-emerald-500 to-emerald-700 shadow-[0_0_15px_rgba(16,185,129,0.3)]',
    passenger: 'from-cyan-500 to-cyan-700 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
  };
  return (
    <span className={`flex flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-black text-black ${palettes[user.role]}`} style={{ width: size, height: size }}>
      {initials || 'U'}
    </span>
  );
}

function RoleChip({ role, lang }: { role: Role; lang: 'rw' | 'en' }) {
  const map: Record<Role, { bg: string; label_rw: string; label_en: string }> = {
    admin: { bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20', label_rw: 'Umuyobozi', label_en: 'Admin' },
    operator: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label_rw: 'Umukoresha', label_en: 'Operator' },
    passenger: { bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', label_rw: 'Umugenzi', label_en: 'Passenger' }
  };
  const r = map[role];
  return <span className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${r.bg}`}>{lang === 'rw' ? r.label_rw : r.label_en}</span>;
}

function StateChip({ active, t }: { active: boolean; t: any }) {
  return <span className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-black uppercase tracking-wider border ${active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>{active ? t('Yemewe', 'Active') : t('Yafunzwe', 'Inactive')}</span>;
}

function StatTile({ label, value, hint, tone, icon }: any) {
  const styles = {
    slate: 'text-white border-white/10 bg-white/[0.02]',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
    violet: 'text-violet-400 border-violet-500/20 bg-violet-500/5'
  };
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md ${styles[tone as keyof typeof styles]}`}>
      <div className="flex items-start justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>{icon && <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles[tone as keyof typeof styles].split(' ')[0]}`}>{icon}</span>}</div>
      <p className={`mt-2 text-3xl font-black tracking-tight ${styles[tone as keyof typeof styles].split(' ')[0]}`}>{value.toLocaleString()}</p>
      {hint && <p className="mt-1 text-[10px] font-medium text-slate-500">{hint}</p>}
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`inline-block h-2 w-2 rounded-full ${dot}`} />{label}</span>;
}

function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl mb-8">
      <div className="divide-y divide-white/5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-6 px-6 py-5">
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 w-40 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-32 animate-pulse rounded bg-white/10" />
            <div className="ml-auto h-4 w-20 animate-pulse rounded bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ t, hasFilters, onClear }: any) {
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-500"><Users /></div>
      <p className="mt-6 text-xl font-bold text-white">{hasFilters ? t('Nta mukoresha uhuye n’ibisabwa', 'No users match your filters') : t('Nta bakoresha barahari', 'No users yet')}</p>
      <p className="mt-2 text-sm text-slate-400">{hasFilters ? t('Gerageza uhindure ibisabwa.', 'Try adjusting the filters.') : t('Abakoresha bazagaragara hano iyo biyandikishije.', 'Users appear here when they register.')}</p>
      {hasFilters && <button onClick={onClear} className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-cyan-400 transition-colors">{t('Siba filters', 'Clear filters')}</button>}
    </div>
  );
}

function UserDrawer({ user: u, lang, t, isSelf, onClose, onEdit, onQuickRole, onToggleActive }: any) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog">
      <div className="absolute inset-0 bg-[#080B15]/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col overflow-hidden bg-[#0F1423] shadow-2xl border-l border-white/10 sm:max-w-lg animate-in slide-in-from-right duration-300">
        <header className="relative overflow-hidden bg-gradient-to-br from-cyan-950/40 to-[#0A0D1A] px-6 py-6 border-b border-white/10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
          <button onClick={onClose} className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
          <div className="relative flex items-center gap-4">
            <Avatar user={u} size={56} />
            <div className="min-w-0">
              <p className="truncate text-lg font-bold text-white">{u.full_name}</p>
              <p className="truncate font-mono text-xs text-slate-400 mt-0.5 bg-black/40 px-2 py-0.5 rounded inline-block">{maskEmail(u.email)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <RoleChip role={u.role} lang={lang} />
                <StateChip active={Boolean(u.is_active)} t={t} />
                {isSelf && <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-cyan-400 border border-cyan-500/30">You</span>}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-6 custom-scrollbar">
          <Section title={t('Amakuru', 'Account')}>
            <Row label={t('ID', 'User ID')} value={`#${u.id}`} mono />
            <Row label={t('Telefone', 'Phone')} value={maskPhone(u.phone)} mono />
            <Row label={t('Byakozwe', 'Joined')} value={new Date(u.created_at).toLocaleString()} />
            <div className="mt-2 text-[10px] text-amber-500 font-medium bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> {t('PII is masked for data privacy.', 'PII is masked for data privacy.')}
            </div>
          </Section>

          <Section title={t('Uruhare', 'Role')}>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => (
                <button key={r.value} onClick={() => onQuickRole(r.value)} disabled={u.role === r.value || (isSelf && r.value !== 'admin')} className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 transition disabled:cursor-not-allowed ${u.role === r.value ? 'border-white bg-white/5' : 'border-white/10 bg-transparent hover:border-white/30 disabled:opacity-40'}`}>
                  <span className={`inline-block h-2 w-2 rounded-full ${r.value === 'admin' ? 'bg-violet-500' : r.value === 'operator' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                  <span className="text-[11px] font-bold text-white">{lang === 'rw' ? r.label_rw : r.label_en}</span>
                </button>
              ))}
            </div>
          </Section>

          <Section title={t('Umutekano', 'Security')}>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-white">{Boolean(u.is_active) ? t('Konti irakora', 'Account is active') : t('Konti yafunzwe', 'Account is deactivated')}</p>
              </div>
              {!isSelf && (
                <button onClick={onToggleActive} className={`flex-shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition border ${u.is_active ? 'border-amber-500/20 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'}`}>
                  {u.is_active ? t('Funga konti', 'Deactivate') : t('Kora konti', 'Activate')}
                </button>
              )}
            </div>
          </Section>
        </div>

        <footer className="flex items-center justify-between gap-2 border-t border-white/10 bg-[#0A0D1A] px-6 py-4">
          <p className="text-[10px] font-medium text-slate-500">{t('Kanda Escape kugira ngo ufunge.', 'Press Escape to close.')}</p>
          <button onClick={onEdit} className="rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-black transition hover:bg-cyan-400">{t('Hindura amakuru', 'Edit details')}</button>
        </footer>
      </aside>
    </div>
  );
}

function Section({ title, children }: any) {
  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-cyan-500">{title}</p>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, value, mono }: any) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="flex-shrink-0 text-xs font-medium text-slate-500">{label}</span>
      <span className={`truncate text-right font-bold text-white ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}

function EditUserModal({ user: u, isSelf, onSave, onCancel, busy, lang, t }: any) {
  const [fullName, setFullName] = useState(u.full_name || '');
  const [role, setRole] = useState<Role>(u.role);
  const [active, setActive] = useState(Boolean(u.is_active));

  return (
    <Modal open onClose={onCancel} title={t('Hindura umukoresha', 'Edit user')} wide footer={<div className="flex gap-3 w-full"><button onClick={onCancel} className="flex-1 rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">{t('Reka', 'Cancel')}</button><button onClick={() => onSave({ full_name: fullName.trim(), role, is_active: active })} disabled={busy || !fullName.trim()} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">{busy ? t('Turabika…', 'Saving…') : t('Bika', 'Save')}</button></div>}>
      <div className="bg-[#0A0D1A] -m-6 p-6 sm:p-8 rounded-t-2xl space-y-6">
        
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">{t('Igaragaza', 'Preview')}</p>
          <div className="flex items-center gap-4">
            <Avatar user={{ ...u, full_name: fullName || u.full_name, role }} size={48} />
            <div className="min-w-0">
              <p className="truncate font-bold text-white text-base">{fullName || u.full_name}</p>
              <p className="truncate font-mono text-xs text-slate-400 mt-1">{maskEmail(u.email)}</p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-2">
              <RoleChip role={role} lang={lang} />
              <StateChip active={active} t={t} />
            </div>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-bold text-slate-400">{t('Amazina yombi', 'Full name')} <span className="text-cyan-500">*</span></span>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all" maxLength={120} />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-slate-400">{t('Email', 'Email (Read-only)')}</span>
          <input value={maskEmail(u.email)} readOnly disabled className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/5 bg-black/20 px-4 py-3 font-mono text-sm text-slate-500" />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-slate-400">{t('Telefone', 'Phone (Read-only)')}</span>
          <input value={maskPhone(u.phone)} readOnly disabled className="mt-2 w-full cursor-not-allowed rounded-xl border border-white/5 bg-black/20 px-4 py-3 font-mono text-sm text-slate-500" />
        </label>

        <div>
          <p className="text-xs font-bold text-slate-400 mb-3">{t('Uruhare', 'Role')} <span className="text-cyan-500">*</span></p>
          <div className="grid grid-cols-3 gap-3">
            {ROLES.map((r) => {
              const disabled = isSelf && r.value !== 'admin';
              return (
                <button key={r.value} type="button" onClick={() => !disabled && setRole(r.value)} disabled={disabled} className={`flex flex-col items-center gap-2 rounded-xl border-2 px-2 py-4 transition disabled:cursor-not-allowed disabled:opacity-40 ${role === r.value ? 'border-white bg-white/5' : 'border-white/10 bg-transparent hover:border-white/30'}`}>
                  <span className={`inline-block h-3 w-3 rounded-full ${r.value === 'admin' ? 'bg-violet-500' : r.value === 'operator' ? 'bg-emerald-500' : 'bg-cyan-500'}`} />
                  <span className="text-xs font-bold text-white">{lang === 'rw' ? r.label_rw : r.label_en}</span>
                </button>
              );
            })}
          </div>
        </div>

        <label className={`flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/20 p-5 cursor-pointer hover:bg-white/5 transition-colors ${isSelf ? 'opacity-60' : ''}`}>
          <div>
            <p className="text-sm font-bold text-white">{t('Konti irakora', 'Account is active')}</p>
          </div>
          <button type="button" disabled={isSelf} onClick={() => setActive(!active)} className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors ${active ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-700'}`}>
            <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? 'left-6' : 'left-1'}`} />
          </button>
        </label>
      </div>
    </Modal>
  );
}

function Users() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function Check() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>; }
function Person() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>; }
function Shield() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 6v6c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6l-8-4Z" /><path d="m9 12 2 2 4-4" /></svg>; }