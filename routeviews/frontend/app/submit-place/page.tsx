'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { placesApi } from '@/lib/placesApi';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const CATEGORIES = [
  'restaurant','cafe','fast_food','bar','supermarket','market','pharmacy',
  'hospital','clinic','bank','atm','fuel','hotel','school','university',
  'place_of_worship','government','repair','electronics','clothing','hardware',
  'beauty','transport','other'
];

export default function SubmitPlacePage() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const t = (rw: string, en: string) => (lang === 'rw' ? rw : en);

  const [form, setForm] = useState({
    name: '', name_rw: '', category: 'restaurant', description: '',
    address: '', lat: '', lng: '', phone: '', website: '', opening_hours: '',
    wheelchair: '' as '' | 'yes' | 'no' | 'unknown',
    ramp: '' as '' | 'yes' | 'no' | 'unknown',
    toilet: '' as '' | 'yes' | 'no' | 'unknown',
    parking: '' as '' | 'yes' | 'no' | 'unknown',
    tactile: '' as '' | 'yes' | 'no' | 'unknown',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const useLocation = () => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (p) => {
        set('lat', p.coords.latitude.toFixed(6));
        set('lng', p.coords.longitude.toFixed(6));
      },
      (e) => setMsg({ kind: 'err', text: e.message })
    );
  };

  const submit = async () => {
    if (!user) {
      setMsg({ kind: 'err', text: t('Injira mbere yo kohereza.', 'Please sign in first.') });
      return;
    }
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) {
      setMsg({ kind: 'err', text: t('Shyiramo aho hantu (lat/lng).', 'Please provide coordinates.') });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const tri = (v: string) => v === 'yes' ? true : v === 'no' ? false : null;
      await placesApi.submit({
        kind: 'new',
        payload: {
          name: form.name.trim(),
          name_rw: form.name_rw.trim() || undefined,
          category: form.category,
          description: form.description.trim() || undefined,
          address: form.address.trim() || undefined,
          lat, lng,
          phone: form.phone.trim() || undefined,
          website: form.website.trim() || undefined,
          opening_hours: form.opening_hours.trim() || undefined,
          accessibility: {
            wheelchair: tri(form.wheelchair),
            ramp: tri(form.ramp),
            toilet: tri(form.toilet),
            parking: tri(form.parking),
            tactile: tri(form.tactile),
          },
        },
      });
      setMsg({ kind: 'ok', text: t('Byoherejwe. Bitegereje kwemezwa n’umuyobozi.', 'Submitted. Awaiting admin review.') });
      setForm({ ...form, name: '', description: '', address: '', phone: '' });
    } catch (e: any) {
      setMsg({ kind: 'err', text: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-8 space-y-5">
      <div>
        <Link href="/explore" className="text-sm text-electric hover:text-electric-700">
          ← {t('Subira ku ikarita', 'Back to explore')}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">{t('Ongeraho ahantu', 'Add a place')}</h1>
        <p className="text-sm text-ink-100 mt-1">
          {t(
            'Gira uruhare mu ikarita. Bitegereje kwemezwa n’umuyobozi mbere yo kugaragara.',
            'Contribute to the map. Submissions are reviewed by an admin before appearing publicly.'
          )}
        </p>
      </div>

      {msg && (
        <Alert tone={msg.kind === 'ok' ? 'success' : 'danger'}>{msg.text}</Alert>
      )}

      <Card>
        <CardHeader><CardTitle>{t('Amakuru y’ahantu', 'Place details')}</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <Field label={t('Izina', 'Name')} value={form.name} onChange={(v) => set('name', v)} required />
          <Field label={t('Izina mu Kinyarwanda', 'Name (Kinyarwanda)')} value={form.name_rw} onChange={(v) => set('name_rw', v)} />
          <div>
            <label className="text-xs uppercase tracking-widest text-ink-100">{t('Ubwoko', 'Category')}</label>
            <select
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm focus:border-electric focus:outline-none"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field label={t('Ibisobanuro', 'Description')} value={form.description} onChange={(v) => set('description', v)} textarea />
          <Field label={t('Aderesi', 'Address')} value={form.address} onChange={(v) => set('address', v)} />

          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude" value={form.lat} onChange={(v) => set('lat', v)} />
            <Field label="Longitude" value={form.lng} onChange={(v) => set('lng', v)} />
          </div>
          <Button variant="outline" size="sm" onClick={useLocation}>
            {t('Koresha aho ndi', 'Use my location')}
          </Button>

          <Field label={t('Telefone', 'Phone')} value={form.phone} onChange={(v) => set('phone', v)} />
          <Field label={t('Urubuga', 'Website')} value={form.website} onChange={(v) => set('website', v)} />
          <Field label={t('Amasaha', 'Opening hours')} value={form.opening_hours} onChange={(v) => set('opening_hours', v)} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader><CardTitle>{t('Ubushobozi', 'Accessibility')}</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          <p className="text-xs text-ink-100">
            {t('Hitamo "Ntibizwi" niba utazi — ntubeshye.', 'Choose "Unknown" if you do not know — do not guess.')}
          </p>
          <Tri label="Wheelchair entrance" value={form.wheelchair} onChange={(v) => set('wheelchair', v)} />
          <Tri label="Ramp" value={form.ramp} onChange={(v) => set('ramp', v)} />
          <Tri label="Accessible toilet" value={form.toilet} onChange={(v) => set('toilet', v)} />
          <Tri label="Accessible parking" value={form.parking} onChange={(v) => set('parking', v)} />
          <Tri label="Tactile paving" value={form.tactile} onChange={(v) => set('tactile', v)} />
        </CardBody>
      </Card>

      <div className="flex gap-2">
        <Button onClick={submit} disabled={busy} variant="primary" size="lg" className="flex-1">
          {busy ? t('Kohereza…', 'Submitting…') : t('Ohereza', 'Submit')}
        </Button>
        <Link href="/explore">
          <Button variant="outline" size="lg">{t('Reka', 'Cancel')}</Button>
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, required, textarea }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; textarea?: boolean;
}) {
  const cls = 'mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-electric focus:outline-none focus:shadow-focus';
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-ink-100">
        {label}{required && <span className="text-danger ml-0.5">*</span>}
      </label>
      {textarea
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={cls} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} className={cls} />}
    </div>
  );
}

function Tri({ label, value, onChange }: {
  label: string; value: string; onChange: (v: 'yes' | 'no' | 'unknown' | '') => void;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-widest text-ink-100">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value as any)}
        className="mt-1 w-full rounded-card border border-border bg-surface px-3 py-2 text-sm focus:border-electric focus:outline-none">
        <option value="">—</option>
        <option value="yes">Yes</option>
        <option value="no">No</option>
        <option value="unknown">Unknown</option>
      </select>
    </div>
  );
}