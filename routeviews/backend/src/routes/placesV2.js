import { Router } from 'express';
import { z } from 'zod';
import {
  listCategories, searchPlaces, getPlaceById,
  createSubmission, listSubmissions, getMySubmissions,
  approveSubmission, rejectSubmission,
  createClaim, listClaims, approveClaim, rejectClaim,
  getMyBusinesses, updateMyBusiness,
  listStaff, addStaff, removeStaff,
  clockIn, clockOut, listAttendance,
  importOsmPlaces,
} from '../services/placesV2.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

/* ---- Public ---- */

router.get('/places/v2/categories', (_req, res) => {
  res.json({ categories: listCategories() });
});

router.get('/places/v2/search', async (req, res, next) => {
  try {
    const q = z.object({
      q: z.string().max(200).optional(),
      category: z.string().max(64).optional(),
      lat: z.coerce.number().optional(),
      lng: z.coerce.number().optional(),
      radius_m: z.coerce.number().min(100).max(50000).optional(),
      accessible_only: z.coerce.boolean().optional(),
      limit: z.coerce.number().min(1).max(100).default(30),
      offset: z.coerce.number().min(0).default(0),
    }).parse(req.query);

    const places = await searchPlaces({
      q: q.q, category: q.category, lat: q.lat, lng: q.lng,
      radiusM: q.radius_m, accessibleOnly: q.accessible_only,
      limit: q.limit, offset: q.offset,
    });
    res.json({ ok: true, count: places.length, places });
  } catch (e) { next(e); }
});

router.get('/places/v2/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const place = await getPlaceById(id);
    if (!place) return res.status(404).json({ ok: false, error: 'not_found' });
    res.json({ ok: true, place });
  } catch (e) { next(e); }
});

/* ---- Authenticated passenger actions ---- */

router.post('/places/v2/submit', requireAuth, async (req, res, next) => {
  try {
    const body = z.object({
      kind: z.enum(['new','update']).default('new'),
      target_place_id: z.number().int().positive().optional(),
      payload: z.object({
        name: z.string().min(2).max(255),
        name_rw: z.string().max(255).optional(),
        category: z.string().min(2).max(64),
        description: z.string().max(2000).optional(),
        address: z.string().max(500).optional(),
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        phone: z.string().max(64).optional(),
        website: z.string().max(500).optional(),
        opening_hours: z.string().max(500).optional(),
        accessibility: z.object({
          wheelchair: z.boolean().nullable().optional(),
          ramp: z.boolean().nullable().optional(),
          toilet: z.boolean().nullable().optional(),
          parking: z.boolean().nullable().optional(),
          tactile: z.boolean().nullable().optional(),
        }).optional(),
      }),
    }).parse(req.body);

    const result = await createSubmission({
      submittedBy: req.user.id,
      kind: body.kind,
      targetPlaceId: body.target_place_id,
      payload: body.payload,
    });
    res.json({ ok: true, ...result });
  } catch (e) { next(e); }
});

router.get('/places/v2/my-submissions', requireAuth, async (req, res, next) => {
  try {
    const subs = await getMySubmissions(req.user.id);
    res.json({ ok: true, submissions: subs });
  } catch (e) { next(e); }
});

router.post('/places/v2/:id/claim', requireAuth, async (req, res, next) => {
  try {
    const placeId = Number(req.params.id);
    const body = z.object({ evidence: z.string().max(2000).optional() }).parse(req.body ?? {});
    const result = await createClaim({
      placeId, claimantUserId: req.user.id, evidence: body.evidence,
    });
    if (!result.ok) return res.status(400).json(result);
    res.json(result);
  } catch (e) { next(e); }
});

router.get('/places/v2/my-businesses', requireAuth, async (req, res, next) => {
  try {
    const businesses = await getMyBusinesses(req.user.id);
    res.json({ ok: true, businesses });
  } catch (e) { next(e); }
});

router.patch('/places/v2/business/:id', requireAuth, async (req, res, next) => {
  try {
    const placeId = Number(req.params.id);
    const body = z.object({
      name: z.string().min(2).max(255).optional(),
      name_rw: z.string().max(255).optional(),
      category: z.string().max(64).optional(),
      description: z.string().max(2000).optional(),
      address: z.string().max(500).optional(),
      phone: z.string().max(64).optional(),
      website: z.string().max(500).optional(),
      opening_hours: z.string().max(500).optional(),
      lat: z.number().min(-90).max(90).optional(),
      lng: z.number().min(-180).max(180).optional(),
    }).parse(req.body ?? {});
    const result = await updateMyBusiness(placeId, req.user.id, body);
    res.status(result.ok ? 200 : 403).json(result);
  } catch (e) { next(e); }
});

/* ---- Staff + attendance (business owner) ---- */

router.get('/places/v2/business/:id/staff', requireAuth, async (req, res, next) => {
  try {
    const placeId = Number(req.params.id);
    const staff = await listStaff(placeId, req.user.id);
    res.json({ ok: true, staff });
  } catch (e) { next(e); }
});

router.post('/places/v2/business/:id/staff', requireAuth, async (req, res, next) => {
  try {
    const placeId = Number(req.params.id);
    const body = z.object({
      full_name: z.string().min(2).max(255),
      phone: z.string().max(64).optional(),
    }).parse(req.body);
    const result = await addStaff(placeId, req.user.id, {
      fullName: body.full_name, phone: body.phone,
    });
    res.json({ ok: true, ...result });
  } catch (e) { next(e); }
});

router.delete('/places/v2/business/staff/:staffId', requireAuth, async (req, res, next) => {
  try {
    await removeStaff(Number(req.params.staffId), req.user.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/places/v2/business/:id/staff/:staffId/clock-in', requireAuth, async (req, res, next) => {
  try {
    const result = await clockIn({ staffId: Number(req.params.staffId), recordedBy: req.user.id });
    res.json({ ok: true, ...result });
  } catch (e) { next(e); }
});

router.post('/places/v2/business/:id/staff/:staffId/clock-out', requireAuth, async (req, res, next) => {
  try {
    const result = await clockOut({ staffId: Number(req.params.staffId), recordedBy: req.user.id });
    res.json({ ok: true, ...result });
  } catch (e) { next(e); }
});

router.get('/places/v2/business/:id/attendance', requireAuth, async (req, res, next) => {
  try {
    const placeId = Number(req.params.id);
    const { from, to } = req.query;
    const records = await listAttendance(placeId, req.user.id, { from, to });
    res.json({ ok: true, records });
  } catch (e) { next(e); }
});

/* ---- Admin moderation ---- */

router.get('/admin/places/submissions', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const status = String(req.query.status || 'pending');
    const subs = await listSubmissions({ status });
    res.json({ ok: true, submissions: subs });
  } catch (e) { next(e); }
});

router.post('/admin/places/submissions/:id/approve', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await approveSubmission(Number(req.params.id), req.user.id, req.body?.overrides);
    res.status(result.ok ? 200 : 400).json(result);
  } catch (e) { next(e); }
});

router.post('/admin/places/submissions/:id/reject', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await rejectSubmission(Number(req.params.id), req.user.id, req.body?.reason);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.get('/admin/places/claims', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const status = String(req.query.status || 'pending');
    const claims = await listClaims({ status });
    res.json({ ok: true, claims });
  } catch (e) { next(e); }
});

router.post('/admin/places/claims/:id/approve', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await approveClaim(Number(req.params.id), req.user.id);
    res.status(result.ok ? 200 : 400).json(result);
  } catch (e) { next(e); }
});

router.post('/admin/places/claims/:id/reject', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    await rejectClaim(Number(req.params.id), req.user.id, req.body?.reason);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post('/admin/places/import-osm', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const body = z.object({
      bbox: z.string().min(1),
      categories: z.array(z.string()).optional(),
      limit: z.number().int().min(1).max(500).default(100),
      dryRun: z.boolean().default(false),
    }).parse(req.body);
    const result = await importOsmPlaces(body);
    res.json(result);
  } catch (e) { next(e); }
});

export default router;