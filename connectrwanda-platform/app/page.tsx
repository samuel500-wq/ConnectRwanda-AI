'use client';

import { useState } from 'react';
import Link from 'next/link';
import { links } from '@/lib/links';
import {
  Compass,
  MapPin,
  Sparkles,
  ShieldCheck,
  Menu,
  X,
  Navigation,
  Search,
  Bus,
  CheckCircle2,
  Globe2,
  ArrowRight,
} from '@/components/icons';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-white relative">
      
      {/* ── UNIFIED LAUNCH MODAL ────────────────────────────────────────── */}
      {launchModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#030712]/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in-up">
            <button 
              onClick={() => setLaunchModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="p-8 sm:p-12 text-center border-b border-slate-100">
              <h2 className="text-3xl font-extrabold text-slate-900">Welcome to ConnectRwanda AI</h2>
              <p className="mt-2 text-slate-600 text-lg">How do you want to start your journey today?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <a 
                href={links.routeview.plan}
                className="group relative p-8 sm:p-12 bg-white hover:bg-sky-50 transition-colors border-b md:border-b-0 md:border-r border-slate-100 flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Bus size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Plan a Trip</h3>
                <p className="text-slate-600 mb-8">Find live bus routes, arrival times, and buy digital tickets across Kigali.</p>
                <span className="mt-auto inline-flex items-center gap-2 text-sky-600 font-bold group-hover:gap-3 transition-all">
                  Launch Transit <ArrowRight size={18} />
                </span>
              </a>

              <a 
                href={links.mapforall.discover}
                className="group relative p-8 sm:p-12 bg-white hover:bg-amber-50 transition-colors flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Compass size={40} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Explore Places</h3>
                <p className="text-slate-600 mb-8">Discover accessible venues, local markets, and small businesses around you.</p>
                <span className="mt-auto inline-flex items-center gap-2 text-amber-600 font-bold group-hover:gap-3 transition-all">
                  Launch Discovery <ArrowRight size={18} />
                </span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-[#030712]/90 backdrop-blur-xl border-b border-white/10 text-white transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-sky-500 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] group-hover:scale-105 transition-transform">
              <Navigation size={22} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold tracking-tight">
              ConnectRwanda <span className="text-emerald-400">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#platform" className="hover:text-white transition-colors">The Platform</a>
            <a href="#transit" className="hover:text-white transition-colors">Transit</a>
            <a href="#discovery" className="hover:text-white transition-colors">Discovery</a>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => setLaunchModalOpen(true)}
              className="px-6 py-2.5 rounded-full text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105"
            >
              Launch App
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white/80 hover:bg-white/10"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#030712] border-b border-white/10 px-4 pt-4 pb-6 space-y-4 absolute w-full shadow-2xl">
            <a href="#platform" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-white/80">The Platform</a>
            <a href="#transit" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-white/80">Transit</a>
            <a href="#discovery" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-white/80">Discovery</a>
            <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block text-sm font-medium text-white/80">About</Link>
            <div className="pt-4 border-t border-white/10">
              <button 
                onClick={() => { setMobileMenuOpen(false); setLaunchModalOpen(true); }} 
                className="w-full flex justify-center py-3 rounded-xl bg-white text-slate-900 font-bold text-sm"
              >
                Launch App
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      {/* Reduced padding (pt-28 instead of pt-40) so the mockup is visible faster */}
      <section className="relative pt-32 pb-24 lg:pt-36 lg:pb-32 premium-hero-bg text-white overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-emerald-300 text-xs font-bold uppercase tracking-wider mb-6 animate-fade-in-up">
            <Sparkles size={14} className="text-emerald-400" />
            National AI Infrastructure for Rwanda
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Move smarter.<br />
            <span className="text-gradient-primary">Discover more.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            The first unified AI platform connecting real-time public transit with 
            accessible local discovery. Plan your journey, and explore what's 
            waiting for you when you arrive.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => setLaunchModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-emerald-500 text-white font-bold text-base hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] hover:-translate-y-1"
            >
              <Search size={18} strokeWidth={3} /> Enter the Platform
            </button>
            <a
              href="#platform"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full glass-panel text-white font-bold text-base hover:bg-white/10 transition-all hover:-translate-y-1"
            >
              Explore Features
            </a>
          </div>
        </div>

        {/* ── ANIMATED 3D MOCKUP WITH FLOATING ELEMENTS ───────────────────── */}
        <div className="mt-14 lg:mt-20 max-w-6xl mx-auto px-4 relative animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          
          {/* Massive backdrop glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-r from-emerald-500/20 to-sky-500/20 blur-[100px] rounded-full pointer-events-none"></div>

          {/* 3D Container */}
          <div className="relative mockup-3d">
            
            {/* Browser Frame */}
            <div className="rounded-2xl border border-white/10 bg-[#0F172A] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[480px] sm:h-[550px]">
              <div className="h-12 bg-[#1E293B] border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-400/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
                <div className="mx-auto bg-black/30 rounded-md px-24 py-1.5 text-[11px] text-white/40 font-mono flex items-center gap-2">
                  <ShieldCheck size={12} className="text-emerald-500"/> connectrwanda.ai
                </div>
              </div>
              
              <div className="flex flex-1 overflow-hidden">
                {/* Left Panel */}
                <div className="w-1/3 border-r border-white/5 p-6 bg-[#0F172A] hidden sm:flex flex-col">
                  <div className="flex items-center gap-2 text-white font-bold mb-6">
                    <Bus size={20} className="text-sky-400" /> Active Journey
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-6">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Destination</p>
                    <p className="text-sm text-white font-bold">Kigali Heights</p>
                  </div>
                  <div className="relative pl-5 border-l-2 border-slate-700 space-y-8 flex-1">
                    <div className="relative">
                      <div className="absolute -left-[27px] top-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#0F172A] shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                      <p className="text-sm text-white font-bold">Nyabugogo Bus Park</p>
                      <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Boarded · 08:30 AM</p>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-[27px] top-1 w-4 h-4 bg-sky-500 rounded-full border-4 border-[#0F172A] shadow-[0_0_10px_rgba(56,189,248,0.8)] animate-pulse"></div>
                      <p className="text-sm text-white font-bold">Downtown (CBD)</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">In transit · 08:45 AM</p>
                    </div>
                  </div>
                </div>

                {/* Center Map */}
                <div className="flex-1 relative bg-[#020617] flex items-center justify-center overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                    <path d="M -50 200 Q 200 100 400 300 T 900 150" stroke="#1E293B" strokeWidth="12" fill="none" />
                    <path d="M 100 -50 L 200 600" stroke="#1E293B" strokeWidth="8" fill="none" />
                    <path d="M 500 -50 L 400 600" stroke="#1E293B" strokeWidth="8" fill="none" />
                    
                    {/* Active Route */}
                    <path id="route" d="M -50 200 Q 200 100 400 300 T 900 150" stroke="#38BDF8" strokeWidth="6" fill="none" strokeLinecap="round" className="opacity-80" />
                    
                    {/* Animated Bus */}
                    <circle r="8" fill="#38BDF8" className="animate-dash" style={{ offsetPath: "path('M -50 200 Q 200 100 400 300 T 900 150')", offsetRotate: "auto" }} />
                  </svg>
                  
                  <div className="absolute top-[30%] left-[25%] flex flex-col items-center">
                    <div className="relative flex h-6 w-6 items-center justify-center">
                      <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500 border-2 border-white"></span>
                    </div>
                    <div className="mt-2 px-3 py-1 bg-[#0F172A] border border-white/10 rounded-lg text-xs text-white font-bold whitespace-nowrap shadow-xl">
                      Bus 302
                    </div>
                  </div>
                  
                  <div className="absolute top-[55%] right-[30%] flex flex-col items-center">
                    <div className="w-8 h-8 bg-rose-500/20 rounded-full flex items-center justify-center animate-pulse">
                      <MapPin size={18} className="text-rose-400" />
                    </div>
                  </div>
                </div>

                {/* Right Panel */}
                <div className="w-1/4 border-l border-white/5 p-5 bg-[#0F172A] hidden lg:flex flex-col">
                  <div className="flex items-center gap-2 text-white font-bold mb-5">
                    <Compass size={20} className="text-amber-400" /> Nearby
                  </div>
                  <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20 mb-3 cursor-pointer hover:bg-amber-500/20 transition-colors">
                    <p className="text-sm text-white font-bold flex items-center gap-1.5"><CheckCircle2 size={14} className="text-amber-400"/> Accessible</p>
                    <p className="text-xs text-amber-200/70 mt-1">Verified ramp</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 mb-3 hover:bg-white/10 transition-colors cursor-pointer">
                    <p className="text-sm text-white font-bold">Local Market</p>
                    <p className="text-xs text-slate-400 mt-1">5 min walk</p>
                  </div>
                  <div className="mt-auto">
                    <div className="bg-[#020617] rounded-xl border border-white/10 p-3 flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-400" />
                      <p className="text-xs text-slate-300">Ask AI...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FLOATING ELEMENT: Local Discovery Notification (Outside the browser frame) */}
            <div className="absolute -right-4 sm:-right-12 top-[40%] glass-panel-dark p-4 rounded-xl shadow-2xl animate-float max-w-[240px] border-l-4 border-l-amber-500 hidden sm:block z-20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Compass size={16} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wide">Nearby Discovery</p>
                  <p className="text-sm font-bold text-white mt-1 leading-tight">Artisan Coffee</p>
                  <p className="text-xs text-slate-400 mt-1">2 min walk · Step-free</p>
                </div>
              </div>
            </div>

            {/* FLOATING ELEMENT: Live Arrival Badge (Outside the browser frame) */}
            <div className="absolute -left-4 sm:-left-8 bottom-[20%] glass-panel-dark p-3 rounded-xl shadow-2xl animate-float max-w-[200px] border-l-4 border-l-emerald-500 hidden sm:block z-20" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Bus size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">Arriving Now</p>
                  <p className="text-sm font-bold text-white mt-0.5">Line 302</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── IMPACT STATS ─────────────────────────────────────────────────── */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-extrabold text-slate-900">100%</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-1">Kigali Coverage</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-sky-600">Live</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-1">Fleet Tracking</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-amber-600">1-Tap</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-1">Accessible Routing</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-emerald-600">3</p>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-1">Native Languages</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: PLATFORM ───────────────────────────────────────────── */}
      <section id="platform" className="py-24 bg-slate-50 relative scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              A complete ecosystem in your pocket.
            </h2>
            <p className="mt-6 text-lg text-slate-600">
              We merged complex transit routing and hyper-local discovery into one intuitive, AI-driven interface.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bus size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Smart Transit</h3>
              <p className="text-slate-600 leading-relaxed">
                Live GPS tracking, ML-backed arrival predictions, and seamless intercity journey planning. Never miss a bus again.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Compass size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Accessible Discovery</h3>
              <p className="text-slate-600 leading-relaxed">
                Find wheelchair-accessible entrances, quiet hours, and small local businesses that generic maps miss entirely.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Sparkles size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Unified AI</h3>
              <p className="text-slate-600 leading-relaxed">
                Ask in Kinyarwanda, English, or French. Our AI understands both your transport needs and your destination goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: TRANSIT ────────────────────────────────────────────── */}
      <section id="transit" className="py-24 bg-white relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider mb-6">
                <Bus size={14} /> Smart Transit
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                Never miss a bus again.
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Our transit engine combines live GPS data from public buses with machine learning to predict exactly when your ride will arrive—even in heavy Kigali traffic.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Real-time ML arrival predictions",
                  "Digital ticketing and cashless payments",
                  "Intercity and urban route planning",
                  "Live GPS fleet tracking map"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 size={20} className="text-sky-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <button onClick={() => setLaunchModalOpen(true)} className="px-6 py-3 rounded-full bg-sky-600 text-white font-bold hover:bg-sky-500 transition-colors inline-flex items-center gap-2">
                Plan your route <ArrowRight size={16} />
              </button>
            </div>

            <div className="lg:w-1/2 w-full">
              <div className="relative rounded-3xl bg-white border border-slate-200 p-8 shadow-xl">
                <div className="absolute -top-4 -left-4 w-24 h-24 bg-sky-200 rounded-full blur-2xl opacity-50"></div>
                <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold text-slate-700">Live Fleet Map</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400">Kigali, RW</span>
                </div>
                
                <div className="h-64 bg-slate-100 rounded-xl relative overflow-hidden mb-6 border border-slate-200">
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 100 Q 100 50 200 150 T 400 100" stroke="#CBD5E1" strokeWidth="8" fill="none" />
                    <path d="M 0 100 Q 100 50 200 150 T 400 100" stroke="#0EA5E9" strokeWidth="4" fill="none" strokeDasharray="10, 5" className="animate-[dash_2s_linear_infinite]" />
                  </svg>
                  <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-sky-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <Bus size={14} className="text-white" />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-white px-3 py-1.5 rounded-lg shadow-sm text-xs font-bold text-slate-700">
                    Line 302 · Arriving in 2m
                  </div>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                   <div>
                     <p className="text-xs text-slate-500 uppercase tracking-wide">Fare Estimate</p>
                     <p className="text-lg font-bold text-slate-900">500 RWF</p>
                   </div>
                   <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold">Buy Ticket</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── DEEP DIVE: DISCOVERY ──────────────────────────────────────────── */}
      <section id="discovery" className="py-24 bg-slate-50 relative overflow-hidden scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
            
            <div className="lg:w-1/2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider mb-6">
                <Compass size={14} /> Local Discovery
              </div>
              <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
                Discover what maps miss.
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                We map the wheelchair ramps, the quiet cafes, and the hidden local artisans. When you step off the bus, ConnectRwanda AI helps you explore your exact surroundings with dignity and context.
              </p>
              
              <ul className="space-y-4 mb-8">
                {[
                  "Verified step-free entrances and ramps",
                  "Community-sourced accessibility data",
                  "Support hyper-local small businesses",
                  "One-tap routing back to transit"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                    <CheckCircle2 size={20} className="text-amber-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              
              <button onClick={() => setLaunchModalOpen(true)} className="px-6 py-3 rounded-full bg-amber-500 text-slate-900 font-bold hover:bg-amber-400 transition-colors inline-flex items-center gap-2">
                Explore places <ArrowRight size={16} />
              </button>
            </div>

            <div className="lg:w-1/2 w-full">
               <div className="relative rounded-3xl bg-slate-900 p-8 shadow-2xl overflow-hidden">
                <div className="absolute -top-4 -right-4 w-32 h-32 bg-amber-500 rounded-full blur-3xl opacity-20"></div>
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Compass size={18} className="text-amber-400" />
                    <span className="text-sm font-bold text-white">Discovery Mode</span>
                  </div>
                  <span className="text-xs font-mono text-slate-500">Step-Free Filter: ON</span>
                </div>

                <div className="space-y-4">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <MapPin size={24} className="text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">Artisan Coffee Roasters</h4>
                      <p className="text-sm text-slate-400">2 min walk · Wheelchair ramp</p>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <ShieldCheck size={24} className="text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">Nyamirambo Women's Center</h4>
                      <p className="text-sm text-slate-400">5 min walk · Quiet hours verified</p>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-6 py-3 bg-amber-500 text-slate-900 rounded-xl font-bold hover:bg-amber-400 transition-colors">
                  Find transport here
                </button>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── UNIFIED AI SECTION ────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-400 to-sky-500 mx-auto flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <Sparkles size={32} className="text-white" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-6">
            One AI Companion.<br/>Every language.
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            Whether you need to know which bus goes to Kimironko at 8 AM, or where to find a step-free pharmacy in Kacyiru, our AI assistant understands you natively.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <span className="px-6 py-3 rounded-full glass-panel text-white font-medium flex items-center gap-2"><Globe2 size={18} className="text-emerald-400"/> English</span>
            <span className="px-6 py-3 rounded-full glass-panel text-white font-medium flex items-center gap-2"><Globe2 size={18} className="text-sky-400"/> Kinyarwanda</span>
            <span className="px-6 py-3 rounded-full glass-panel text-white font-medium flex items-center gap-2"><Globe2 size={18} className="text-amber-400"/> Français</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="bg-[#030712] text-slate-300 border-t border-white/10 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6 text-white">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-400 to-sky-500 flex items-center justify-center text-white">
                  <Navigation size={18} strokeWidth={2.5} />
                </div>
                <span className="text-2xl font-bold tracking-tight">ConnectRwanda AI</span>
              </div>
              <p className="text-slate-400 text-base max-w-sm mb-8">
                The unified infrastructure for smart mobility and accessible discovery across Rwanda.
              </p>
              <button 
                onClick={() => setLaunchModalOpen(true)}
                className="px-6 py-2.5 rounded-full text-sm font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all inline-flex items-center gap-2"
              >
                Launch App <ArrowRight size={16} />
              </button>
            </div>
            
            <div>
              <p className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Transit</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href={links.routeview.plan} className="hover:text-sky-400 transition-colors">Plan a Journey</a></li>
                <li><a href={links.routeview.map} className="hover:text-sky-400 transition-colors">Live Transit Map</a></li>
                <li><a href={links.routeview.tickets} className="hover:text-sky-400 transition-colors">Digital Tickets</a></li>
              </ul>
            </div>

            <div>
              <p className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Discovery</p>
              <ul className="space-y-3 text-sm text-slate-400">
                <li><a href={links.mapforall.discover} className="hover:text-amber-400 transition-colors">Accessible Places</a></li>
                <li><a href={links.mapforall.chat} className="hover:text-amber-400 transition-colors">AI Companion</a></li>
                <li><Link href="/about" className="hover:text-amber-400 transition-colors">Mission & Architecture</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>&copy; {new Date().getFullYear()} ConnectRwanda AI. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-slate-300 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-300 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}