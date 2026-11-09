'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { placesApi } from '@/lib/placesApi';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

function isSessionError(msg: string): boolean {
  const m = (msg || '').toLowerCase();
  return (
    m.includes('401') ||
    m.includes('unauthorized') ||
    m.includes('invalid_session') ||
    m.includes('invalid_token') ||
    m.includes('unknown column') ||   // catch the current backend bug
    m.includes('jwt')
  );
}

export default function BusinessDashboardPage() {
  const { lang } = useI18n();
  const { user, logout } = useAuth();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);

  const [businesses, setBusinesses] = useState<any[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [newStaff, setNewStaff] = useState({ full_name: '', phone: '' });
  const [err, setErr] = useState<string | null>(null);
  const [sessionErr, setSessionErr] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const userId = (user as any)?.id;
  const hasValidUserId = typeof userId === 'number' && Number.isFinite(userId) && userId > 0;

  useEffect(() => {
    if (!user) return;
    if (!hasValidUserId) {
      setSessionErr(true);
      return;
    }
    placesApi.myBusinesses()
      .then((r) => {
        setBusinesses(r.businesses);
        if (r.businesses[0]) setActiveId(r.businesses[0].id);
      })
      .catch((e) => {
        const msg = String(e?.message || '');
        if (isSessionError(msg)) setSessionErr(true);
        else setErr(msg);
      });
  }, [user, hasValidUserId]);

  useEffect(() => {
    if (!activeId || !hasValidUserId) return;
    placesApi.listStaff(activeId)
      .then((r) => setStaff(r.staff))
      .catch((e) => {
        const msg = String(e?.message || '');
        if (isSessionError(msg)) setSessionErr(true);
      });
    placesApi.attendance(activeId)
      .then((r) => setAttendance(r.records))
      .catch((e) => {
        const msg = String(e?.message || '');
        if (isSessionError(msg)) setSessionErr(true);
      });
  }, [activeId, hasValidUserId]);

  const addStaff = async () => {
    if (!activeId || !newStaff.full_name.trim()) return;
    try {
      await placesApi.addStaff(activeId, newStaff);
      setNewStaff({ full_name: '', phone: '' });
      setInfo(t('Umukozi yongeweho.', 'Staff member added.'));
      const r = await placesApi.listStaff(activeId);
      setStaff(r.staff);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (isSessionError(msg)) setSessionErr(true);
      else setErr(msg);
    }
  };

  const doClock = async (staffId: number, action: 'in' | 'out') => {
    if (!activeId) return;
    try {
      if (action === 'in') await placesApi.clockIn(activeId, staffId);
      else await placesApi.clockOut(activeId, staffId);
      const r = await placesApi.attendance(activeId);
      setAttendance(r.records);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (isSessionError(msg)) setSessionErr(true);
      else setErr(msg);
    }
  };

  /* ---------- Session error screen ---------- */
  if (sessionErr) {
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-12">
        <Card>
          <CardBody className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  {t('Sesi yarangiye', 'Your session expired')}
                </h2>
                <p className="text-sm text-ink-100 mt-1">
                  {t(
                    'Ongera winjire kugira ngo ubashe kubona ubucuruzi bwawe.',
                    'Please sign in again to view your business.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  logout();
                  window.location.href = '/admin/login';
                }}
              >
                {t('Injira nanone', 'Sign in again')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSessionErr(false);
                  setErr(null);
                }}
              >
                {t('Gerageza nanone', 'Try again')}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  /* ---------- Not signed in ---------- */
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <Alert tone="warning">
          {t('Injira mbere yo kureba ibicuruzwa byawe.', 'Sign in to view your business dashboard.')}{' '}
          <Link href="/admin/login" className="underline">
            {t('Injira', 'Sign in')}
          </Link>
        </Alert>
      </div>
    );
  }

  /* ---------- Normal dashboard ---------- */
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-ink">{t('Ubucuruzi bwawe', 'Your business')}</h1>
        <p className="text-sm text-ink-100 mt-1">
          {t('Genzura abakozi n’imikorere yabo.', 'Manage your staff and their attendance.')}
        </p>
      </header>

      {err && <Alert tone="danger">{err}</Alert>}
      {info && <Alert tone="success">{info}</Alert>}

      {businesses.length === 0 ? (
        <Card>
          <CardBody className="py-10 text-center space-y-3">
            <p className="text-sm text-ink-100">
              {t('Nta bucuruzi bwagenzuwe kuri wewe.', 'You have no claimed businesses yet.')}
            </p>
            <p className="text-xs text-ink-100 max-w-md mx-auto">
              {t(
                'Shakisha ubucuruzi bwawe ku ikarita, hanyuma ukande "Fata ubucuruzi bwawe" kuri paji yabwo.',
                'Find your business on the map, then click "Claim this business" on its page.'
              )}
            </p>
            <Link href="/explore">
              <Button variant="outline" size="sm">
                {t('Shakisha ubucuruzi bwawe', 'Find your business')}
              </Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <>
          <Card>
            <CardBody className="pt-5">
              <label className="text-xs uppercase tracking-widest text-ink-100">
                {t('Hitamo ubucuruzi', 'Select business')}
              </label>
              <select
                value={activeId ?? ''}
                onChange={(e) => setActiveId(Number(e.target.value))}
                className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm focus:border-electric focus:outline-none"
              >
                {businesses.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('Abakozi', 'Staff')}</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  placeholder={t('Amazina yose', 'Full name')}
                  className="rounded-card border border-border bg-surface px-3 py-2 text-sm focus:border-electric focus:outline-none"
                />
                <input
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder={t('Telefone', 'Phone (optional)')}
                  className="rounded-card border border-border bg-surface px-3 py-2 text-sm focus:border-electric focus:outline-none"
                />
                <Button onClick={addStaff} variant="ai" size="md">{t('Ongeraho', 'Add')}</Button>
              </div>

              <ul className="divide-y divide-border">
                {staff.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2 gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{s.full_name}</p>
                      {s.phone && <p className="text-xs text-ink-100">{s.phone}</p>}
                    </div>
                    <div className="flex gap-1.5">
                      <Button onClick={() => doClock(s.id, 'in')} size="sm" variant="primary">
                        {t('Injira', 'Clock in')}
                      </Button>
                      <Button onClick={() => doClock(s.id, 'out')} size="sm" variant="outline">
                        {t('Sohoka', 'Clock out')}
                      </Button>
                    </div>
                  </li>
                ))}
                {staff.length === 0 && (
                  <li className="py-3 text-sm text-ink-100 text-center">
                    {t('Nta bakozi barandikwa.', 'No staff members yet.')}
                  </li>
                )}
              </ul>
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('Amateka y’imikorere', 'Attendance history')}</CardTitle></CardHeader>
            <CardBody>
              {attendance.length === 0 ? (
                <p className="text-sm text-ink-100 text-center py-4">{t('Nta makuru.', 'No records yet.')}</p>
              ) : (
                <ul className="divide-y divide-border max-h-96 overflow-auto">
                  {attendance.map((a) => (
                    <li key={a.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                      <span className="text-ink">{a.full_name}</span>
                      <div className="flex items-center gap-2">
                        <Badge tone={a.action === 'in' ? 'success' : 'neutral'}>
                          {a.action === 'in' ? 'IN' : 'OUT'}
                        </Badge>
                        <span className="text-ink-100 text-xs">
                          {new Date(a.at).toLocaleString()}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}