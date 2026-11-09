'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { placesApi, Place } from '@/lib/placesApi';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export default function PlaceDetailPage() {
  const { lang } = useI18n();
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const placeId = Number(params?.id);

  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimOpen, setClaimOpen] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [claimMsg, setClaimMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!placeId) return;
    setLoading(true);
    placesApi.get(placeId)
      .then((r) => setPlace(r.place))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [placeId]);

  const submitClaim = async () => {
    if (!user) { setClaimMsg('Sign in required'); return; }
    try {
      await placesApi.claim(placeId, evidence);
      setClaimMsg('Claim submitted — an admin will review it.');
      setClaimOpen(false);
    } catch (e: any) {
      setClaimMsg(e.message);
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto p-8 text-ink-100">Loading…</div>;
  if (error) return <div className="max-w-4xl mx-auto p-8 text-danger">{error}</div>;
  if (!place) return <div className="max-w-4xl mx-auto p-8 text-ink-100">Not found</div>;

  const a = place.accessibility;
  const accStatus = a.status;

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-5">
      <Link href="/explore" className="text-sm text-electric hover:text-electric-700">
        ← {lang === 'rw' ? 'Subira ku ikarita' : 'Back to explore'}
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{lang === 'rw' && place.name_rw ? place.name_rw : place.name}</CardTitle>
              <p className="text-xs text-ink-100 mt-1">{place.category}</p>
            </div>
            <Badge
              tone={accStatus === 'accessible' ? 'success' : accStatus === 'not_accessible' ? 'neutral' : 'warning'}
            >
              {accStatus === 'accessible'
                ? (lang === 'rw' ? 'Ubushobozi bwemejwe' : 'Accessible · verified')
                : accStatus === 'not_accessible'
                ? (lang === 'rw' ? 'Ntibafasha' : 'Not accessible')
                : (lang === 'rw' ? 'Ubushobozi ntibuzwi' : 'Accessibility unknown')}
            </Badge>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {place.description && <p className="text-sm text-ink leading-relaxed">{place.description}</p>}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {place.address && <Row label="Address" value={place.address} />}
            {place.phone && <Row label="Phone" value={place.phone} />}
            {place.website && <Row label="Website" value={place.website} />}
            {place.opening_hours && <Row label="Opening hours" value={place.opening_hours} />}
            <Row label="Coordinates" value={`${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`} />
            <Row label="Source" value={
              place.source === 'osm' ? 'OpenStreetMap'
              : place.source === 'community' ? 'Community'
              : place.source === 'business' ? 'Business owner'
              : place.source
            } />
          </dl>

          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href={`/plan?to_lat=${place.lat}&to_lng=${place.lng}`}
            >
              <Button variant="primary">{lang === 'rw' ? 'Tegura urugendo' : 'Plan journey here'}</Button>
            </Link>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`}
              target="_blank" rel="noreferrer"
            >
              <Button variant="secondary">{lang === 'rw' ? 'Fungura navigation' : 'Open navigation'}</Button>
            </a>
            {!place.owner_user_id && (
              <Button variant="outline" onClick={() => setClaimOpen(!claimOpen)}>
                {lang === 'rw' ? 'Fata ubucuruzi bwawe' : 'Claim this business'}
              </Button>
            )}
          </div>

          {claimOpen && (
            <div className="mt-3 rounded-card border border-border bg-canvas p-4 space-y-2">
              <p className="text-sm text-ink">
                {lang === 'rw'
                  ? 'Sobanura uko uri nyir’ubucuruzi (nimero y’ubusabe, email, telefone…).'
                  : 'Describe how you are the owner (registration number, email, phone…).'}
              </p>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                rows={3}
                className="w-full rounded-card border border-border bg-surface px-3 py-2 text-sm focus:border-electric focus:outline-none"
              />
              <Button onClick={submitClaim} variant="ai" size="sm">
                {lang === 'rw' ? 'Ohereza ubusabe' : 'Submit claim'}
              </Button>
            </div>
          )}
          {claimMsg && <p className="text-xs text-teal-700">{claimMsg}</p>}
        </CardBody>
      </Card>

      {/* Accessibility detail */}
      <Card>
        <CardHeader><CardTitle>Accessibility</CardTitle></CardHeader>
        <CardBody>
          {accStatus === 'unknown' ? (
            <p className="text-sm text-ink-100">
              {lang === 'rw'
                ? 'Nta makuru yemejwe ku bushobozi bw’aha hantu. Ntibisobanura ko hatabasha gukoreshwa.'
                : 'No verified accessibility information for this place. That does not mean it is inaccessible.'}
            </p>
          ) : (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <BoolRow label="Wheelchair entrance" value={a.wheelchair} />
              <BoolRow label="Ramp" value={a.ramp} />
              <BoolRow label="Accessible toilet" value={a.toilet} />
              <BoolRow label="Accessible parking" value={a.parking} />
              <BoolRow label="Tactile paving" value={a.tactile} />
              {a.verificationSource && (
                <Row label="Verified by" value={a.verificationSource} />
              )}
            </dl>
          )}
        </CardBody>
      </Card>

      {place.photos && place.photos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Photos</CardTitle></CardHeader>
          <CardBody>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {place.photos.map((ph) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={ph.id} src={ph.url} alt="" className="rounded-card w-full h-32 object-cover" />
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-ink-100">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

function BoolRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-ink-100">{label}</dt>
      <dd className="text-sm text-ink">
        {value === 1 ? '✓ Yes' : value === 0 ? '✗ No' : '— Unknown'}
      </dd>
    </div>
  );
}