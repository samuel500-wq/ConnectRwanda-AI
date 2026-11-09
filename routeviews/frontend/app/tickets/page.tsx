'use client';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';

// ── PREMIUM SVG ICONS ─────────────────────────────────────────────────────
const IconBus = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10H4V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 12h16M8 20v-2M16 20v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/></svg>
);
const IconTicket = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 6v2M13 10v2M13 14v2M13 18v0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);
const IconWarning = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
);
const IconCheck = ({ className = "w-6 h-6" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg"><polyline points="20 6 9 17 4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
);

export default function TicketsPage() {
  const { user, loading, logout } = useAuth();
  
  if (loading) return <div className="fixed inset-0 bg-[#080B15] flex items-center justify-center"><div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div></div>;
  if (!user) return <AuthScreen />;
  return <IntercityHome onLogout={logout} />;
}

function IntercityHome({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState<'search' | 'results' | 'bookings'>('search');
  
  const [origins, setOrigins] = useState<any[]>([]);
  const [destinations, setDestinations] = useState<any[]>([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const [trips, setTrips] = useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [openTicket, setOpenTicket] = useState<number | null>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.intercityDestinations().then((r) => {
      const realOrigins = r.origins || [];
      setOrigins(realOrigins);
      if (realOrigins.length > 0) setFrom(realOrigins[0].city);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!from) return;
    api.intercityDestinations(from).then((r) => {
      const realDests = r.destinations || [];
      setDestinations(realDests);
      if (realDests.length > 0 && !to) setTo(realDests[0].city);
    }).catch(() => {});
  }, [from]);

  async function search() {
    if (!from || !to) { setErr("Please select both an origin and destination."); return; }
    setErr(null);
    setLoadingTrips(true);
    try {
      const r = await api.intercitySearch(to, date, from);
      setTrips(r.trips || []);
      setStep('results');
    } catch (e: any) {
      if (e.message.includes('token')) { onLogout(); return; }
      setErr(e.message);
    } finally {
      setLoadingTrips(false);
    }
  }

  async function refreshBookings() {
    setLoadingBookings(true);
    setErr(null);
    try {
      const r = await api.intercityMyBookings();
      setBookings(r.bookings || []);
    } catch (e: any) {
      if (e.message.includes('token')) onLogout();
      else setErr(e.message);
    } finally {
      setLoadingBookings(false);
    }
  }

  useEffect(() => { refreshBookings(); }, []);

  function handlePrint(ticket: any) {
    setPrintData(ticket);
    setTimeout(() => window.print(), 150);
  }

  return (
    <div className="min-h-screen bg-[#080B15] text-slate-200 print:bg-white print:text-black font-sans selection:bg-cyan-500/30">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 print:hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-6 py-12 print:hidden">
        <header className="flex flex-wrap items-start gap-4 mb-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 text-xl font-black text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                {(user?.full_name || 'U').slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-2xl sm:text-3xl font-black tracking-tight text-white">Interprovincial Tickets</h1>
                <p className="truncate text-sm text-slate-400 mt-1">{user?.email}</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {user?.role === 'admin' && (
              <Link href="/admin/validate" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/10">Validate / Scan</Link>
            )}
            <button onClick={onLogout} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-400 transition hover:bg-red-500/10 hover:text-red-400">Sign out</button>
          </div>
        </header>

        <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-1.5 mb-8">
          <StepTab active={step === 'search'} onClick={() => setStep('search')}>Search</StepTab>
          <StepTab active={step === 'results'} onClick={() => setStep('results')} disabled={trips.length === 0}>Results {trips.length > 0 && `· ${trips.length}`}</StepTab>
          <StepTab active={step === 'bookings'} onClick={() => { setStep('bookings'); refreshBookings(); }}>My tickets {bookings.length > 0 && `· ${bookings.length}`}</StepTab>
        </div>

        {err && <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-400"><IconWarning className="w-5 h-5 shrink-0 mt-0.5" /><span>{err}</span></div>}

        {step === 'search' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl p-6 sm:p-8 shadow-2xl">
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr_180px_auto]">
                <label className="block group">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">From</span>
                  <select value={from} onChange={(e) => { setFrom(e.target.value); setTo(''); }} className="mt-2 w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none focus:border-cyan-500/50 transition-all cursor-pointer">
                    {origins.length === 0 && <option value="">No buses registered</option>}
                    {origins.map((o: any) => <option key={o.city} value={o.city}>{o.city}</option>)}
                  </select>
                </label>
                <label className="block group">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-emerald-400 transition-colors">To</span>
                  <select value={to} onChange={(e) => setTo(e.target.value)} className="mt-2 w-full appearance-none rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none focus:border-emerald-500/50 transition-all cursor-pointer">
                    <option value="" disabled>Select destination</option>
                    {destinations.map((d: any) => <option key={d.city} value={d.city}>{d.city}</option>)}
                  </select>
                </label>
                <label className="block group">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">Date</span>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white outline-none focus:border-cyan-500/50 transition-all" />
                </label>
                <div className="flex items-end">
                  <button onClick={search} disabled={!to || !from || loadingTrips} className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-bold text-white transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 hover:-translate-y-0.5">
                    {loadingTrips ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}

        {step === 'results' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-wrap items-center gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
              <button onClick={() => setStep('search')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10">← Change search</button>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Route</p>
                <p className="text-sm font-bold text-white">{from} <span className="text-slate-500 mx-1">→</span> {to}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Date</p>
                <p className="text-sm font-bold text-cyan-400">{new Date(date).toLocaleDateString()}</p>
              </div>
            </div>
            
            {trips.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-16 text-center">
                <IconBus className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-lg font-bold text-white">No buses on this date</p>
                <p className="mt-2 text-sm text-slate-400">Try a different date or route.</p>
              </div>
            ) : (
              <ul className="space-y-4">
                {trips.map((trip: any) => (
                  <TripCard key={trip.id} trip={trip} onBook={() => setSelectedTrip(trip)} />
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 'bookings' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {loadingBookings ? (
              <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/[0.02] border border-white/5" />)}</div>
            ) : bookings.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/20 bg-white/[0.02] p-16 text-center">
                <IconTicket className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-lg font-bold text-white">No tickets yet</p>
                <p className="mt-2 text-sm text-slate-400">Book your first ticket today.</p>
                <button onClick={() => setStep('search')} className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-cyan-400">Search trips</button>
              </div>
            ) : (
              <ul className="space-y-4">
                {bookings.map((b: any) => (
                  <BookingRow key={b.id} booking={b} onShow={() => setOpenTicket(b.id)} />
                ))}
              </ul>
            )}
          </div>
        )}

        {selectedTrip && (
          <BookModal
            trip={selectedTrip}
            onClose={() => setSelectedTrip(null)}
            onSuccess={(newBookingId) => {
              setSelectedTrip(null); // Close payment modal
              refreshBookings();
              setStep('bookings');
              setOpenTicket(newBookingId); // Auto-open the ticket
            }}
          />
        )}

        {openTicket != null && (
          <TicketModal bookingId={openTicket} onClose={() => setOpenTicket(null)} onPrint={handlePrint} />
        )}
      </div>

      {printData && <PrintableTicket data={printData} />}
    </div>
  );
}

function TripCard({ trip, onBook }: { trip: any, onBook: () => void }) {
  const departure = new Date(trip.departure_dt);
  const seats = Number(trip.available_seats || 0);
  const isSoldOut = seats <= 0;

  return (
    <li className="group overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-[0_10px_40px_-10px_rgba(6,182,212,0.2)]">
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl group-hover:bg-cyan-500/10 transition-colors pointer-events-none"></div>

        <div className="flex flex-wrap items-center gap-6 sm:gap-8 relative z-10">
          <div>
            <p className="text-4xl font-black text-white group-hover:text-cyan-400 transition-colors drop-shadow-md">
              {departure.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{trip.origin_city}</p>
          </div>
          <div className="flex flex-1 items-center gap-3 text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700 group-hover:bg-cyan-500 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all" />
            <div className="relative h-px flex-1 border-t-2 border-dashed border-white/10 group-hover:border-cyan-500/30 transition-colors"></div>
            <span className="h-2.5 w-2.5 rounded-full bg-slate-700 group-hover:bg-emerald-500 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.8)] transition-all" />
          </div>
          <div className="text-right">
            <p className="text-4xl font-black text-white group-hover:text-emerald-400 transition-colors drop-shadow-md">{trip.destination_city}</p>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">Arrival</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-6 lg:flex-col lg:items-end lg:gap-3 border-t border-white/5 pt-5 lg:border-t-0 lg:pt-0 relative z-10">
          <div className="lg:text-right">
            <p className="text-2xl font-black text-white">{Number(trip.price_rwf).toLocaleString()} <span className="text-sm font-bold text-cyan-500">RWF</span></p>
          </div>
          {isSoldOut ? (
            <button disabled className="rounded-xl bg-slate-800 text-slate-500 px-8 py-3 text-sm font-bold cursor-not-allowed border border-slate-700">Sold Out</button>
          ) : (
            <button onClick={onBook} className="rounded-xl bg-white text-black px-8 py-3 text-sm font-bold transition-all hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:-translate-y-0.5">Book Now</button>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/5 bg-black/30 px-6 py-4 text-[11px] font-medium text-slate-400 sm:px-8 relative z-10">
        <span className="flex items-center gap-2 text-white font-bold"><IconBus className="w-4 h-4 text-cyan-500" /> {trip.vehicle_id}</span>
        <span>Date: {departure.toLocaleDateString()}</span>
        <span className={`ml-auto font-bold px-2.5 py-1 rounded-md border ${isSoldOut ? 'bg-red-500/10 text-red-400 border-red-500/20' : seats <= 5 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
          {isSoldOut ? '0 seats left' : `${seats} seats left`}
        </span>
      </div>
    </li>
  );
}

function BookingRow({ booking: b, onShow }: { booking: any, onShow: () => void }) {
  const departure = new Date(b.departure_dt || new Date());
  return (
    <li className="group flex flex-wrap items-center gap-5 rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-5 sm:p-6 transition-all hover:bg-white/[0.04] hover:border-cyan-500/30">
      <div className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-b from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:scale-105 transition-transform">
        <p className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">{departure.toLocaleString(undefined, { month: 'short' })}</p>
        <p className="text-2xl font-black text-white leading-none mt-0.5">{departure.getDate()}</p>
      </div>
      <div className="min-w-0">
        <p className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{b.origin_city} <span className="text-slate-500 font-normal mx-1">→</span> {b.destination_city}</p>
        <p className="text-sm font-medium text-slate-400 mt-1">{b.vehicle_id} · {departure.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
      </div>
      <div className="flex flex-col items-end gap-1 ml-auto">
        <span className="rounded-lg bg-black/40 border border-white/5 px-3 py-1.5 font-mono text-xs text-slate-300">{b.reference}</span>
        <span className={`rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${b.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>{b.status}</span>
      </div>
      <div className="flex items-center gap-4 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/10">
        <span className="text-xl font-black text-white">{Number(b.amount_rwf).toLocaleString()} <span className="text-xs text-cyan-500">RWF</span></span>
        {b.status === 'paid' && <button onClick={onShow} className="rounded-xl bg-white px-6 py-2.5 text-xs font-bold text-black transition hover:bg-cyan-400 shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]">View Ticket</button>}
      </div>
    </li>
  );
}

function BookModal({ trip, onClose, onSuccess }: { trip: any, onClose: () => void, onSuccess: (id: number) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [idNo, setIdNo] = useState('');
  const [payPhone, setPayPhone] = useState('');
  const [payPin, setPayPin] = useState('');
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  const [newBookingId, setNewBookingId] = useState<number | null>(null);
  const departure = new Date(trip.departure_dt);

  async function handleDetailsNext() {
    if (!name.trim()) { setErr('Name is required.'); return; }
    setErr(null);
    setStep('payment');
  }

  async function submitPayment() {
    if (!payPhone || payPin.length < 4) { setErr('Enter phone number and a 4-digit PIN.'); return; }
    setBusy(true); setErr(null);
    try {
      const r = await api.intercityCreateBooking({
        tripId: trip.id,
        passengerName: name.trim(),
        passengerPhone: phone.trim() || payPhone.trim(),
        passengerEmail: email.trim() || undefined,
        passengerIdNo: idNo.trim() || undefined
      });
      await api.intercityPayDemo(r.booking.id);
      
      // Success! Switch to success state
      setNewBookingId(r.booking.id);
      setStep('success');
      
      // Auto-close and open ticket after 1.5 seconds
      setTimeout(() => {
        onSuccess(r.booking.id);
      }, 1500);

    } catch (e: any) {
      setErr(e.message === 'sold_out' ? 'This bus is sold out!' : (e.message || 'Error'));
      if (e.message === 'sold_out') setStep('details');
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] bg-[#080B15]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A0D1A] border border-white/10 rounded-3xl w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <h3 className="text-white font-black text-xl tracking-tight">
            {step === 'details' ? 'Passenger Details' : step === 'payment' ? 'Secure Payment' : 'Payment Successful'}
          </h3>
          {step !== 'success' && <button onClick={onClose} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors">✕</button>}
        </div>
        
        <div className="p-6 sm:p-8 overflow-y-auto max-h-[70vh] custom-scrollbar bg-[#0A0D1A] relative">
          
          {step === 'success' && (
            <div className="absolute inset-0 z-50 bg-[#0A0D1A] flex flex-col items-center justify-center animate-in fade-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <IconCheck className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Payment Successful!</h2>
              <p className="text-slate-400">Your ticket is ready. Opening...</p>
            </div>
          )}

          {err && <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-medium">{err}</div>}

          <div className="rounded-2xl bg-gradient-to-br from-cyan-950/40 to-blue-950/20 border border-white/10 p-6 text-white mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-2xl rounded-full"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-4">{trip.vehicle_id}</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-4xl font-black">{departure.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                <p className="mt-1 text-sm font-medium text-slate-400">{trip.origin_city}</p>
              </div>
              <div className="flex flex-1 items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-cyan-500" /><div className="relative h-px flex-1 border-t-2 border-dashed border-white/20" /><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /></div>
              <div className="text-right">
                <p className="text-4xl font-black">{trip.destination_city}</p>
                <p className="mt-1 text-sm font-medium text-slate-400">Arrival</p>
              </div>
            </div>
          </div>

          {step === 'details' && (
            <div className="grid gap-5 sm:grid-cols-2 animate-in slide-in-from-right-4">
              <IInput label="Passenger name" value={name} onChange={setName} required />
              <IInput label="Phone" value={phone} onChange={setPhone} placeholder="+250 7XX XXX XXX" />
              <IInput label="Email" value={email} onChange={setEmail} type="email" />
              <IInput label="National ID (optional)" value={idNo} onChange={setIdNo} />
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-5 flex items-center justify-between">
                <span className="text-slate-400 font-medium">Total Amount to Pay</span>
                <span className="text-3xl font-black text-cyan-400">{Number(trip.price_rwf).toLocaleString()} RWF</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <IInput label="Mobile Money Number" value={payPhone} onChange={setPayPhone} placeholder="07XX XXX XXX" required />
                <IInput label="Secret PIN" value={payPin} onChange={(v: string) => setPayPin(v.replace(/\D/g, '').slice(0, 4))} type="password" placeholder="••••" required />
              </div>
              <p className="text-xs text-slate-500 text-center">This is a simulated payment. No real funds will be deducted.</p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-white/10 bg-white/[0.02] flex gap-3">
          {step !== 'success' && (
            <>
              <button onClick={onClose} className="flex-1 rounded-xl border border-white/10 bg-transparent px-4 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">Cancel</button>
              {step === 'details' ? (
                <button onClick={handleDetailsNext} className="flex-1 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition-all hover:bg-slate-200">Continue to Payment →</button>
              ) : (
                <button onClick={submitPayment} disabled={busy} className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                  {busy ? 'Processing...' : `Pay ${Number(trip.price_rwf).toLocaleString()} RWF`}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketModal({ bookingId, onClose, onPrint }: { bookingId: number, onClose: () => void, onPrint: (t: any) => void }) {
  const [ticket, setTicket] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.intercityTicket(bookingId).then((r) => setTicket(r.ticket)).catch((e) => setErr(e.message));
  }, [bookingId]);

  return (
    <div className="fixed inset-0 z-[100] bg-[#080B15]/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0F1423] border border-white/10 rounded-3xl w-full max-w-2xl flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/[0.02]">
          <h3 className="text-white font-black text-xl tracking-tight">Boarding Pass</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-colors">✕</button>
        </div>

        <div className="p-6 sm:p-8 overflow-y-auto max-h-[75vh] custom-scrollbar bg-[#0A0D1A] flex flex-col justify-center">
          {err && <p className="text-sm text-red-500 font-medium text-center">{err}</p>}
          {!ticket && !err && <div className="flex flex-col items-center justify-center py-20"><div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div><p className="text-slate-400 font-medium">Generating your ticket…</p></div>}
          
          {ticket && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* TICKET DESIGN */}
              <div className="relative w-full rounded-2xl overflow-hidden flex flex-col sm:flex-row shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20">
                
                {/* Left Section (Details) */}
                <div className="flex-1 bg-gradient-to-br from-[#0F1423] to-[#1A233A] p-8 text-white relative">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500 flex items-center justify-center text-black"><IconBus className="w-5 h-5" /></div>
                      <div>
                        <h4 className="text-sm font-black tracking-tight">ConnectRwanda AI</h4>
                        <p className="text-[9px] text-cyan-400 uppercase tracking-widest font-bold">Intercity Express</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase border border-emerald-500/30">PAID</span>
                  </div>

                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">From</p>
                      <p className="text-2xl font-black">{ticket.origin_city}</p>
                    </div>
                    <div className="flex flex-col items-center px-4">
                      <IconBus className="w-5 h-5 text-slate-500 mb-1" />
                      <div className="w-16 h-px border-t-2 border-dashed border-slate-600"></div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">To</p>
                      <p className="text-2xl font-black">{ticket.destination_city}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 text-sm bg-black/20 p-4 rounded-xl border border-white/5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Passenger</p>
                      <p className="font-bold truncate">{ticket.passenger_name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reference</p>
                      <p className="font-mono text-cyan-400 font-bold">{ticket.reference}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Departure</p>
                      <p className="font-bold">{new Date(ticket.departure_dt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Time</p>
                      <p className="font-bold">{new Date(ticket.departure_dt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</p>
                    </div>
                  </div>

                  {/* Fake Perforations (Top/Bottom) */}
                  <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#080B15] rounded-full -translate-y-1/2 hidden sm:block border border-white/20"></div>
                </div>

                {/* Right Section (QR) */}
                <div className="w-full sm:w-[240px] bg-white p-6 flex flex-col items-center justify-center relative">
                  <div className="text-center mb-4">
                    <p className="text-xs font-black text-slate-800">Scan to Board</p>
                    <p className="text-[10px] text-slate-500 mt-1">{ticket.vehicle_id}</p>
                  </div>
                  
                  {ticket.qr_data_url ? (
                    <div className="p-2 border-2 border-slate-200 rounded-xl mb-4">
                      <img src={ticket.qr_data_url} alt="QR code" className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]" />
                    </div>
                  ) : (
                    <div className="w-[160px] h-[160px] bg-slate-100 animate-pulse rounded-xl mb-4"></div>
                  )}
                  
                  <p className="text-[10px] font-mono font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-md">{ticket.code}</p>
                  
                  {/* Fake Perforations (Top/Bottom) */}
                  <div className="absolute top-0 -left-3 w-6 h-6 bg-[#080B15] rounded-full -translate-y-1/2 hidden sm:block border border-white/20"></div>
                  <div className="absolute bottom-0 -left-3 w-6 h-6 bg-[#080B15] rounded-full translate-y-1/2 hidden sm:block border border-white/20"></div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
                <IconWarning className="w-4 h-4 text-amber-500" /> 
                <span>Show this QR to the driver. Single use only.</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/[0.02] flex justify-end gap-3">
          <button onClick={onClose} className="rounded-xl border border-white/10 bg-transparent px-6 py-3 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors">Close</button>
          {ticket && <button onClick={() => onPrint(ticket)} className="rounded-xl bg-cyan-500 px-6 py-3 text-sm font-black text-black hover:bg-cyan-400 transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)]">Print Ticket</button>}
        </div>
      </div>
    </div>
  );
}

function IInput({ label, value, onChange, type = 'text', placeholder, required }: any) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-bold text-slate-400">{label}{required && <span className="text-cyan-500 ml-1">*</span>}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600" />
    </label>
  );
}

function PrintableTicket({ data: tk }: { data: any }) {
  const dep = new Date(tk.departure_dt);
  return (
    <div className="rv-print-area hidden print:block bg-white text-black p-8">
      <div style={{ maxWidth: '800px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
        {/* Header */}
        <div className="flex justify-between items-end border-b-4 border-black pb-4 mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Boarding Pass</h1>
            <p className="text-sm font-bold text-gray-600 mt-1">ConnectRwanda AI · Intercity Express</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Booking Ref</p>
            <p className="text-2xl font-mono font-black">{tk.reference}</p>
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Origin</p>
            <p className="text-5xl font-black">{tk.origin_city}</p>
          </div>
          <div className="flex-1 px-8">
            <div className="h-0.5 w-full bg-black border-t-2 border-dashed border-white"></div>
            <p className="text-center text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest">{tk.vehicle_id}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Destination</p>
            <p className="text-5xl font-black">{tk.destination_city}</p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-[1fr_300px] gap-8">
          <div className="space-y-4">
            <div className="flex justify-between border-b border-gray-300 pb-2">
              <span className="text-sm font-bold text-gray-500 uppercase">Passenger</span>
              <span className="text-lg font-black">{tk.passenger_name}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-2">
              <span className="text-sm font-bold text-gray-500 uppercase">Date</span>
              <span className="text-lg font-black">{dep.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-2">
              <span className="text-sm font-bold text-gray-500 uppercase">Time</span>
              <span className="text-lg font-black">{dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-2">
              <span className="text-sm font-bold text-gray-500 uppercase">Fare</span>
              <span className="text-lg font-black">{Number(tk.amount_rwf).toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between border-b border-gray-300 pb-2">
              <span className="text-sm font-bold text-gray-500 uppercase">Status</span>
              <span className="text-lg font-black text-green-600">PAID</span>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center border-2 border-black p-4 rounded-xl">
            {tk.qr_data_url && <img src={tk.qr_data_url} alt="QR" className="w-[200px] h-[200px]" />}
            <p className="text-[10px] font-mono font-bold mt-2">{tk.code}</p>
          </div>
        </div>

        <div className="mt-12 pt-4 border-t border-gray-300 text-xs text-center text-gray-500 font-medium">
          <p>Please arrive at the terminal 20 minutes before departure. Have your QR code ready for scanning.</p>
        </div>
      </div>
    </div>
  );
}

function StepTab({ active, onClick, children, disabled }: any) {
  return <button type="button" onClick={onClick} disabled={disabled} className={`rounded-xl px-5 py-2.5 text-xs font-bold transition disabled:opacity-40 ${active ? 'bg-cyan-500/20 text-cyan-400 shadow-sm border border-cyan-500/30' : 'text-slate-500 hover:text-white'}`}>{children}</button>;
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  return (
    <div className="min-h-screen bg-[#080B15] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 bg-[#0A0D1A] border border-white/10 rounded-3xl shadow-2xl">
        <h1 className="text-3xl font-black text-white mb-6">Intercity Tickets</h1>
        {mode === 'login' ? <LoginForm /> : <RegisterForm />}
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="mt-4 w-full text-center text-xs text-slate-400 hover:text-white transition-colors">
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}

function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await login(email, password); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-xl">{err}</div>}
      <IInput label="Email" value={email} onChange={setEmail} type="email" />
      <IInput label="Password" value={password} onChange={setPassword} type="password" />
      <button type="submit" disabled={busy} className="w-full py-3 bg-cyan-500 text-black font-bold rounded-xl">{busy ? 'Loading...' : 'Sign in'}</button>
    </form>
  );
}

function RegisterForm() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    try { await register({ full_name: name, email, password }); } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <div className="p-3 bg-red-500/10 text-red-400 text-xs rounded-xl">{err}</div>}
      <IInput label="Full Name" value={name} onChange={setName} />
      <IInput label="Email" value={email} onChange={setEmail} type="email" />
      <IInput label="Password" value={password} onChange={setPassword} type="password" />
      <button type="submit" disabled={busy} className="w-full py-3 bg-cyan-500 text-black font-bold rounded-xl">{busy ? 'Loading...' : 'Create Account'}</button>
    </form>
  );
}