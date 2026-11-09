/**
 * ConnectRwanda AI — Safe Deep-Link Coordinate & Discovery Parser
 * Safely parses cross-app inbound parameters without throwing or crashing.
 */

export function readCoord(v: unknown, min: number, max: number): number | null {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

export interface InboundDiscoveryTarget {
  valid: boolean;
  lat: number | null;
  lng: number | null;
  label: string;
  source: string;
}

export function parseDiscoveryDeepLink(searchParams: URLSearchParams | { [key: string]: string | string[] | undefined }): InboundDiscoveryTarget {
  const getParam = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const val = searchParams[key];
    if (Array.isArray(val)) return val[0] || null;
    return typeof val === 'string' ? val : null;
  };

  const rawLat = getParam('lat');
  const rawLng = getParam('lng');
  const rawLabel = getParam('label') || '';
  const source = getParam('src') || 'external';

  const lat = readCoord(rawLat, -90, 90);
  const lng = readCoord(rawLng, -180, 180);

  if (lat === null || lng === null) {
    return {
      valid: false,
      lat: null,
      lng: null,
      label: '',
      source,
    };
  }

  // Sanitize label for display-only use (slice at 120 chars)
  const sanitizedLabel = rawLabel.trim().slice(0, 120);

  return {
    valid: true,
    lat,
    lng,
    label: sanitizedLabel,
    source,
  };
}

export function buildRouteViewPlanUrl(toLat: number, toLng: number, toLabel: string = ''): string {
  const base = (process.env.NEXT_PUBLIC_ROUTEVIEW_URL || 'http://localhost:3000').replace(/\/$/, '');
  const params = new URLSearchParams();
  params.set('toLat', toLat.toFixed(6));
  params.set('toLng', toLng.toFixed(6));
  if (toLabel) params.set('toLabel', toLabel);
  params.set('src', 'mapforall');
  return `${base}/plan?${params.toString()}`;
}
