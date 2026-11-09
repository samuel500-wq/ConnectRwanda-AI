'use client';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import L from 'leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const Polyline = dynamic(() => import('react-leaflet').then((mod) => mod.Polyline), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });

// ── ROBUST ID GENERATOR (Fixes the mixing bug) ──
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString();

// Custom dynamic component to fix Leaflet sizing and auto-zoom
const MapBounds = dynamic(() => import('react-leaflet').then((m) => {
  return function MapBoundsComp({ path }: { path: [number, number][] }) {
    const map = m.useMap();
    useEffect(() => {
      if (path && path.length > 0) {
        const bounds = L.latLngBounds(path);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      const timer = setTimeout(() => map.invalidateSize(), 400);
      return () => clearTimeout(timer);
    }, [path, map]);
    return null;
  };
}), { ssr: false });

type Stop = { id: number; code: string; name_rw: string; name_en: string; lat: number; lng: number };
type Option = any;
type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; options?: Option[]; isTyping?: boolean; };

// ── CUSTOM PREMIUM ICONS ──────────────────────────────────────────────────
const IconAI = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconOrigin = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);
const IconDestination = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1v12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconPax = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconAccess = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconSend = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <line x1="22" y1="2" x2="11" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconMic = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="19" x2="12" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconDecision = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconBudget = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
  </svg>
);
const IconRisk = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconTwin = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IconShare = ({ className = "w-5 h-5" }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="currentColor" strokeWidth="2"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

// ── SIMULATED BUSES ───────────────────────────────────────────────────────
function SimulatedBuses({ path }: { path: [number, number][] }) {
  const [buses, setBuses] = useState<{ id: string, lat: number, lng: number }[]>([]);

  const busIcon = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return L.divIcon({
      className: 'bg-transparent',
      html: `<div class="relative flex h-5 w-5 items-center justify-center">
               <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
               <span class="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 border-2 border-white shadow-[0_0_15px_rgba(6,182,212,1)]"></span>
             </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, []);

  useEffect(() => {
    if (!path || path.length < 3) return;
    
    let progress = [0.1, 0.45, 0.8]; 
    
    const interval = setInterval(() => {
      progress = progress.map(p => {
        let next = p + 0.003; 
        if (next > 1) next = 0; 
        return next;
      });

      const newBuses = progress.map((p, i) => {
        let lat, lng;
        if (p < 0.5) {
          const t = p * 2;
          lat = path[0][0] + (path[1][0] - path[0][0]) * t;
          lng = path[0][1] + (path[1][1] - path[0][1]) * t;
        } else {
          const t = (p - 0.5) * 2;
          lat = path[1][0] + (path[2][0] - path[1][0]) * t;
          lng = path[1][1] + (path[2][1] - path[1][1]) * t;
        }
        return { id: `bus-${i}`, lat, lng };
      });
      
      setBuses(newBuses);
    }, 50);

    return () => clearInterval(interval);
  }, [path]);

  if (!busIcon) return null;

  return (
    <>
      {buses.map(bus => (
        <Marker key={bus.id} position={[bus.lat, bus.lng]} icon={busIcon} />
      ))}
    </>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function RouteViewIntelligence() {
  const { lang } = useI18n();
  
  const [stops, setStops] = useState<Stop[]>([]);
  const [fromId, setFromId] = useState<number | null>(null);
  const [toId, setToId] = useState<number | null>(null);
  const [resolvedFrom, setResolvedFrom] = useState<Stop | null>(null);
  const [resolvedTo, setResolvedTo] = useState<Stop | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [options, setOptions] = useState<Option[]>([]);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [activeTab, setActiveTab] = useState<string>('decision'); 
  const [budget, setBudget] = useState<string>('');
  const [passengers, setPassengers] = useState<number>(1);
  const [arrivalBy, setArrivalBy] = useState<string>('');
  const [needAccess, setNeedAccess] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [savedOffline, setSavedOffline] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    api.listStops().then((r) => setStops(r.stops)).catch(() => {});
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.onresult = (e: any) => { setChatInput(e.results[0][0].transcript); setIsListening(false); };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  async function handleSearch() {
    if (!fromId || !toId || fromId === toId) return;
    const fromStop = stops.find((s) => s.id === fromId);
    const toStop = stops.find((s) => s.id === toId);
    if (!fromStop || !toStop) return;

    setResolvedFrom(fromStop); setResolvedTo(toStop);
    setIsSearching(true); setSelectedOption(null); setActiveTab('decision');
    
    // FIX: Use generateId()
    setMessages(prev => [...prev, { id: generateId(), role: 'user', content: `Plan trip: ${fromStop.name_en} to ${toStop.name_en}` }]);
    
    const aiMsgId = generateId();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', isTyping: true }]);

    try {
      const r = await api.plan(fromId, toId);
      let fetchedOptions = r.options || [];

      if (fetchedOptions.length === 0) {
        const straightKm = haversineKm(fromStop, toStop);
        const roadKm = Math.round(straightKm * 1.35 * 10) / 10;
        fetchedOptions = [{
          type: 'direct', route: { id: -1, code: 'RT-AI', color: '#06B6D4' },
          fromStopId: fromId, toStopId: toId, distance_m: roadKm * 1000,
          estimated_minutes: Math.max(6, Math.round((roadKm / 22) * 60)),
          fare: { amount_rwf: roadKm < 3 ? 200 : 300, source: 'ai' },
          _isEstimate: true
        }];
      }

      let filtered = needAccess ? fetchedOptions.filter((o: any) => o.accessible) : fetchedOptions;
      if (filtered.length === 0) filtered = fetchedOptions; 

      setOptions(filtered);
      setSelectedOption(filtered[0]);

      let summary = `I analyzed the network and found **${filtered.length} route(s)**.\n\n`;
      summary += `**Recommended:** Route ${filtered[0]?.route?.code || 'AI-Route'} (${filtered[0]?.estimated_minutes} min, ${filtered[0]?.fare?.amount_rwf} RWF).\n\n`;
      summary += `The Intelligence Panel is now active. Test the budget, simulate delays, or view the 3D map.`;

      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isTyping: false, content: summary, options: filtered } : m));
    } catch (e) {
      console.error("Plan API error:", e);
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isTyping: false, content: "⚠️ **Connection failed.** Please ensure the Node.js backend is running on port 4000 and MySQL is started in XAMPP." } : m));
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSendMessage(scenarioText?: string) {
    const text = scenarioText || chatInput;
    if (!text.trim() || isTyping) return;
    
    if (!scenarioText) setChatInput('');
    
    // FIX: Use generateId()
    setMessages(prev => [...prev, { id: generateId(), role: 'user', content: text }]);
    setIsTyping(true);
    
    const aiMsgId = generateId();
    setMessages(prev => [...prev, { id: aiMsgId, role: 'assistant', content: '', isTyping: true }]);

    try {
      const routeCtx = selectedOption 
        ? `Current route: ${selectedOption?.route?.code || 'AI'}. Fare: ${selectedOption?.fare?.amount_rwf} RWF. Duration: ${selectedOption?.estimated_minutes} mins.` 
        : '';
        
      const prompt = `System Context: You are the RouteView AI. ${routeCtx} The user asks: "${text}". Answer very briefly and directly based ONLY on this route data.`;

      const r: any = await api.aiChat({ message: prompt, lang: lang as 'en' | 'rw', history: [] });
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isTyping: false, content: r?.reply || "Data unavailable." } : m));
    } catch (e) {
      console.error("AI API error:", e);
      setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, isTyping: false, content: "⚠️ AI connection error. Check your OpenRouter API key in the backend .env file." } : m));
    } finally {
      setIsTyping(false);
    }
  }

  const departureTime = useMemo(() => {
    if (!arrivalBy || !selectedOption) return null;
    const [h, m] = arrivalBy.split(':').map(Number);
    const d = new Date(); d.setHours(h, m - (selectedOption.estimated_minutes || 0), 0);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [arrivalBy, selectedOption]);

  const co2Saved = selectedOption ? Math.round((selectedOption.distance_m / 1000) * 192 - (selectedOption.distance_m / 1000) * 68) : 0;
  const totalCost = selectedOption ? (selectedOption.fare?.amount_rwf || 0) * passengers : 0;
  const budgetNum = Number(budget) || 0;
  const isOverBudget = budgetNum > 0 && totalCost > budgetNum;
  const budgetPercent = budgetNum > 0 ? Math.min(100, (totalCost / budgetNum) * 100) : 0;

  const curvedPath = useMemo((): [number, number][] => {
    if (!resolvedFrom || !resolvedTo) return [];
    return [
      [resolvedFrom.lat, resolvedFrom.lng], 
      [(resolvedFrom.lat + resolvedTo.lat)/2 + 0.002, (resolvedFrom.lng + resolvedTo.lng)/2 - 0.002], 
      [resolvedTo.lat, resolvedTo.lng]
    ];
  }, [resolvedFrom, resolvedTo]);

  return (
    <div className="fixed inset-0 top-[64px] flex flex-col bg-[#080B15] text-slate-200 overflow-hidden font-sans z-10 selection:bg-cyan-500/30">
      
      {/* GLOBAL BACKGROUND MESH */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      </div>

      {/* TOP SEARCH BAR */}
      <div className="relative z-30 pt-6 px-4 sm:px-6">
        <div className="max-w-[1500px] mx-auto bg-white/[0.02] backdrop-blur-2xl border border-white/10 p-2.5 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col xl:flex-row gap-3">
          
          <div className="flex-1 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-400 transition-colors"><IconOrigin className="w-4 h-4"/></span>
              <select value={fromId || ''} onChange={(e) => setFromId(Number(e.target.value) || null)} className="w-full bg-black/40 text-sm text-white pl-11 pr-4 py-3 rounded-xl border border-white/5 outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer">
                <option value="" disabled className="text-slate-500">Select Origin</option>
                {stops.map(s => <option key={s.id} value={s.id}>{s.name_en}</option>)}
              </select>
            </div>
            <div className="relative flex-1 group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors"><IconDestination className="w-4 h-4"/></span>
              <select value={toId || ''} onChange={(e) => setToId(Number(e.target.value) || null)} className="w-full bg-black/40 text-sm text-white pl-11 pr-4 py-3 rounded-xl border border-white/5 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer">
                <option value="" disabled className="text-slate-500">Select Destination</option>
                {stops.map(s => <option key={s.id} value={s.id}>{s.name_en}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500 text-[10px] font-bold group-focus-within:text-cyan-400">RWF</span>
              <input type="number" placeholder="Budget" value={budget} onChange={(e) => setBudget(e.target.value)} className="w-28 bg-black/40 text-sm text-white pl-11 pr-3 py-3 rounded-xl border border-white/5 outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600" />
            </div>
            
            <div className="relative group">
               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors"><IconPax className="w-4 h-4"/></span>
               <input type="number" placeholder="Pax" value={passengers} min={1} onChange={(e) => setPassengers(Number(e.target.value))} className="w-20 bg-black/40 text-sm text-white pl-9 pr-2 py-3 rounded-xl border border-white/5 outline-none focus:border-cyan-500/50 transition-all text-center placeholder:text-slate-600" title="Passengers" />
            </div>

            <input type="time" value={arrivalBy} onChange={(e) => setArrivalBy(e.target.value)} className="w-32 bg-black/40 text-sm text-white px-3 py-3 rounded-xl border border-white/5 outline-none focus:border-cyan-500/50 transition-all text-slate-300 custom-time-input" title="Arrive By" />
            
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-black/40 px-4 py-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/5 transition-colors group">
              <input type="checkbox" checked={needAccess} onChange={(e) => setNeedAccess(e.target.checked)} className="accent-cyan-500 w-4 h-4 rounded" /> 
              <span className={`transition-colors ${needAccess ? 'text-cyan-400' : 'text-slate-500'}`}><IconAccess className="w-5 h-5"/></span>
            </label>

            <button onClick={handleSearch} disabled={!fromId || !toId || isSearching} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:opacity-50 flex items-center justify-center gap-2 group">
              {isSearching ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>Planning</span>
              ) : (
                <>Plan Trip <span className="group-hover:translate-x-1 transition-transform"><IconSend className="w-4 h-4"/></span></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN SPLIT SCREEN */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1500px] mx-auto w-full relative z-20 pt-6 px-4 sm:px-6 pb-6 gap-6">
        
        {/* LEFT: AI CHAT AREA */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          
          {messages.length === 0 && (
            <div className="mb-6 rounded-3xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10 p-6 sm:p-8 relative overflow-hidden backdrop-blur-md shrink-0 flex items-center gap-6">
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none"></div>
              
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 p-[2px] shrink-0 shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                <div className="w-full h-full bg-[#080B15] rounded-2xl flex items-center justify-center text-cyan-400">
                   <IconAI className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">RouteView Intelligence</span></h2>
                <p className="text-sm text-slate-400 leading-relaxed max-w-lg">Enter your journey details above. I am ready to calculate your best route, budget, and risk scenarios.</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                
                <div className="flex items-end gap-3 max-w-[90%] sm:max-w-[80%]">
                  {msg.role === 'assistant' && (
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center shrink-0 shadow-lg mb-1 text-black">
                       <IconAI className="w-4 h-4" />
                     </div>
                  )}
                  <div className={`rounded-2xl px-5 py-3.5 text-sm shadow-md ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-br-sm' : 'bg-white/5 text-slate-200 border border-white/10 backdrop-blur-md rounded-bl-sm'}`}>
                    {msg.isTyping ? (
                      <div className="flex gap-1.5 items-center h-5">
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"></div>
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-150"></div>
                        <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-300"></div>
                      </div>
                    ) : (
                      <div className="leading-relaxed whitespace-pre-wrap">
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-cyan-300 font-bold">$1</strong>') }} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Route Options inside Chat */}
                {msg.options && (
                  <div className="w-full mt-4 ml-0 sm:ml-11 space-y-3">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2"><span className="w-4 h-px bg-slate-700"></span> Available Routes</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {msg.options.map((opt: any, i: number) => (
                        <div key={`${msg.id}-opt-${i}`} onClick={() => { setSelectedOption(opt); setActiveTab('decision'); }} className={`cursor-pointer rounded-2xl p-4 border transition-all duration-200 group ${selectedOption === opt ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/50' : 'bg-white/[0.02] border-white/10 hover:border-white/30 hover:bg-white/[0.05]'}`}>
                          <div className="flex justify-between items-center mb-3">
                            <span className={`px-3 py-1 rounded-lg text-xs font-black tracking-wider ${selectedOption === opt ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-white/10 text-slate-300'}`}>{opt?.route?.code || 'AI-ROUTE'}</span>
                            <span className="text-[10px] font-semibold text-slate-500 bg-black/30 px-2 py-0.5 rounded-md border border-white/5">{opt._isEstimate ? 'AI EST' : 'VERIFIED'}</span>
                          </div>
                          <div className="flex justify-between items-end">
                             <div>
                               <p className="text-xs text-slate-500 mb-1">Duration</p>
                               <p className="text-sm font-bold text-white">{opt?.estimated_minutes || '--'} min</p>
                             </div>
                             <div className="text-right">
                               <p className="text-xs text-slate-500 mb-1">Fare</p>
                               <p className={`text-sm font-bold ${selectedOption === opt ? 'text-cyan-400' : 'text-slate-200'}`}>{opt?.fare?.amount_rwf || '--'} RWF</p>
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={chatEndRef} className="h-2" />
          </div>
          
          <div className="pt-4 shrink-0 relative">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur opacity-30 group-focus-within:opacity-100 transition duration-500"></div>
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Ask AI about this journey..." className="relative w-full bg-[#080B15] text-sm text-white rounded-full py-4 pl-6 pr-28 outline-none border border-white/10 focus:border-cyan-500/50 shadow-2xl transition-all placeholder:text-slate-600" />
              <div className="absolute right-2 top-2 flex gap-2">
                <button onClick={() => { recognitionRef.current?.start(); setIsListening(true); }} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}`}>
                  <IconMic className="w-5 h-5" />
                </button>
                <button onClick={() => handleSendMessage()} disabled={!chatInput.trim() || isTyping} className="w-10 h-10 bg-cyan-500 hover:bg-cyan-400 text-black rounded-full flex items-center justify-center font-bold disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <IconSend className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: INTELLIGENCE PANEL */}
        <div className="w-full lg:w-[420px] shrink-0 flex flex-col bg-[#0A0D1A]/80 border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden shadow-2xl">
          
          <div className="p-5 flex items-center justify-between border-b border-white/5 bg-white/[0.02]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide uppercase">
              <span className="text-cyan-400 animate-pulse"><IconAI className="w-4 h-4"/></span> Intelligence Panel
            </h2>
            <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest border ${selectedOption ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-white/5 text-slate-500 border-white/10'}`}>
              {selectedOption ? 'Active' : 'Standby'}
            </span>
          </div>

          {/* TAB GRID */}
          <div className="flex px-2 pt-2 pb-0 border-b border-white/5 gap-1 overflow-x-auto custom-scrollbar-hide">
            {[
              { id: 'decision', icon: <IconDecision className="w-5 h-5" />, label: 'Decision' },
              { id: 'budget', icon: <IconBudget className="w-5 h-5" />, label: 'Budget' },
              { id: 'risk', icon: <IconRisk className="w-5 h-5" />, label: 'Risk' },
              { id: 'twin', icon: <IconTwin className="w-5 h-5" />, label: 'Twin' },
              { id: 'share', icon: <IconShare className="w-5 h-5" />, label: 'Share' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative flex-1 flex flex-col items-center justify-center py-3 rounded-t-xl text-[10px] font-bold transition-all min-w-[70px] ${activeTab === tab.id ? 'text-cyan-400 bg-white/[0.03]' : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.01]'}`}>
                <span className="mb-1.5">{tab.icon}</span> {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>}
              </button>
            ))}
          </div>

          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-4">
            
            {/* DECISION TAB */}
            {activeTab === 'decision' && (
              <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><IconDecision className="w-4 h-4 text-cyan-500" /> Smart Decision Engine</h4>
                  {selectedOption ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <span className="text-sm text-slate-400">Best Route</span>
                        <span className="text-sm font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-lg border border-cyan-400/20">{selectedOption?.route?.code || 'AI-ROUTE'}</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <span className="text-sm text-slate-400">Duration</span>
                        <span className="text-sm font-bold text-white">{selectedOption?.estimated_minutes} mins</span>
                      </div>
                      <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <span className="text-sm text-slate-400">Total Fare</span>
                        <span className="text-sm font-bold text-emerald-400">{selectedOption?.fare?.amount_rwf} RWF</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">CO₂ Impact</span>
                        <span className="text-sm font-bold text-emerald-400">-{co2Saved}g</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-50">
                      <IconDecision className="w-10 h-10 text-cyan-500 mb-3" />
                      <p className="text-sm text-slate-400 leading-relaxed max-w-[200px]">Plan a trip to see the AI recommendation.</p>
                    </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 p-5 rounded-2xl border border-emerald-500/20">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2"><IconOrigin className="w-4 h-4 text-emerald-500" /> Arrival-By Planner</h4>
                  {arrivalBy && departureTime && selectedOption ? (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-black/30 p-3 rounded-xl border border-emerald-500/20 text-center">
                        <p className="text-[10px] text-emerald-500/70 uppercase font-bold mb-1">Leave By</p>
                        <p className="text-lg font-black text-white">{departureTime}</p>
                      </div>
                      <div className="text-emerald-500/50"><IconSend className="w-4 h-4" /></div>
                      <div className="flex-1 bg-black/30 p-3 rounded-xl border border-emerald-500/20 text-center">
                        <p className="text-[10px] text-emerald-500/70 uppercase font-bold mb-1">Arrive By</p>
                        <p className="text-lg font-black text-white">{arrivalBy}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-emerald-200/50 leading-relaxed">Set a target arrival time in the top bar to calculate departure.</p>
                  )}
                </div>
              </div>
            )}

            {/* BUDGET TAB */}
            {activeTab === 'budget' && (
              <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><IconBudget className="w-4 h-4 text-cyan-500" /> Budget Optimizer</h4>
                  {selectedOption ? (
                    <>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Fare (1 Pax)</span>
                        <span className="text-white font-medium">{selectedOption?.fare?.amount_rwf} RWF</span>
                      </div>
                      <div className="flex justify-between text-sm mb-5 pb-4 border-b border-white/5">
                        <span className="text-slate-400">Total ({passengers} Pax)</span>
                        <span className="text-cyan-400 font-black text-xl">{totalCost} RWF</span>
                      </div>
                      
                      {budgetNum > 0 ? (
                        <div>
                          <div className="flex justify-between text-xs mb-2 font-bold">
                            <span className="text-slate-400">Budget: {budgetNum} RWF</span>
                            <span className={isOverBudget ? 'text-red-400' : 'text-emerald-400'}>
                              {isOverBudget ? 'OVER BUDGET' : 'WITHIN BUDGET'}
                            </span>
                          </div>
                          <div className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isOverBudget ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} style={{ width: `${budgetPercent}%` }}></div>
                          </div>
                          {isOverBudget && (
                            <p className="text-xs text-red-400 mt-3 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20 font-medium">
                              You need {(totalCost - budgetNum).toLocaleString()} RWF more.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic p-3 bg-white/[0.02] rounded-lg text-center border border-white/5">Enter a budget in the top bar.</p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-6">Plan a trip to calculate costs.</p>
                  )}
                </div>
              </div>
            )}

            {/* RISK TAB */}
            {activeTab === 'risk' && (
              <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><IconRisk className="w-4 h-4 text-cyan-500" /> What-If Simulator</h4>
                  <p className="text-xs text-slate-500 mb-4">Simulate scenarios using real route data.</p>
                  
                  <div className="space-y-2">
                    {[
                      "What if I miss the bus?",
                      "What if I am delayed by 30 minutes?",
                      "Is there a cheaper alternative?"
                    ].map((q, i) => (
                      <button key={i} onClick={() => handleSendMessage(q)} className="w-full flex items-center justify-between text-left text-sm bg-black/20 p-3.5 rounded-xl hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 transition-all group">
                        <span className="text-slate-300 group-hover:text-white font-medium">{q}</span>
                        <span className="text-cyan-500 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">Simulate →</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TWIN TAB */}
            {activeTab === 'twin' && (
              <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2"><IconTwin className="w-4 h-4 text-cyan-500" /> Journey Timeline</h4>
                  
                  {selectedOption ? (
                    <>
                      <div className="relative border-l-2 border-white/10 ml-3 space-y-8">
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-4 h-4 bg-cyan-500 rounded-full border-4 border-[#080B15] shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
                          <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-1">Start</p>
                          <p className="text-sm font-bold text-white">{resolvedFrom?.name_en}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-3 h-3 bg-slate-600 rounded-full border-4 border-[#080B15]"></div>
                          <p className="text-xs text-slate-400 font-medium">Ride {selectedOption?.estimated_minutes} mins</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">Via Route {selectedOption?.route?.code || 'AI'}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#080B15] shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">End</p>
                          <p className="text-sm font-bold text-white">{resolvedTo?.name_en}</p>
                        </div>
                      </div>
                      <button onClick={() => setShowMap(true)} className="mt-8 w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                        <IconTwin className="w-4 h-4" /> Open 3D Map Explorer
                      </button>
                    </>
                  ) : (
                     <p className="text-sm text-slate-500 text-center py-6">Plan a trip to see your timeline.</p>
                  )}
                </div>
              </div>
            )}

            {/* SHARE TAB */}
            {activeTab === 'share' && (
              <div className="animate-in slide-in-from-right-4 duration-300 space-y-4">
                <div className="bg-white/[0.03] p-5 rounded-2xl border border-white/5 space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><IconShare className="w-4 h-4 text-cyan-500" /> Share & Save</h4>
                  
                  <button onClick={() => alert("Trip details copied!")} className="w-full flex items-center gap-3 bg-black/20 hover:bg-white/5 text-slate-200 text-sm p-3.5 rounded-xl border border-white/5 transition-colors">
                    <span className="text-lg opacity-80"><IconShare className="w-5 h-5" /></span> Copy Trip Summary
                  </button>
                  <button onClick={() => { setSavedOffline(true); setTimeout(() => setSavedOffline(false), 3000); }} className="w-full flex items-center gap-3 bg-black/20 hover:bg-white/5 text-slate-200 text-sm p-3.5 rounded-xl border border-white/5 transition-colors">
                    <span className="text-lg opacity-80"><IconBudget className="w-5 h-5" /></span> Save Offline
                  </button>
                  {savedOffline && <p className="text-xs text-emerald-400 text-center font-bold animate-pulse pt-2">✓ Saved to device</p>}
                  
                  <div className="pt-4 mt-2 border-t border-white/5">
                    <button onClick={() => alert("Issue reported.")} className="w-full flex items-center justify-center gap-2 text-red-400/80 hover:text-red-400 text-xs py-2 rounded-lg hover:bg-red-500/10 transition-colors">
                      <IconRisk className="w-4 h-4" /> Report Route Issue
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* MAP MODAL */}
      {showMap && (
        <div className="fixed inset-0 z-[100] bg-[#080B15]/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-8">
          <div className="bg-[#0F1423] border border-white/10 rounded-3xl w-full max-w-5xl h-full max-h-[85vh] flex flex-col overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.15)] animate-in zoom-in-95 duration-300 relative">
            
            <div className="absolute top-0 left-0 right-0 z-[400] p-4 sm:p-5 bg-gradient-to-b from-[#0F1423]/90 to-transparent flex justify-between items-start pointer-events-none">
              <h3 className="text-white font-bold flex items-center gap-2 text-sm sm:text-lg pointer-events-auto bg-[#0F1423]/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
                 <span className="text-cyan-400"><IconTwin className="w-5 h-5" /></span> 3D Journey Explorer
              </h3>
              <button 
                onClick={() => setShowMap(false)} 
                className="text-slate-300 hover:text-white bg-[#0F1423]/90 backdrop-blur-xl border border-white/10 hover:border-white/30 px-5 py-3 rounded-2xl text-sm font-bold transition-all pointer-events-auto hover:bg-white/10 shadow-2xl"
              >
                Close Map
              </button>
            </div>

            <div className="flex-1 relative bg-[#0A0D16] w-full h-full rounded-3xl overflow-hidden">
              <MapContainer 
                center={curvedPath[0] as any || [-1.9441, 30.0619]} 
                zoom={13} 
                style={{ height: '100%', width: '100%', background: '#0A0D16' }} 
                zoomControl={false}
              >
                <MapBounds path={curvedPath} />
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Polyline positions={curvedPath as any} color="#06B6D4" weight={6} className="glowing-route" />
                <SimulatedBuses path={curvedPath} />
              </MapContainer>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .leaflet-container { background: #0A0D16; font-family: inherit; }
        .leaflet-tile-pane { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
        .leaflet-control-attribution { display: none; }
        
        @keyframes dash { to { stroke-dashoffset: -30; } }
        .glowing-route { stroke-dasharray: 12; animation: dash 1.5s linear infinite; filter: drop-shadow(0 0 10px #06B6D4); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .custom-scrollbar-hide::-webkit-scrollbar { display: none; }
        .custom-time-input::-webkit-calendar-picker-indicator { filter: invert(1); opacity: 0.5; cursor: pointer; }
      `}</style>
    </div>
  );
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, dLat = ((b.lat - a.lat) * Math.PI) / 180, dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}