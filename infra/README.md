# ConnectRwanda AI — Production Routing & Infrastructure Architecture

This directory defines the reverse proxy routing infrastructure for deploying ConnectRwanda AI as a unified national platform.

---

## 1. Routing Strategy: Host-Based vs. Path-Based

### Option A: Host-Based Subdomain Routing (**Recommended**)
- **Platform Landing:** `https://connectrwanda.ai`
- **RouteView Transit:** `https://routeview.connectrwanda.ai`
- **MapForAll Discovery:** `https://mapforall.connectrwanda.ai`

#### Why Host-Based Routing is Recommended:
1. **Preserves 84+ Client `fetch('/api/...')` Calls in MapForAll**: Next.js client fetches in MapForAll assume the `/api/` prefix lives at the root origin. Subdomains require zero code changes.
2. **Preserves Static Assets**: 12+ standard HTML `<img>` and `<video>` tags (`src="/landing/..."`) avoid broken image 404s.
3. **Session Cookie Security & Isolation**: MapForAll sets `hodari_session` with `path: '/'`. Host isolation prevents cookie leakage between applications.
4. **Independent Scale & Deployment**: RouteView (Express + MySQL + Python ML) and MapForAll (Next.js + MongoDB + Google ADK Cloud Run) can scale and deploy independently without downtime to the sibling app.

---

### Option B: Path-Based Single-Domain Routing
- **Landing:** `https://connectrwanda.ai/`
- **RouteView:** `https://connectrwanda.ai/routeview/`
- **MapForAll:** `https://connectrwanda.ai/mapforall/`
- **RouteView API:** `https://connectrwanda.ai/api/routeview/`
- **RouteView ML:** `https://connectrwanda.ai/api/ml/`

#### Required Configuration for Option B:
If Path-Based routing is used, the following must be set:
- **RouteView frontend**: `NEXT_PUBLIC_BASE_PATH=/routeview`
- **MapForAll client**: `NEXT_PUBLIC_BASE_PATH=/mapforall`
- Nginx must pass `X-Forwarded-Prefix` and preserve the basePath prefix when proxying to Next.js.
- Rewrites must be added for all 84 client fetches or routed via Nginx subpath proxies.

---

## 2. Phase 0 Audit Risk Summary (Why BasePath is Risky)

During Phase 0 inspection, the following hardcoded absolute paths were identified:
- **105 occurrences** of `href="/..."` (Internal navigation)
- **84 occurrences** of client-side `fetch('/api/...')` in MapForAll
- **12 occurrences** of hardcoded `src="/..."` static assets
- **10 occurrences** of server `redirect('/...')`
- Middleware redirects in MapForAll construct: `new URL('/login', req.url)`, which strips path prefixes.

Host-based subdomains eliminate all of these risks without editing internal application files.
