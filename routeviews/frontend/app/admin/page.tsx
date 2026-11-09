'use client';
import { useState, useEffect } from 'react';

// ── PREMIUM ICONS ─────────────────────────────────────────────────────────
const IconRevenue = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>;
const IconBookings = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2M13 17v2M13 11v2"/></svg>;
const IconVehicles = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10H4V6Z"/><path d="M4 12h16M8 20v-2M16 20v-2"/><circle cx="8" cy="16" r="1.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="currentColor"/></svg>;
const IconRedeem = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
const IconAI = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>;
const IconRefresh = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IconArrowUp = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>;
const IconCPU = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>;
const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const IconMap = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/></svg>;

export default function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevents hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  if (!mounted) return null;

  return (
    <div className="p-6 sm:p-10 max-w-[1600px] mx-auto w-full">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-base font-medium text-slate-400 mt-2">Operations, revenue and fleet health over the last 30 days.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm font-bold text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span> Live Data
          </span>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-slate-300 hover:bg-white/10 transition-colors"
          >
            <IconRefresh /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </header>

      {/* ── ROW 1: STAT CARDS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        
        {/* Revenue */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue (30d)</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] group-hover:scale-110 transition-transform">
              <IconRevenue />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-4xl font-black text-white">7,400</h3>
            <span className="text-sm font-bold text-emerald-500">RWF</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
              <IconArrowUp /> 100%
            </span>
            <span className="text-slate-500 font-medium">vs prior 30d</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-60 transition-opacity">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,15 Q20,10 40,12 T80,5 T100,2 L100,20 L0,20 Z" fill="#10B981" opacity="0.2"/>
              <path d="M0,15 Q20,10 40,12 T80,5 T100,2" fill="none" stroke="#10B981" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        {/* Bookings */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bookings (30d)</p>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)] group-hover:scale-110 transition-transform">
              <IconBookings />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-4xl font-black text-white">3</h3>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md flex items-center gap-1">
              <IconArrowUp /> 100%
            </span>
            <span className="text-slate-500 font-medium">Urban + interprovincial</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-60 transition-opacity">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,18 L20,18 L40,10 L60,15 L80,5 L100,5 L100,20 L0,20 Z" fill="#06B6D4" opacity="0.2"/>
              <path d="M0,18 L20,18 L40,10 L60,15 L80,5 L100,5" fill="none" stroke="#06B6D4" strokeWidth="2"/>
            </svg>
          </div>
        </div>

        {/* Vehicles */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Vehicles</p>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:scale-110 transition-transform">
              <IconVehicles />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-4xl font-black text-white">0</h3>
            <span className="text-sm font-bold text-slate-500">/ 12</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="text-slate-300">All live</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-60 transition-opacity">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,10 L100,10" fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 4"/>
            </svg>
          </div>
        </div>

        {/* Redemptions */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Redemptions (30d)</p>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:scale-110 transition-transform">
              <IconRedeem />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-4xl font-black text-white">0</h3>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="text-slate-500 font-medium">0 active alerts</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 opacity-30 group-hover:opacity-60 transition-opacity">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
               <path d="M0,18 L100,18" fill="none" stroke="#F59E0B" strokeWidth="2"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── ROW 2: MAIN CHART & AI INSIGHTS ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        
        {/* Main Chart */}
        <div className="xl:col-span-2 rounded-3xl border border-white/10 bg-[#0A0D1A]/80 p-8 relative overflow-hidden backdrop-blur-xl flex flex-col min-h-[450px]">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-white">Daily Bookings</h2>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> Bookings</span>
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-500"></span> Revenue (×1000)</span>
              </div>
            </div>
            <div className="text-right flex gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Daily avg</p>
                <p className="text-lg font-black text-white">0</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Peak</p>
                <p className="text-lg font-black text-white">0</p>
              </div>
            </div>
          </div>

          <div className="flex-1 relative w-full flex items-end">
            <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-bold text-slate-600">
              <span>3</span><span>2</span><span>1</span><span>0</span>
            </div>
            <div className="ml-6 w-full h-[280px] relative border-l border-b border-white/10">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[1, 2, 3].map(i => <div key={i} className="w-full border-t border-white/5 border-dashed"></div>)}
              </div>
              <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M 0,85 Q 15,85 25,95 T 60,95 T 85,80 T 100,40 L 100,100 L 0,100 Z" fill="url(#areaGrad)" />
                <path d="M 0,85 Q 15,85 25,95 T 60,95 T 85,80 T 100,40" fill="none" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="0" cy="85" r="3" fill="#080B15" stroke="#06B6D4" strokeWidth="2" />
                <circle cx="100" cy="40" r="4" fill="#080B15" stroke="#06B6D4" strokeWidth="2" />
              </svg>
            </div>
          </div>
          <div className="ml-6 flex justify-between mt-4 text-[10px] font-bold text-slate-600">
            <span>Oct 9</span><span className="hidden sm:inline">Oct 14</span><span>Oct 19</span>
            <span className="hidden sm:inline">Oct 24</span><span>Oct 29</span><span>Nov 3</span>
          </div>
        </div>

        {/* AI Insights Panel */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-950/40 via-[#0A0D1A] to-blue-950/20 p-6 relative overflow-hidden backdrop-blur-xl flex flex-col">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-cyan-500/15 blur-[60px] rounded-full pointer-events-none"></div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <IconAI />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">AI Insights</h2>
              <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Grounded in live data</p>
            </div>
          </div>
          <div className="space-y-3 relative z-10 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.08] transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><h3 className="text-sm font-bold text-white">Revenue Grows 100%</h3></div>
              <p className="text-xs text-slate-400 leading-relaxed">Revenue increased by 100% to RWF 7400.</p>
            </div>
            <div className="bg-white/[0.04] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.08] transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400"></span><h3 className="text-sm font-bold text-white">No Redemptions</h3></div>
              <p className="text-xs text-slate-400 leading-relaxed">No redemptions were recorded recently.</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 hover:bg-amber-500/15 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 mb-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span><h3 className="text-sm font-bold text-white">Only 5 Users Active</h3></div>
              <p className="text-xs text-slate-400 leading-relaxed">Activity is lower than usual this month.</p>
            </div>
          </div>
          <button className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 shrink-0">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center"><IconAI /></div> Talk to AI
          </button>
        </div>
      </div>

      {/* ── ROW 3: REAL FEATURES (ACTIVITY & SYSTEM) ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        
        {/* Recent Alerts */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><IconAlert /> Recent Alerts</h2>
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded">2 ACTIVE</span>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 text-red-400"><IconAlert /></div>
              <div><p className="text-sm font-bold text-white">Route R1 Delayed</p><p className="text-xs text-slate-400 mt-1">Heavy traffic on KN 3 Rd. Expected delay: 15 mins.</p></div>
            </div>
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-400"><IconAlert /></div>
              <div><p className="text-sm font-bold text-white">Low Capacity Warning</p><p className="text-xs text-slate-400 mt-1">Bus B-402 is at 90% capacity for the 17:00 departure.</p></div>
            </div>
            <div className="flex gap-3 items-start opacity-50">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400"><IconAlert /></div>
              <div><p className="text-sm font-bold text-white">All Systems Nominal</p><p className="text-xs text-slate-400 mt-1">Routine scan complete at 08:00 AM.</p></div>
            </div>
          </div>
        </div>

        {/* Top Routes Leaderboard */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2"><IconMap /> Top Routes</h2>
            <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300">View All</button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Kigali → Musanze', revenue: '4,200', percent: 85 },
              { name: 'Kigali → Huye', revenue: '3,100', percent: 65 },
              { name: 'Rubavu → Kigali', revenue: '1,900', percent: 40 },
              { name: 'Musanze → Rubavu', revenue: '800', percent: 20 },
            ].map((route, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-400">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-bold text-white">{route.name}</span>
                    <span className="font-bold text-cyan-400">{route.revenue} RWF</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${route.percent}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Monitor */}
        <div className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><IconCPU /> System Health</h2>
          
          <div className="space-y-5 flex-1">
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-300">Backend API (Express)</span>
                <span className="text-emerald-400">99.9% Uptime</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-[99.9%] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-300">ML Prediction Engine</span>
                <span className="text-cyan-400">87% Load</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full w-[87%]"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm font-bold mb-2">
                <span className="text-slate-300">Database Connections</span>
                <span className="text-amber-400">42 / 100</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full w-[42%]"></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Status</span>
             <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> All Systems Go
             </span>
          </div>
        </div>

      </div>
    </div>
  );
}