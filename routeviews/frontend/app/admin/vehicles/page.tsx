'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import Modal from '@/components/Modal';
import { useConfirm } from '@/components/Confirm';

// ── PREMIUM ICONS ─────────────────────────────────────────────────────────
const IconSearch = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IconWrench = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>;
const IconAI = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
const IconVehicles = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10H4V6Z"/><path d="M4 12h16M8 20v-2M16 20v-2"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/></svg>;
const IconTicket = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/></svg>;
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IconClock = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const IconPlus = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;

const RWANDA_CITIES = [
  'Kigali', 'Musanze', 'Rubavu', 'Huye', 'Muhanga', 'Nyanza', 'Rusizi', 'Nyagatare', 'Karongi', 'Rwamagana', 'Kayonza', 'Gisagara', 'Ngororero', 'Nyamagabe', 'Ruhango', 'Nyamasheke', 'Rutsiro', 'Gatsibo', 'Kirehe', 'Bugesera', 'Ngoma'
];

export default function AdminVehiclesPage() {
  const { lang } = useI18n();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);
  const confirm = useConfirm();

  const [activeTab, setActiveTab] = useState<'fleet' | 'ticketing'>('fleet');
  const [mounted, setMounted] = useState(false);

  // ── FLEET STATE ──
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [liveById, setLiveById] = useState<Map<number, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('plate');
  const [editing, setEditing] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  // ── TICKETING STATE ──
  const [trips, setTrips] = useState<any[]>([]);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [tripBusy, setTripBusy] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(id);
  }, [toast]);

  async function loadVehicles() {
    setLoading(true);
    setError(null);
    try { const r = await api.adminListVehicles(); setVehicles(r.vehicles || []); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function loadLive() {
    try {
      const r = await api.vehicles();
      const m = new Map<number, any>();
      for (const v of r.vehicles) m.set(v.vehicle_id, v);
      setLiveById(m);
    } catch { /* ignore */ }
  }

  async function loadTrips() {
    try {
      const r = await api.adminListIntercityTrips();
      setTrips(r.trips || []);
    } catch (e: any) {
      console.error('Failed to load trips', e);
    }
  }

  useEffect(() => {
    loadVehicles();
    loadTrips();
    const id = setInterval(loadLive, 5000);
    return () => clearInterval(id);
  }, []);

  const enriched = useMemo(() => {
    return vehicles.map((v) => {
      const live = liveById.get(v.id);
      if (!live) return { ...v, lat: null, lng: null, speed_kmh: null, source: null, age_seconds: null, route_code: null, route_color: null, passengers: null, next_stop: null, simulated: false };
      return { ...v, lat: live.lat, lng: live.lng, speed_kmh: live.speed_kmh, source: live.source, age_seconds: live.age_seconds, route_code: live.route_code, route_color: live.color_hex, passengers: live.passengers, next_stop: live.next_stop?.name_en || null, simulated: !!live.simulated };
    });
  }, [vehicles, liveById]);

  const filtered = useMemo(() => {
    let out = enriched;
    const needle = q.trim().toLowerCase();
    if (needle) out = out.filter((v) => `${v.plate} ${v.label} ${v.route_code || ''} ${v.next_stop || ''}`.toLowerCase().includes(needle));
    if (statusFilter !== 'all') out = out.filter((v) => v.status === statusFilter);
    if (sourceFilter === 'live') out = out.filter((v) => v.source === 'gps');
    else if (sourceFilter === 'simulated') out = out.filter((v) => v.simulated);
    else if (sourceFilter === 'offline') out = out.filter((v) => !v.source);
    const sorted = [...out];
    if (sort === 'capacity') sorted.sort((a, b) => b.capacity - a.capacity);
    else if (sort === 'activity') sorted.sort((a, b) => (a.age_seconds ?? 99999) - (b.age_seconds ?? 99999));
    else sorted.sort((a, b) => a.plate.localeCompare(b.plate));
    return sorted;
  }, [enriched, q, statusFilter, sourceFilter, sort]);

  const stats = useMemo(() => {
    const total = enriched.length;
    const live = enriched.filter((v) => v.source).length;
    const simulated = enriched.filter((v) => v.simulated).length;
    const gps = enriched.filter((v) => v.source === 'gps').length;
    const offline = total - live;
    const inMaint = enriched.filter((v) => v.status === 'maintenance').length;
    const totalCapacity = enriched.reduce((s, v) => s + v.capacity, 0);
    const activePassengers = enriched.reduce((s, v) => s + (v.passengers || 0), 0);
    return { total, live, simulated, gps, offline, inMaint, totalCapacity, activePassengers };
  }, [enriched]);

  async function saveVehicle() {
    if (!editing) return;
    const payload = { plate: (editing.plate || '').trim().toUpperCase(), label: (editing.label || '').trim(), capacity: Number(editing.capacity) || 30, status: editing.status || 'idle' };
    if (!payload.plate || !payload.label || payload.capacity < 1) { setToast({ kind: 'err', msg: 'Fill in all required fields.' }); return; }
    setBusy(true);
    try {
      if (editing.id) { await api.adminUpdateVehicle(editing.id, payload); setToast({ kind: 'ok', msg: 'Vehicle updated.' }); }
      else { await api.adminCreateVehicle(payload); setToast({ kind: 'ok', msg: 'Vehicle added.' }); }
      setEditing(null); loadVehicles();
    } catch (e: any) { setToast({ kind: 'err', msg: e.message }); } finally { setBusy(false); }
  }

  async function quickStatus(v: any, status: string) {
    try { await api.adminUpdateVehicle(v.id, { status }); setVehicles((cur) => cur.map((x) => (x.id === v.id ? { ...x, status } : x))); setToast({ kind: 'ok', msg: 'Status changed.' }); }
    catch (e: any) { setToast({ kind: 'err', msg: e.message }); }
  }

  async function removeVehicle(v: any) {
    const ok = await confirm({ title: 'Delete vehicle', message: `Delete ${v.plate}?`, destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try { await api.adminDeleteVehicle(v.id); setToast({ kind: 'ok', msg: 'Vehicle deleted.' }); loadVehicles(); }
    catch (e: any) { setToast({ kind: 'err', msg: e.message }); }
  }

  // ── REGISTER BUS ROUTE ──
  async function saveTrip() {
    if (!editingTrip) return;
    const plate = (editingTrip.vehicle_id || '').trim().toUpperCase();
    const origin = (editingTrip.origin_city || '').trim();
    const dest = (editingTrip.destination_city || '').trim();
    const seats = Number(editingTrip.total_seats);
    const price = Number(editingTrip.price_rwf);

    if (!plate || !origin || !dest || !editingTrip.departure_dt || !seats || seats < 1 || !price || price < 1) {
      setToast({ kind: 'err', msg: 'Fill in ALL fields correctly.' }); 
      return;
    }

    setTripBusy(true);
    try {
      const payload = { 
        vehicle_id: plate, 
        origin_city: origin, 
        destination_city: dest, 
        departure_dt: editingTrip.departure_dt, 
        price_rwf: price, 
        total_seats: seats 
      };
      
      await api.adminCreateIntercityTrip(payload);
      
      setToast({ kind: 'ok', msg: 'Bus registered successfully!' });
      setEditingTrip(null); 
      loadTrips();
    } catch (e: any) { 
      setToast({ kind: 'err', msg: e.message || 'Failed to save bus. Check backend logs.' }); 
    } finally { 
      setTripBusy(false); 
    }
  }

  async function removeTrip(id: number) {
    const ok = await confirm({ title: 'Delete bus route', message: 'Delete this bus route?', destructive: true, confirmLabel: 'Delete' });
    if (!ok) return;
    try { 
      await api.adminDeleteIntercityTrip(id); 
      setToast({ kind: 'ok', msg: 'Bus route deleted.' }); 
      loadTrips(); 
    }
    catch (e: any) { setToast({ kind: 'err', msg: e.message }); }
  }

  if (!mounted) return null;

  return (
    <div className="p-6 sm:p-10 max-w-[1600px] mx-auto w-full relative z-10">
      
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{t('Ibinyabiziga', 'Fleet & Ticketing')}</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">{t('Gucunga ibisi by’umujyi n’ingendo z’intara.', 'Manage urban fleet and interprovincial ticketing.')}</p>
        </div>
        
        <div className="flex bg-[#0A0D1A] border border-white/10 rounded-xl p-1 shadow-inner">
          <button onClick={() => setActiveTab('fleet')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'fleet' ? 'bg-white/10 text-white shadow-sm' : 'text-slate-500 hover:text-white'}`}>
            <IconVehicles /> {t('Urubuga rwa Kigali', 'Urban Fleet')}
          </button>
          <button onClick={() => setActiveTab('ticketing')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'ticketing' ? 'bg-cyan-500/20 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)] border border-cyan-500/30' : 'text-slate-500 hover:text-white'}`}>
            <IconTicket /> {t('Ingendo z’intara', 'Interprovincial Buses')}
          </button>
        </div>
      </header>

      {activeTab === 'fleet' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-end gap-3 mb-6">
            <Link href="/map" className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10">{t('Reba ku ikarita', 'Open map')}</Link>
            <button onClick={() => setEditing({ status: 'idle', capacity: 30 })} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:-translate-y-0.5">+ {t('Imodoka nshya', 'New vehicle')}</button>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <StatTile label={t('Imodoka zose', 'Total vehicles')} value={stats.total} hint={`${stats.totalCapacity} ${t('imyanya', 'seats')}`} tone="slate" icon={<IconVehicles />} />
            <StatTile label={t('Ziri gukora ubu', 'Live now')} value={stats.live} hint={`${stats.simulated} ${t('ibigereranyo', 'simulated')}`} tone="emerald" pulse icon={<IconAI />} />
            <StatTile label={t('Abagenzi mu bisi', 'Passengers aboard')} value={stats.activePassengers} hint={t('Ku bisi zikora gusa', 'Only on live vehicles')} tone="cyan" icon={<IconUsers />} />
            <StatTile label={t('Iri mu kubungabunga', 'In maintenance')} value={stats.inMaint} hint={`${stats.offline} ${t('zitari ku murongo', 'offline')}`} tone="amber" icon={<IconWrench />} />
          </div>

          <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 mb-8">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <label className="block group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Shakisha', 'Search')}</span>
                <div className="mt-1.5 flex items-center rounded-xl border border-white/10 bg-black/40 px-3 focus-within:border-cyan-500/50 transition-all">
                  <span className="text-slate-500"><IconSearch /></span>
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Nomero, izina…', 'Plate, label…')} className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-600" />
                </div>
              </label>
              <label className="block group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Imimerere', 'Status')}</span>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer">
                  <option value="all">{t('Zose', 'All statuses')}</option>
                  <option value="active">{t('Zikora', 'Active')}</option>
                  <option value="idle">{t('Zitegereje', 'Idle')}</option>
                  <option value="maintenance">{t('Mu kubungabunga', 'Maintenance')}</option>
                  <option value="offline">{t('Zifunze', 'Offline')}</option>
                </select>
              </label>
              <label className="block group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Akamaro', 'Feed')}</span>
                <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer">
                  <option value="all">{t('Byose', 'All feeds')}</option>
                  <option value="live">{t('GPS gusa', 'GPS only')}</option>
                  <option value="simulated">{t('Ibigereranyo', 'Simulated only')}</option>
                  <option value="offline">{t('Zitari ku murongo', 'Offline only')}</option>
                </select>
              </label>
              <label className="block group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">{t('Gutondeka', 'Sort by')}</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none cursor-pointer">
                  <option value="plate">{t('Nomero', 'Plate')}</option>
                  <option value="capacity">{t('Ubushobozi', 'Capacity')}</option>
                  <option value="activity">{t('Ibikorwa vuba', 'Recent')}</option>
                </select>
              </label>
            </div>
          </section>

          {loading && vehicles.length === 0 ? <SkeletonGrid /> : filtered.length === 0 ? <EmptyState t={t} hasFilters={q !== '' || statusFilter !== 'all' || sourceFilter !== 'all'} onClear={() => { setQ(''); setStatusFilter('all'); setSourceFilter('all'); }} onCreate={() => setEditing({ status: 'idle', capacity: 30 })} /> : (
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((v) => <li key={v.id}><VehicleCard vehicle={v} lang={lang} t={t} onEdit={() => setEditing(v)} onDelete={() => removeVehicle(v)} onQuickStatus={(s: any) => quickStatus(v, s)} /></li>)}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'ticketing' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-end gap-3 mb-6">
            <button 
              onClick={() => setEditingTrip({ total_seats: '', price_rwf: '', vehicle_id: '', origin_city: '', destination_city: '', departure_dt: '' })} 
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition hover:-translate-y-0.5"
            >
              <IconPlus /> {t('Kwiyandikisha Bisi', 'Register New Bus')}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 p-6 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Registered Buses</p>
              <p className="mt-2 text-4xl font-black text-white">{trips.length}</p>
            </div>
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-6 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Seats Available</p>
              <p className="mt-2 text-4xl font-black text-emerald-400">
                {trips.reduce((s, t) => s + (Number(t.available_seats) || 0), 0)}
              </p>
            </div>
            <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-6 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Est. Revenue</p>
              <p className="mt-2 text-4xl font-black text-cyan-400">
                {trips.reduce((s, t) => s + ((Number(t.price_rwf) || 0) * ((Number(t.total_seats) || 0) - (Number(t.available_seats) || 0))), 0).toLocaleString()} <span className="text-sm">RWF</span>
              </p>
            </div>
          </div>

          <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/[0.02] text-[10px] uppercase tracking-widest text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 font-bold">Bus</th>
                    <th className="px-6 py-4 font-bold">Route</th>
                    <th className="px-6 py-4 font-bold">Departure</th>
                    <th className="px-6 py-4 font-bold">Price</th>
                    <th className="px-6 py-4 font-bold text-center">Seats</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {trips.map((trip) => (
                    <tr key={trip.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-6 py-4"><p className="font-mono text-xs font-bold text-white">{trip.vehicle_id || '—'}</p></td>
                      <td className="px-6 py-4 font-bold text-white">{trip.origin_city || '—'} <span className="text-slate-500 mx-1">→</span> {trip.destination_city || '—'}</td>
                      <td className="px-6 py-4">
                        {trip.departure_dt ? (
                          <div className="flex items-center gap-2 text-slate-300">
                            <IconCalendar /> {new Date(trip.departure_dt).toLocaleDateString()} 
                            <IconClock /> {new Date(trip.departure_dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        ) : <span className="text-slate-500">—</span>}
                      </td>
                      <td className="px-6 py-4 font-bold text-cyan-400">{trip.price_rwf ? `${Number(trip.price_rwf).toLocaleString()} RWF` : '—'}</td>
                      <td className="px-6 py-4 text-center"><span className="inline-block rounded-md bg-white/5 border border-white/10 px-2 py-1 text-[10px] font-bold text-slate-300">{trip.available_seats || 0} / {trip.total_seats || 0}</span></td>
                      <td className="px-6 py-4 text-right"><div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity"><button onClick={() => removeTrip(trip.id)} className="rounded-lg border border-transparent p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20"><IconTrash /></button></div></td>
                    </tr>
                  ))}
                  {trips.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-16 text-center"><IconTicket className="w-14 h-14 mx-auto mb-4 text-slate-600" /><p className="text-lg font-bold text-white">No buses registered yet</p><p className="mt-2 text-sm text-slate-400">Click "Register New Bus" above to add your first interprovincial bus.</p></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {editing && <VehicleModal editing={editing} setEditing={setEditing} onSave={saveVehicle} onCancel={() => setEditing(null)} busy={busy} lang={lang} t={t} />}
      {editingTrip && <TripModal editing={editingTrip} setEditing={setEditingTrip} onSave={saveTrip} onCancel={() => setEditingTrip(null)} busy={tripBusy} t={t} />}

      {toast && <div className={`fixed bottom-8 left-1/2 z-[100] -translate-x-1/2 rounded-xl px-6 py-3 text-sm font-bold shadow-2xl border ${toast.kind === 'ok' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'} backdrop-blur-md`}>{toast.msg}</div>}
    </div>
  );
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────────

function StatTile({ label, value, hint, tone, pulse, icon }: any) {
  const styles = { 
    slate: 'text-white border-white/10 bg-white/[0.02]', 
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5', 
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5', 
    amber: 'text-amber-400 border-amber-500/20 bg-amber-500/5' 
  };
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md ${styles[tone as keyof typeof styles]}`}>
      <div className="flex items-start justify-between gap-3"><p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>{icon && <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${styles[tone as keyof typeof styles].split(' ')[0]}`}>{icon}</span>}</div>
      <div className="mt-2 flex items-baseline gap-2"><p className={`text-3xl font-black tracking-tight ${styles[tone as keyof typeof styles].split(' ')[0]}`}>{value.toLocaleString()}</p>{pulse && value > 0 && <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-500" />}</div>
      {hint && <p className="mt-1 text-[10px] font-medium text-slate-500">{hint}</p>}
    </div>
  );
}

function VehicleCard({ vehicle: v, lang, t, onEdit, onDelete, onQuickStatus }: any) {
  const isLive = !!v.source;
  const statusTone = statusStyles(v.status, t);
  const occupancy = v.passengers != null && v.capacity > 0 ? v.passengers / v.capacity : null;
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]">
      <div className="h-1.5 w-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: v.route_color || statusTone.bar, color: v.route_color || statusTone.bar }} />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-300"><IconVehicles /></span><div><p className="font-mono text-sm font-black tracking-wider text-white">{v.plate}</p><p className="truncate text-xs font-medium text-slate-400 mt-0.5">{v.label}</p></div></div>
          <div className="flex flex-col items-end gap-1.5"><span className={`rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider border ${statusTone.chip}`}>{statusTone.label}</span></div>
        </div>
        {isLive && v.route_code ? (
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-2"><span className="flex h-6 min-w-[34px] items-center justify-center rounded-md px-2 text-[10px] font-bold text-white" style={{ backgroundColor: v.route_color || '#0ea5e9' }}>{v.route_code}</span>{v.next_stop && <p className="truncate text-xs font-medium text-slate-400">Next: <span className="text-white">{v.next_stop}</span></p>}</div>
            {occupancy != null && <div><div className="flex items-baseline justify-between text-[10px] font-bold mb-1"><span className="text-slate-500">Passengers</span><span className="text-white">{v.passengers} / {v.capacity}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.round(occupancy * 100))}%`, backgroundColor: occupancy > 0.85 ? '#f59e0b' : occupancy > 0.6 ? '#0ea5e9' : '#10b981' }} /></div></div>}
          </div>
        ) : (
          <div className="flex flex-1 flex-col justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] py-5 text-center mb-6"><p className="text-xs font-medium text-slate-500">Offline or unassigned</p></div>
        )}
        <div className="mt-auto flex items-center gap-2 border-t border-white/5 pt-4"><button onClick={onEdit} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-bold text-slate-300 hover:bg-white/10 transition-colors">Edit</button><button onClick={onDelete} className="rounded-xl border border-transparent p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"><IconTrash /></button></div>
      </div>
    </div>
  );
}

function VehicleModal({ editing, setEditing, onSave, onCancel, busy, lang, t }: any) {
  const set = (patch: any) => setEditing({ ...editing, ...patch });
  return (
    <Modal open onClose={onCancel} title={editing.id ? `Edit ${editing.plate}` : 'Add Vehicle'} wide footer={<div className="flex gap-3 w-full"><button onClick={onCancel} className="flex-1 rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">Cancel</button><button onClick={onSave} disabled={busy} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">{busy ? 'Saving...' : 'Save Vehicle'}</button></div>}>
      <div className="bg-[#0A0D1A] -m-6 p-6 sm:p-8 rounded-t-2xl space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="text-xs font-bold text-slate-400">Plate Number *</span><input value={editing.plate || ''} onChange={(e) => set({ plate: e.target.value.toUpperCase() })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm uppercase tracking-wider text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" placeholder="RAD 123 A" /></label>
          <label className="block"><span className="text-xs font-bold text-slate-400">Label / Name *</span><input value={editing.label || ''} onChange={(e) => set({ label: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" placeholder="Bus 01" /></label>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block"><span className="text-xs font-bold text-slate-400">Capacity *</span><input type="number" value={editing.capacity || 30} onChange={(e) => set({ capacity: Number(e.target.value) })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all" /></label>
          <label className="block"><span className="text-xs font-bold text-slate-400">Status *</span><select value={editing.status || 'idle'} onChange={(e) => set({ status: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none"><option value="active">Active</option><option value="idle">Idle</option><option value="maintenance">Maintenance</option><option value="offline">Offline</option></select></label>
        </div>
      </div>
    </Modal>
  );
}

function TripModal({ editing, setEditing, onSave, onCancel, busy, t }: any) {
  const set = (patch: any) => setEditing({ ...editing, ...patch });
  
  const getLocalDateTime = () => { 
    if (!editing.departure_dt) return ''; 
    try {
      const d = new Date(editing.departure_dt); 
      const pad = (n: number) => n.toString().padStart(2, '0'); 
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; 
    } catch { return ''; }
  };

  return (
    <Modal open onClose={onCancel} title="Setup Interprovincial Bus" wide footer={<div className="flex gap-3 w-full"><button onClick={onCancel} className="flex-1 rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">Cancel</button><button onClick={onSave} disabled={busy} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all">{busy ? 'Saving...' : 'Save Bus'}</button></div>}>
      <div className="bg-[#0A0D1A] -m-6 p-6 sm:p-8 rounded-t-2xl space-y-6">
        
        <label className="block">
          <span className="text-xs font-bold text-slate-400">Bus Plate Number *</span>
          <input 
            value={editing.vehicle_id || ''} 
            onChange={(e) => set({ vehicle_id: e.target.value.toUpperCase() })} 
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm uppercase tracking-wider text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" 
            placeholder="e.g. RAB 123 C" 
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold text-slate-400">Origin City *</span>
            <select value={editing.origin_city || ''} onChange={(e) => set({ origin_city: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none">
              <option value="" disabled>Select Origin</option>
              {RWANDA_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-400">Destination City *</span>
            <select value={editing.destination_city || ''} onChange={(e) => set({ destination_city: e.target.value })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 appearance-none">
              <option value="" disabled>Select Destination</option>
              {RWANDA_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-bold text-slate-400">Total Seats *</span>
            <input type="number" value={editing.total_seats || ''} onChange={(e) => set({ total_seats: Number(e.target.value) || '' })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" placeholder="e.g. 40" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-400">Price per Seat (RWF) *</span>
            <input type="number" value={editing.price_rwf || ''} onChange={(e) => set({ price_rwf: Number(e.target.value) || '' })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" placeholder="e.g. 3000" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-slate-400">Departure Time *</span>
            <input type="datetime-local" value={getLocalDateTime()} onChange={(e) => set({ departure_dt: new Date(e.target.value).toISOString() })} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 custom-date-input" />
          </label>
        </div>
      </div>
    </Modal>
  );
}

function statusStyles(status: string, t: any) {
  switch (status) {
    case 'active': return { label: t('Irakora', 'Active'), chip: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', bar: '#10b981' };
    case 'idle': return { label: t('Irategereje', 'Idle'), chip: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', bar: '#0ea5e9' };
    case 'maintenance': return { label: t('Kubungabunga', 'Maintenance'), chip: 'bg-amber-500/10 text-amber-400 border-amber-500/20', bar: '#f59e0b' };
    default: return { label: t('Irafunze', 'Offline'), chip: 'bg-slate-500/10 text-slate-400 border-slate-500/20', bar: '#94a3b8' };
  }
}

function SkeletonGrid() { return <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="h-72 animate-pulse rounded-3xl bg-white/5 border border-white/5" />)}</div>; }

function EmptyState({ t, hasFilters, onClear, onCreate }: any) { 
  return (
    <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-16 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10 text-slate-500"><IconVehicles /></div>
      <p className="mt-6 text-xl font-bold text-white">{hasFilters ? 'No vehicles match your filters' : 'No vehicles yet'}</p>
      <p className="mt-2 text-sm text-slate-400">{hasFilters ? 'Try adjusting the filters.' : 'Add your first vehicle.'}</p>
      {hasFilters ? <button onClick={onClear} className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black hover:bg-cyan-400 transition-colors">Clear filters</button> : <button onClick={onCreate} className="mt-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">+ New vehicle</button>}
    </div>
  ); 
}