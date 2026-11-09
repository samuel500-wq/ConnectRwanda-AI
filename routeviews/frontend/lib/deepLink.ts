/**
 * ConnectRwanda AI — Safe Deep-Link Coordinate & Destination Parser
 * Safely parses cross-app inbound parameters without throwing or crashing.
 */

export function readCoord(v: unknown, min: number, max: number): number | null {
  if (typeof v !== 'string' && typeof v !== 'number') return null;
  const num = Number(v);
  if (!Number.isFinite(num)) return null;
  if (num < min || num > max) return null;
  return num;
}

export interface InboundTransitTarget {
  valid: boolean;
  toLat: number | null;
  toLng: number | null;
  toLabel: string;
  source: string;
}

export function parseTransitDeepLink(searchParams: URLSearchParams | { [key: string]: string | string[] | undefined }): InboundTransitTarget {
  const getParam = (key: string): string | null => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key);
    }
    const val = searchParams[key];
    if (Array.isArray(val)) return val[0] || null;
    return typeof val === 'string' ? val : null;
  };

  const rawLat = getParam('toLat') || getParam('lat');
  const rawLng = getParam('toLng') || getParam('lng');
  const rawLabel = getParam('toLabel') || getParam('label') || '';
  const source = getParam('src') || 'external';

  const lat = readCoord(rawLat, -90, 90);
  const lng = readCoord(rawLng, -180, 180);

  if (lat === null || lng === null) {
    return {
      valid: false,
      toLat: null,
      toLng: null,
      toLabel: '',
      source,
    };
  }

  // Sanitize label for display-only use (slice at 120 chars)
  const sanitizedLabel = rawLabel.trim().slice(0, 120);

  return {
    valid: true,
    toLat: lat,
    toLng: lng,
    toLabel: sanitizedLabel,
    source,
  };
}

export function buildMapForAllDiscoverUrl(lat: number, lng: number, label: string = ''): string {
  const base = (process.env.NEXT_PUBLIC_MAPFORALL_URL || 'http://localhost:3001').replace(/\/$/, '');
  const params = new URLSearchParams();
  params.set('lat', lat.toFixed(6));
  params.set('lng', lng.toFixed(6));
  if (label) params.set('label', label);
  params.set('src', 'routeview');
  return `${base}/discover?${params.toString()}`;
}
