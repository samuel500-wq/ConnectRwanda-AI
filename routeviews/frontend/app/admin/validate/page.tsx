'use client';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

/* ================================================================== *
 *  Types                                                              *
 * ================================================================== */
type ScanResult = {
  ok: boolean;
  code: string;
  reference?: string;
  passenger_name?: string;
  route?: string;
  company?: string;
  departure_dt?: string;
  plate_number?: string;
  driver_name?: string;
  used_at?: string;
  redeemed_at?: string;
  reason?: string;
  ticket_type?: 'urban' | 'intercity';
  ts: number;
};

type Recent = ScanResult;

/* ================================================================== *
 *  Page                                                               *
 * ================================================================== */
export default function AdminValidatePage() {
  const { lang } = useI18n();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);

  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [cameraState, setCameraState] = useState<'idle' | 'starting' | 'running' | 'unsupported' | 'denied' | 'stopped'>('idle');
  const [plateNumber, setPlateNumber] = useState('');
  const [mounted, setMounted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const lastScanRef = useRef<{ code: string; ts: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ---- Load recent scans from localStorage ----
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('rv_validate_recent');
      if (raw) setRecent(JSON.parse(raw).slice(0, 20));
    } catch { /* ignore */ }
  }, []);

  // ---- Persist recent scans ----
  useEffect(() => {
    try {
      window.localStorage.setItem('rv_validate_recent', JSON.stringify(recent.slice(0, 20)));
    } catch { /* ignore */ }
  }, [recent]);

  // ---- Today's stats ----
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayScans = recent.filter((r) => new Date(r.ts).toDateString() === today);
    const accepted = todayScans.filter((r) => r.ok).length;
    const rejected = todayScans.filter((r) => !r.ok).length;
    return { total: todayScans.length, accepted, rejected };
  }, [recent]);

  // ---- Redeem a code ----
  const redeem = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (
      lastScanRef.current &&
      lastScanRef.current.code === trimmed &&
      now - lastScanRef.current.ts < 3000
    ) {
      return;
    }
    lastScanRef.current = { code: trimmed, ts: now };

    setBusy(true);
    setResult(null);

    const isIntercityPayload = trimmed.startsWith('routeview://intercity/');

    let scan: ScanResult;

    const tryIntercity = async () => {
      const r = await api.intercityRedeem(trimmed, plateNumber || undefined);
      return {
        ok: true,
        code: r.code,
        reference: r.reference,
        passenger_name: r.passenger_name,
        route: r.route,
        company: r.company,
        departure_dt: r.departure_dt,
        plate_number: r.plate_number,
        driver_name: r.driver_name,
        used_at: r.used_at,
        ticket_type: 'intercity' as const,
        ts: Date.now()
      };
    };

    const tryUrban = async () => {
      const r = await api.redeemTicket(trimmed);
      return {
        ok: true,
        code: r.code,
        redeemed_at: r.redeemed_at,
        ticket_type: 'urban' as const,
        ts: Date.now()
      };
    };

    try {
      if (isIntercityPayload) {
        scan = await tryIntercity();
      } else {
        try {
          scan = await tryIntercity();
        } catch (e: any) {
          const msg = String(e?.message || '');
          if (msg.includes('ticket_not_found')) {
            scan = await tryUrban();
          } else {
            throw e;
          }
        }
      }
    } catch (e: any) {
      const msg = String(e?.message || 'unknown_error');
      scan = {
        ok: false,
        code: trimmed,
        reason: msg,
        ticket_type: isIntercityPayload ? 'intercity' : undefined,
        ts: Date.now()
      };
    }

    setResult(scan);
    setRecent((prev) => [scan, ...prev].slice(0, 20));
    setBusy(false);
    setCode('');

    setTimeout(() => inputRef.current?.focus(), 200);
    setTimeout(() => {
      setResult((cur) => (cur && cur.ts === scan.ts ? null : cur));
    }, 6000);
  }, [plateNumber]);

  // ---- Start camera + barcode detection ----
  const startCamera = useCallback(async () => {
    if (cameraState === 'running' || cameraState === 'starting') return;

    if (!('BarcodeDetector' in window)) {
      setCameraState('unsupported');
      return;
    }

    setCameraState('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      setCameraState('running');

      const Detector = (window as any).BarcodeDetector;
      const detector = new Detector({ formats: ['qr_code'] });
      detectorRef.current = detector;

      const loop = async () => {
        const v = videoRef.current;
        if (!v || !detectorRef.current) return;
        try {
          const barcodes = await detectorRef.current.detect(v);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue;
            if (raw) redeem(raw);
          }
        } catch { /* ignore */ }
        rafRef.current = requestAnimationFrame(loop);
      };
      loop();
    } catch (e: any) {
      setCameraState('denied');
    }
  }, [cameraState, redeem]);

  // ---- Stop camera ----
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    detectorRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraState('idle');
  }, []);

  // ---- Auto-start camera on mount ----
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function onManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    redeem(code);
  }

  function clearRecent() {
    setRecent([]);
    try { window.localStorage.removeItem('rv_validate_recent'); } catch {}
  }

  if (!mounted) return null;

  return (
    <div className="p-6 sm:p-10 max-w-[1600px] mx-auto w-full relative z-10">
      
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">{t('Genzura bileti', 'Validate Ticket')}</h1>
          <p className="text-sm font-medium text-slate-400 mt-1">
            {t('Soma QR code cyangwa wandike kode.', 'Scan a QR code or type the ticket reference.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/bookings"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10"
          >
            {t('Reba ingendo zose', 'View bookings')}
          </Link>
        </div>
      </header>

      {/* ── TODAY'S STATS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <StatTile label={t('Byagenzuwe uyu munsi', 'Scanned today')} value={stats.total} tone="cyan" />
        <StatTile label={t('Byemejwe', 'Accepted')} value={stats.accepted} tone="emerald" />
        <StatTile label={t('Byanze', 'Rejected')} value={stats.rejected} tone="rose" />
      </div>

      {/* ── RESULT BANNER ───────────────────────────────────────────────── */}
      {result && <ResultBanner result={result} onDismiss={() => setResult(null)} t={t} />}

      {/* ── MAIN GRID ───────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        
        {/* Left Column: Scanner & Manual Entry */}
        <div className="space-y-6">
          
          {/* Scanner Card */}
          <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl shadow-2xl">
            <header className="flex items-center gap-3 border-b border-white/10 px-6 py-4 bg-white/[0.02]">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <CameraIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-white">{t('Kamera', 'Camera scanner')}</p>
                <p className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-0.5">
                  <StatusDot state={cameraState} />
                  {cameraStateLabel(cameraState, t)}
                </p>
              </div>
              {cameraState === 'running' ? (
                <button
                  onClick={stopCamera}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/10"
                >
                  {t('Hagarika', 'Stop')}
                </button>
              ) : cameraState === 'idle' || cameraState === 'stopped' ? (
                <button
                  onClick={startCamera}
                  className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-black transition hover:bg-cyan-400"
                >
                  {t('Tangira', 'Start')}
                </button>
              ) : null}
            </header>

            <div className="relative aspect-[4/3] w-full bg-[#05070E]">
              {/* Corner brackets */}
              <div className="pointer-events-none absolute inset-8 z-10">
                <Corner pos="tl" />
                <Corner pos="tr" />
                <Corner pos="bl" />
                <Corner pos="br" />
              </div>

              {/* Scan line */}
              {cameraState === 'running' && (
                <div className="pointer-events-none absolute inset-x-8 top-8 z-10 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-90">
                  <div className="rv-scan-line" />
                </div>
              )}

              <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />

              {/* Overlay Messages */}
              {cameraState !== 'running' && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#05070E]/90 p-6 text-center backdrop-blur-md">
                  <div className="max-w-xs">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-400">
                      <QrIcon />
                    </div>
                    <p className="mt-5 text-base font-bold text-white">
                      {cameraStateHeadline(cameraState, t)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      {cameraStateHelp(cameraState, t)}
                    </p>
                    {(cameraState === 'denied' || cameraState === 'idle' || cameraState === 'stopped') && (
                      <button
                        onClick={startCamera}
                        className="mt-6 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-black transition hover:bg-cyan-400"
                      >
                        {cameraState === 'denied'
                          ? t('Gerageza ukoreshe kamera', 'Try camera again')
                          : t('Tangira kamera', 'Start camera')}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Plate Number Input */}
            <div className="border-t border-white/10 px-6 py-4 bg-white/[0.01]">
              <label className="block group">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                  {t('Nomero y’imodoka (bidategetswe)', 'Vehicle plate (optional)')}
                </span>
                <input
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  placeholder="RAD 123 A"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-sm uppercase tracking-wider text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                />
              </label>
              <p className="mt-2 text-[11px] font-medium text-slate-500">
                {t('Iyi nomero izandikwa kuri bileti iyo yemejwe.', 'If provided, this plate is recorded on the ticket when redeemed.')}
              </p>
            </div>
          </section>

          {/* Manual Entry */}
          <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-300">
                <KeyIcon />
              </span>
              <div>
                <p className="text-base font-bold text-white">{t('Kode y’ukoresha', 'Manual entry')}</p>
                <p className="text-xs font-medium text-slate-400">{t('Andika kode y’ubwiriza', 'Type the ticket reference or paste the QR payload')}</p>
              </div>
            </div>

            <form onSubmit={onManualSubmit} className="flex flex-col gap-3 sm:flex-row">
              <input
                ref={inputRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('Urugero: a4b8c2d1f9h2', 'Example: a4b8c2d1f9h2')}
                disabled={busy}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 font-mono text-sm tracking-wider text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                type="submit"
                disabled={!code.trim() || busy}
                className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 disabled:opacity-50 disabled:shadow-none"
              >
                {busy ? t('Turagenzura…', 'Checking…') : t('Genzura', 'Validate')}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              <HintPill label="routeview://intercity/…" />
              <HintPill label="routeview://ticket/…" />
              <HintPill label="24-char code" />
            </div>
          </section>
        </div>

        {/* Right Column: Recent Scans */}
        <section className="rounded-3xl border border-white/10 bg-[#0A0D1A]/80 backdrop-blur-xl shadow-2xl flex flex-col">
          <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 bg-white/[0.02] shrink-0">
            <div>
              <p className="text-base font-bold text-white">{t('Byagenzuwe vuba', 'Recent scans')}</p>
              <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('Amasegonda 20 ashize', 'Last 20 validations')}</p>
            </div>
            {recent.length > 0 && (
              <button
                onClick={clearRecent}
                className="text-xs font-bold text-slate-400 transition hover:text-white"
              >
                {t('Siba', 'Clear')}
              </button>
            )}
          </header>

          {recent.length === 0 ? (
            <div className="p-12 text-center flex-1 flex flex-col items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-slate-500">
                <ClockIcon />
              </div>
              <p className="mt-5 text-base font-bold text-white">
                {t('Nta bileti yagenzuwe', 'No scans yet')}
              </p>
              <p className="mt-1.5 text-sm text-slate-400">
                {t('Bileti uzemeza zizagaragara hano.', 'Validated tickets will appear here.')}
              </p>
            </div>
          ) : (
            <ul className="max-h-[640px] divide-y divide-white/5 overflow-y-auto custom-scrollbar">
              {recent.map((r) => (
                <li key={`${r.ts}-${r.code}`} className={`px-6 py-4 transition-colors hover:bg-white/[0.02] ${r.ok ? '' : 'bg-red-500/[0.03]'}`}>
                  <div className="flex items-start gap-4">
                    <span className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border ${
                      r.ok ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                           : 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                    }`}>
                      {r.ok ? <CheckIcon /> : <XIcon />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-mono text-sm font-bold text-white">
                          {r.reference || r.code.slice(0, 14)}
                        </p>
                        <span className="flex-shrink-0 text-[10px] font-bold text-slate-500">
                          {timeAgo(r.ts)}
                        </span>
                      </div>
                      {r.ok ? (
                        <>
                          {r.passenger_name && (
                            <p className="mt-1 truncate text-sm font-bold text-slate-300">{r.passenger_name}</p>
                          )}
                          {r.route && (
                            <p className="truncate text-xs font-medium text-slate-400 mt-0.5">{r.route}</p>
                          )}
                          {r.company && (
                            <p className="truncate text-[11px] font-medium text-slate-500 mt-1">
                              {r.company}{r.plate_number ? ` · ${r.plate_number}` : ''}
                            </p>
                          )}
                          {r.ticket_type === 'urban' && (
                            <p className="truncate text-[11px] font-medium text-cyan-500 mt-1">
                              {t('Bileti y’umujyi', 'Urban ticket')}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="mt-1.5 text-xs font-bold text-red-400">
                          {humanReason(r.reason, t)}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <style jsx global>{`
        @keyframes rv-scan {
          0%   { top: 0%; opacity: 1; }
          50%  { top: 100%; opacity: 1; }
          100% { top: 0%; opacity: 1; }
        }
        .rv-scan-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #06B6D4, transparent);
          box-shadow: 0 0 15px #06B6D4;
          animation: rv-scan 3s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}</style>
    </div>
  );
}

/* ================================================================== *
 *  Result Banner                                                      *
 * ================================================================== */
function ResultBanner({ result, onDismiss, t }: { result: ScanResult; onDismiss: () => void; t: any }) {
  const isOk = result.ok;
  
  return (
    <div
      className={`relative overflow-hidden rounded-3xl border p-6 shadow-2xl mb-6 animate-in slide-in-from-top-4 duration-300 ${
        isOk 
          ? 'bg-gradient-to-br from-emerald-950/40 to-[#0A0D1A] border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.15)]' 
          : 'bg-gradient-to-br from-red-950/40 to-[#0A0D1A] border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.15)]'
      }`}
    >
      <button
        onClick={onDismiss}
        className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
        aria-label="Dismiss"
      >
        <XIcon />
      </button>

      <div className="flex items-start gap-5">
        <span className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border ${
          isOk ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'
        }`}>
          {isOk ? <BigCheck /> : <BigX />}
        </span>

        <div className="min-w-0 flex-1 pt-1">
          <p className={`text-[11px] font-black uppercase tracking-widest ${isOk ? 'text-emerald-500' : 'text-red-500'}`}>
            {isOk ? t('Yemejwe', 'Accepted') : t('Yanzwe', 'Rejected')}
          </p>
          <p className="mt-1 text-2xl font-black tracking-tight text-white">
            {isOk
              ? result.passenger_name || t('Bileti yemejwe', 'Ticket accepted')
              : humanReason(result.reason, t)}
          </p>
          
          {isOk && result.route && (
            <p className="mt-1 text-sm font-medium text-slate-300">{result.route}</p>
          )}
          {isOk && result.reference && (
            <p className="mt-2 font-mono text-xs font-bold text-slate-400 bg-black/30 inline-block px-2 py-1 rounded-md border border-white/5">
              {result.reference}
            </p>
          )}
          {isOk && result.company && (
            <p className="mt-2 text-xs font-medium text-slate-400">
              {result.company}
              {result.plate_number && ` · ${result.plate_number}`}
              {result.driver_name && ` · ${result.driver_name}`}
            </p>
          )}
          {isOk && result.departure_dt && (
            <p className="mt-1 text-xs font-medium text-slate-400">
              {t('Igihe cyo gutangira', 'Departure')}: {new Date(result.departure_dt).toLocaleString()}
            </p>
          )}
          <p className="mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {new Date(result.ts).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== *
 *  Small pieces                                                       *
 * ================================================================== */
function StatTile({ label, value, tone }: { label: string; value: number; tone: 'cyan' | 'emerald' | 'rose' }) {
  const styles = {
    cyan: 'text-cyan-400 border-cyan-500/20 bg-cyan-500/5',
    emerald: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
    rose: 'text-red-400 border-red-500/20 bg-red-500/5'
  };
  return (
    <div className={`rounded-2xl border p-5 backdrop-blur-md ${styles[tone]}`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`mt-1.5 text-3xl font-black tracking-tight ${styles[tone].split(' ')[0]}`}>{value}</p>
    </div>
  );
}

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const styles = 'absolute h-8 w-8 border-cyan-500/50';
  const map: any = {
    tl: 'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
    tr: 'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
    bl: 'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
    br: 'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl'
  };
  return <span className={`${styles} ${map[pos]}`} />;
}

function HintPill({ label }: { label: string }) {
  return (
    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] font-bold text-slate-400">
      {label}
    </span>
  );
}

function StatusDot({ state }: { state: string }) {
  const cls =
    state === 'running' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
    : state === 'starting' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'
    : state === 'denied' || state === 'unsupported' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
    : 'bg-slate-500';
  return (
    <span className={`inline-block h-2 w-2 rounded-full ${cls} ${state === 'starting' || state === 'running' ? 'animate-pulse' : ''}`} />
  );
}

/* ================================================================== *
 *  Copy helpers                                                       *
 * ================================================================== */
function cameraStateLabel(state: string, t: any) {
  switch (state) {
    case 'starting': return t('Turatanga kamera…', 'Starting camera…');
    case 'running': return t('Irakora · shyiramo QR', 'Scanning · point at a QR code');
    case 'denied': return t('Kamera yanzwe', 'Camera access denied');
    case 'unsupported': return t('Mudasobwa ntishyigikira QR scanner', 'Browser does not support QR scanning');
    case 'stopped': return t('Yahagaritswe', 'Camera stopped');
    default: return t('Irafunze', 'Camera idle');
  }
}

function cameraStateHeadline(state: string, t: any) {
  switch (state) {
    case 'starting': return t('Turatanga kamera…', 'Starting camera…');
    case 'denied': return t('Kamera yanzwe', 'Camera access denied');
    case 'unsupported': return t('Scanner ntaboneka', 'Scanner not available');
    case 'stopped': return t('Kamera yahagaritswe', 'Camera stopped');
    default: return t('Kamera irafunze', 'Camera is idle');
  }
}

function cameraStateHelp(state: string, t: any) {
  switch (state) {
    case 'denied':
      return t('Emeza uruhushya rwa kamera muri browser kugira ngo ushobore gusoma QR.', 'Enable camera access in your browser settings to scan QR codes.');
    case 'unsupported':
      return t('Koresha Chrome cyangwa Edge, cyangwa andika kode mu buryo bwa manuwe.', 'Use Chrome or Edge, or type the ticket code manually.');
    case 'stopped':
      return t('Kanda "Tangira" kugira ngo wongere gukoresha kamera.', 'Click Start to resume scanning.');
    default:
      return t('Kanda "Tangira" kugira ngo utangire gusoma QR code.', 'Click Start to begin scanning QR codes.');
  }
}

function humanReason(reason: string | undefined, t: any): string {
  if (!reason) return t('Kode ntariyo', 'Invalid code');
  const map: Record<string, string> = {
    ticket_not_found: t('Bileti ntabonetse', 'Ticket not found'),
    already_used: t('Yamaze gukoreshwa', 'Already used'),
    already_redeemed: t('Yamaze gukoreshwa', 'Already used'),
    ticket_cancelled: t('Yahagaritswe', 'Ticket cancelled'),
    booking_cancelled: t('Ingendo yahagaritswe', 'Booking cancelled'),
    booking_refunded: t('Amafaranga yasubijwe', 'Booking refunded'),
    ticket_expired: t('Yarangiye', 'Ticket expired'),
    departed_expired: t('Igihe cyarenze', 'Departure window passed'),
    too_early: t('Biracyabuze igihe', 'Too early to scan'),
    invalid_type: t('Ubwoko butariyo', 'Invalid ticket type'),
    same_stop: t('Ahantu hamwe', 'Same origin and destination'),
    auth_required: t('Injira mbere', 'Sign in required'),
    forbidden: t('Nta ruhushya', 'Not authorised')
  };
  return map[reason] || reason;
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

/* ================================================================== *
 *  Icons                                                              *
 * ================================================================== */
function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function QrIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><path d="M14 14h3v3h-3zM20 14v3M14 20h6" />
    </svg>
  );
}
function KeyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="15" r="3" />
      <path d="M11 15h10M18 12v6M14 12v6" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 16 14" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function BigCheck() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function BigX() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}