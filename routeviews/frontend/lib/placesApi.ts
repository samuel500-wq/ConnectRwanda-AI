const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('rv_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function call<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(opts.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((json as any)?.message || (json as any)?.error || `HTTP ${res.status}`);
  return json as T;
}

export interface PlaceAccessibility {
  status: 'accessible' | 'not_accessible' | 'unknown';
  wheelchair: number | null;
  ramp: number | null;
  toilet: number | null;
  parking: number | null;
  tactile: number | null;
  verificationSource: string | null;
  verifiedAt: string | null;
}

export interface Place {
  id: number;
  name: string;
  name_rw: string | null;
  category: string;
  description: string | null;
  address: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  opening_hours: string | null;
  source: string;
  status: string;
  owner_user_id: number | null;
  distance_m: number | null;
  accessibility: PlaceAccessibility;
  photos?: Array<{ id: number; url: string; created_at: string }>;
}

export const placesApi = {
  listCategories: () =>
    call<{ categories: string[] }>('/api/places/v2/categories'),

  search: (params: {
    q?: string; category?: string; lat?: number; lng?: number;
    radius_m?: number; accessible_only?: boolean; limit?: number; offset?: number;
  }) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    }
    return call<{ ok: boolean; count: number; places: Place[] }>(`/api/places/v2/search?${qs}`);
  },

  get: (id: number) =>
    call<{ ok: boolean; place: Place }>(`/api/places/v2/${id}`),

  submit: (data: { kind?: 'new' | 'update'; target_place_id?: number; payload: any }) =>
    call<{ ok: boolean; id: number; status: string }>('/api/places/v2/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  mySubmissions: () =>
    call<{ ok: boolean; submissions: any[] }>('/api/places/v2/my-submissions'),

  claim: (placeId: number, evidence?: string) =>
    call<{ ok: boolean; id: number }>(`/api/places/v2/${placeId}/claim`, {
      method: 'POST',
      body: JSON.stringify({ evidence }),
    }),

  myBusinesses: () =>
    call<{ ok: boolean; businesses: any[] }>('/api/places/v2/my-businesses'),

  updateBusiness: (placeId: number, data: any) =>
    call<{ ok: boolean }>(`/api/places/v2/business/${placeId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listStaff: (placeId: number) =>
    call<{ ok: boolean; staff: any[] }>(`/api/places/v2/business/${placeId}/staff`),

  addStaff: (placeId: number, data: { full_name: string; phone?: string }) =>
    call<{ ok: boolean; id: number }>(`/api/places/v2/business/${placeId}/staff`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  removeStaff: (staffId: number) =>
    call<{ ok: boolean }>(`/api/places/v2/business/staff/${staffId}`, { method: 'DELETE' }),

  clockIn: (placeId: number, staffId: number) =>
    call<{ ok: boolean }>(`/api/places/v2/business/${placeId}/staff/${staffId}/clock-in`, {
      method: 'POST',
    }),

  clockOut: (placeId: number, staffId: number) =>
    call<{ ok: boolean }>(`/api/places/v2/business/${placeId}/staff/${staffId}/clock-out`, {
      method: 'POST',
    }),

  attendance: (placeId: number, params: { from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    return call<{ ok: boolean; records: any[] }>(
      `/api/places/v2/business/${placeId}/attendance?${qs}`
    );
  },

  admin: {
    submissions: (status = 'pending') =>
      call<{ ok: boolean; submissions: any[] }>(
        `/api/admin/places/submissions?status=${status}`
      ),
    approveSubmission: (id: number, overrides?: any) =>
      call<{ ok: boolean; placeId?: number }>(
        `/api/admin/places/submissions/${id}/approve`,
        { method: 'POST', body: JSON.stringify({ overrides }) }
      ),
    rejectSubmission: (id: number, reason?: string) =>
      call<{ ok: boolean }>(`/api/admin/places/submissions/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    claims: (status = 'pending') =>
      call<{ ok: boolean; claims: any[] }>(
        `/api/admin/places/claims?status=${status}`
      ),
    approveClaim: (id: number) =>
      call<{ ok: boolean }>(`/api/admin/places/claims/${id}/approve`, { method: 'POST' }),
    rejectClaim: (id: number, reason?: string) =>
      call<{ ok: boolean }>(`/api/admin/places/claims/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    importOsm: (data: { bbox: string; categories?: string[]; limit?: number; dryRun?: boolean }) =>
      call<{ ok: boolean; found: number; inserted: number; skipped: number; dryRun: boolean }>(
        `/api/admin/places/import-osm`,
        { method: 'POST', body: JSON.stringify(data) }
      ),
  },
};