'use client';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { placesApi } from '@/lib/placesApi';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

export default function ModerationPage() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [tab, setTab] = useState<'subs' | 'claims'>('subs');
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    try {
      const [a, b] = await Promise.all([
        placesApi.admin.submissions('pending'),
        placesApi.admin.claims('pending'),
      ]);
      setSubmissions(a.submissions);
      setClaims(b.claims);
    } catch (e: any) { setErr(e.message); }
  };

  useEffect(() => {
    if (user?.role === 'admin') load();
  }, [user]);

  if (user?.role !== 'admin') {
    return <div className="max-w-2xl mx-auto p-8"><Alert tone="warning">Admin only.</Alert></div>;
  }

  const approveSub = async (id: number) => {
    try {
      await placesApi.admin.approveSubmission(id);
      setMsg(`Submission #${id} approved.`);
      load();
    } catch (e: any) { setErr(e.message); }
  };

  const rejectSub = async (id: number) => {
    try {
      await placesApi.admin.rejectSubmission(id, 'Rejected by admin');
      setMsg(`Submission #${id} rejected.`);
      load();
    } catch (e: any) { setErr(e.message); }
  };

  const approveClaim = async (id: number) => {
    try {
      await placesApi.admin.approveClaim(id);
      setMsg(`Claim #${id} approved.`);
      load();
    } catch (e: any) { setErr(e.message); }
  };

  const rejectClaim = async (id: number) => {
    try {
      await placesApi.admin.rejectClaim(id, 'Rejected by admin');
      setMsg(`Claim #${id} rejected.`);
      load();
    } catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-ink">{t('Igenzura', 'Moderation')}</h1>
        <p className="text-sm text-ink-100 mt-1">
          {t('Emeza cyangwa wange ibyatanzwe n’abaturage.', 'Approve or reject community submissions and business claims.')}
        </p>
      </header>

      {err && <Alert tone="danger">{err}</Alert>}
      {msg && <Alert tone="success">{msg}</Alert>}

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab('subs')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === 'subs' ? 'border-electric text-electric' : 'border-transparent text-ink-100 hover:text-ink'
          }`}
        >
          {t('Ibyatanzwe', 'Submissions')} ({submissions.length})
        </button>
        <button
          onClick={() => setTab('claims')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
            tab === 'claims' ? 'border-electric text-electric' : 'border-transparent text-ink-100 hover:text-ink'
          }`}
        >
          {t('Ubusabe bwa nyir’ubucuruzi', 'Business claims')} ({claims.length})
        </button>
      </div>

      {tab === 'subs' && (
        <div className="space-y-3">
          {submissions.map((s) => {
            const p = typeof s.payload === 'string' ? JSON.parse(s.payload) : s.payload;
            return (
              <Card key={s.id}>
                <CardBody className="pt-5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-ink">{p.name}</p>
                      <p className="text-xs text-ink-100">{p.category} · {s.kind}</p>
                    </div>
                    <p className="text-xs text-ink-100">#{s.id}</p>
                  </div>
                  {p.description && <p className="text-sm text-ink">{p.description}</p>}
                  <p className="text-xs text-ink-100">
                    {p.lat}, {p.lng} · submitted {new Date(s.created_at).toLocaleString()}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button onClick={() => approveSub(s.id)} variant="primary" size="sm">Approve</Button>
                    <Button onClick={() => rejectSub(s.id)} variant="danger" size="sm">Reject</Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
          {submissions.length === 0 && (
            <Card><CardBody className="py-8 text-center text-sm text-ink-100">No pending submissions.</CardBody></Card>
          )}
        </div>
      )}

      {tab === 'claims' && (
        <div className="space-y-3">
          {claims.map((c) => (
            <Card key={c.id}>
              <CardBody className="pt-5 space-y-2">
                <p className="font-semibold text-ink">{c.place_name}</p>
                <p className="text-xs text-ink-100">Claim #{c.id} · user {c.claimant_user_id}</p>
                {c.evidence && <p className="text-sm text-ink">{c.evidence}</p>}
                <div className="flex gap-2 pt-1">
                  <Button onClick={() => approveClaim(c.id)} variant="primary" size="sm">Approve</Button>
                  <Button onClick={() => rejectClaim(c.id)} variant="danger" size="sm">Reject</Button>
                </div>
              </CardBody>
            </Card>
          ))}
          {claims.length === 0 && (
            <Card><CardBody className="py-8 text-center text-sm text-ink-100">No pending claims.</CardBody></Card>
          )}
        </div>
      )}
    </div>
  );
}