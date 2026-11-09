'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/plan',    key: 'plan',    labelEn: 'Plan',     labelRw: 'Gahunda',   icon: 'route' },
  { href: '/map',     key: 'map',     labelEn: 'Live map', labelRw: 'Ikarita',   icon: 'map' },
  { href: '/routes',  key: 'routes',  labelEn: 'Routes',   labelRw: 'Inzira',    icon: 'list' },
  { href: '/places',  key: 'places',  labelEn: 'Places',   labelRw: 'Ahantu',    icon: 'pin' },
  { href: '/tickets', key: 'tickets', labelEn: 'Tickets',  labelRw: 'Tiketi',    icon: 'ticket' },
];

const ICONS: Record<string, JSX.Element> = {
  route: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M6 17V9a4 4 0 0 1 4-4h4" />
    </svg>
  ),
  map: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 20 3 17V4l6 3 6-3 6 3v13l-6-3-6 3Z" />
    </svg>
  ),
  list: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  ),
  pin: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  ticket: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2M13 17v2M13 11v2" />
    </svg>
  ),
};

export function Header() {
  const pathname = usePathname();
  const { lang, setLang } = useI18n();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [imgError, setImgError] = useState(false); // Added for logo fallback

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const displayLang = mounted ? lang : 'en';
  const displayUser = mounted ? user : null;
  const t = (en: string, rw: string) => (displayLang === 'rw' ? rw : en);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-navy/90 backdrop-blur-xl shadow-lg shadow-navy-900/20'
          : 'bg-navy/75 backdrop-blur-md'
      }`}
    >
      {/* Top accent line */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-teal/70 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* ---------- Brand ---------- */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 shrink-0"
            aria-label="ConnectRwanda AI home"
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal via-teal to-electric flex items-center justify-center text-white font-bold text-sm shadow-md shadow-teal/30 transition-transform group-hover:scale-105 overflow-hidden">
                {!imgError ? (
                  <img 
                    // Make sure this is the DIRECT image link (e.g. https://i.ibb.co/XXXX/logo.png)
                    src="https://i.ibb.co/DDH9m63L/ConnectRwanda-Logo.png" 
                    alt="CR Logo"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  "CR"
                )}
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-mint ring-2 ring-navy" />
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-semibold leading-tight text-[15px] tracking-tight">
                ConnectRwanda AI
              </div>
              <div className="text-teal text-[10px] tracking-[0.18em] uppercase font-medium">
                Mobility Intelligence
              </div>
            </div>
          </Link>

          {/* ---------- Desktop nav ---------- */}
          <nav
            className="hidden lg:flex items-center gap-0.5 flex-1 justify-center"
            aria-label="Main navigation"
          >
            {NAV.map((n) => {
              const active = isActive(n.href);
              return (
                <Link
                  key={n.key}
                  href={n.href}
                  className={`group relative flex items-center gap-1.5 px-3 py-2 rounded-pill text-sm font-medium transition-all duration-200 ${
                    active
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/65 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <span
                    className={`transition-opacity ${
                      active ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                    }`}
                  >
                    {ICONS[n.icon]}
                  </span>
                  <span>{displayLang === 'rw' ? n.labelRw : n.labelEn}</span>
                  {active && (
                    <span className="absolute inset-x-3 -bottom-[6px] h-[2px] rounded-full bg-gradient-to-r from-transparent via-teal to-transparent" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* ---------- Right actions ---------- */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language toggle */}
            <button
              onClick={() => setLang(displayLang === 'rw' ? 'en' : 'rw')}
              className="group relative flex items-center gap-1 text-xs font-semibold text-white/75 hover:text-white px-2.5 py-1.5 rounded-pill border border-white/15 hover:border-teal/50 hover:bg-white/5 transition-all"
              aria-label={`Switch language to ${displayLang === 'rw' ? 'English' : 'Kinyarwanda'}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              {displayLang === 'rw' ? 'EN' : 'RW'}
            </button>

            {/* MapForAll Cross Link */}
            <a
              href={process.env.NEXT_PUBLIC_MAPFORALL_URL || 'http://localhost:3001'}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-white px-3 py-1.5 rounded-pill bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all"
              title="Discover accessible places on MapForAll"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
              </svg>
              Discover Places
            </a>

            {/* Admin Button */}
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white px-3 py-1.5 rounded-pill hover:bg-white/[0.06] transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2 2 7v10l10 5 10-5V7z" />
                <path d="M12 22V12" />
                <path d="M2 7l10 5 10-5" />
              </svg>
              {t('Admin', 'Admin')}
            </Link>

            {displayUser ? (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  onClick={logout}
                  className="text-sm font-medium text-white/70 hover:text-danger px-3 py-1.5 rounded-pill hover:bg-danger/10 transition-all"
                >
                  {t('Sign out', 'Sohoka')}
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold bg-gradient-to-r from-electric to-electric-600 hover:from-electric-600 hover:to-electric-700 text-white px-4 py-2 rounded-pill shadow-md shadow-electric/25 transition-all hover:shadow-electric/40 hover:-translate-y-0.5"
              >
                {t('Sign in', 'Injira')}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? (
                  <>
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="7" x2="21" y2="7" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ---------- Mobile drawer ---------- */}
      <div
        className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 ${
          open ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="border-t border-white/10 bg-navy/95 backdrop-blur-xl px-4 py-4 space-y-1">
          {NAV.map((n) => {
            const active = isActive(n.href);
            return (
              <Link
                key={n.key}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal/15 text-white border border-teal/30'
                    : 'text-white/75 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
              >
                <span className={active ? 'text-teal' : 'text-white/50'}>
                  {ICONS[n.icon]}
                </span>
                <span>{displayLang === 'rw' ? n.labelRw : n.labelEn}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-teal" />
                )}
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-white/10 space-y-1">
            {/* Mobile Admin Link */}
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive('/admin')
                  ? 'bg-teal/15 text-white border border-teal/30'
                  : 'text-white/75 hover:text-white hover:bg-white/[0.06] border border-transparent'
              }`}
            >
              <span className={isActive('/admin') ? 'text-teal' : 'text-white/50'}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 2 7v10l10 5 10-5V7z" />
                  <path d="M12 22V12" />
                  <path d="M2 7l10 5 10-5" />
                </svg>
              </span>
              {t('Admin', 'Admin')}
            </Link>

            {displayUser ? (
              <button
                onClick={() => { logout(); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-danger/80 hover:text-danger hover:bg-danger/10 transition-all text-left"
              >
                <span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                </span>
                {t('Sign out', 'Sohoka')}
              </button>
            ) : (
              <Link
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-electric to-electric-600 text-white shadow-md shadow-electric/25 mt-1"
              >
                {t('Sign in', 'Injira')}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}