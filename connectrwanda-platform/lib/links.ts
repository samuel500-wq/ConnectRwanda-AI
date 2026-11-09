// lib/links.ts
// Single source of truth for cross-app URLs.
// All paths are env-driven so MapForAll/RouteView routes can be matched
// later without touching any component.

const isProd = process.env.NODE_ENV === "production";

function base(envValue: string | undefined, prodDefault: string, devDefault: string): string {
  const v = envValue?.trim();
  if (v) return v.replace(/\/+$/, "");
  return isProd ? prodDefault : devDefault;
}

function join(baseUrl: string, path: string): string {
  const b = baseUrl.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

// ── Bases ──────────────────────────────────────────────────────────────
const ROUTEVIEW_BASE = base(
  process.env.NEXT_PUBLIC_ROUTEVIEW_URL,
  "https://routeview.connectrwanda.ai",
  "http://localhost:3000"
);

const MAPFORALL_BASE = base(
  process.env.NEXT_PUBLIC_MAPFORALL_URL,
  "https://mapforall.connectrwanda.ai",
  "http://localhost:3001"
);

// ── Route paths (env-overridable so you can match whatever MapForAll and
//    RouteView actually expose, without editing this file) ─────────────
const RV_PLAN_PATH     = process.env.NEXT_PUBLIC_ROUTEVIEW_PLAN_PATH     || "/plan";
const RV_MAP_PATH      = process.env.NEXT_PUBLIC_ROUTEVIEW_MAP_PATH      || "/map";
const RV_ROUTES_PATH   = process.env.NEXT_PUBLIC_ROUTEVIEW_ROUTES_PATH   || "/routes";
const RV_TICKETS_PATH  = process.env.NEXT_PUBLIC_ROUTEVIEW_TICKETS_PATH  || "/tickets";
const RV_ADMIN_PATH    = process.env.NEXT_PUBLIC_ROUTEVIEW_ADMIN_PATH    || "/admin";

const MF_DISCOVER_PATH = process.env.NEXT_PUBLIC_MAPFORALL_DISCOVER_PATH || "/discover";
const MF_CHAT_PATH     = process.env.NEXT_PUBLIC_MAPFORALL_CHAT_PATH     || "/chat";
const MF_BUSINESS_PATH = process.env.NEXT_PUBLIC_MAPFORALL_BUSINESS_PATH || "/business";

// ── Public links object (used by page.tsx & footer) ────────────────────
export const links = {
  routeview: {
    home:    ROUTEVIEW_BASE,
    plan:    join(ROUTEVIEW_BASE, RV_PLAN_PATH),
    map:     join(ROUTEVIEW_BASE, RV_MAP_PATH),
    routes:  join(ROUTEVIEW_BASE, RV_ROUTES_PATH),
    tickets: join(ROUTEVIEW_BASE, RV_TICKETS_PATH),
    admin:   join(ROUTEVIEW_BASE, RV_ADMIN_PATH),
  },
  mapforall: {
    home:     MAPFORALL_BASE,
    discover: join(MAPFORALL_BASE, MF_DISCOVER_PATH),
    chat:     join(MAPFORALL_BASE, MF_CHAT_PATH),
    business: join(MAPFORALL_BASE, MF_BUSINESS_PATH),
  },
} as const;

// ── Deep-link builders (for use by BOTH apps later) ────────────────────
// Safe: bounds-checked, encoded, intent-tagged.
export function toMapForAllDiscover(opts: {
  lat?: number;
  lng?: number;
  label?: string;
  from?: string;
}): string {
  const q = new URLSearchParams();
  if (opts.lat != null && Number.isFinite(opts.lat) && opts.lat >= -90  && opts.lat <= 90)
    q.set("lat", String(opts.lat));
  if (opts.lng != null && Number.isFinite(opts.lng) && opts.lng >= -180 && opts.lng <= 180)
    q.set("lng", String(opts.lng));
  if (opts.label) q.set("label", opts.label);
  q.set("intent", "nearby_businesses");
  q.set("src", opts.from || "connectrwanda");
  return `${links.mapforall.discover}?${q.toString()}`;
}

export function toRouteViewPlan(opts: {
  toLat?: number;
  toLng?: number;
  toLabel?: string;
  from?: string;
}): string {
  const q = new URLSearchParams();
  if (opts.toLat != null && Number.isFinite(opts.toLat) && opts.toLat >= -90  && opts.toLat <= 90)
    q.set("toLat", String(opts.toLat));
  if (opts.toLng != null && Number.isFinite(opts.toLng) && opts.toLng >= -180 && opts.toLng <= 180)
    q.set("toLng", String(opts.toLng));
  if (opts.toLabel) q.set("toLabel", opts.toLabel);
  q.set("src", opts.from || "connectrwanda");
  return `${links.routeview.plan}?${q.toString()}`;
}