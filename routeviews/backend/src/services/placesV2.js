// Places V2 service — real database-backed places with accessibility,
// community submissions, business claims, staff & attendance.
// Nothing here fabricates data.

import { pool } from '../db/pool.js';

const CATEGORIES = [
  'restaurant','cafe','fast_food','bar','supermarket','market','pharmacy',
  'hospital','clinic','bank','atm','fuel','hotel','school','university',
  'place_of_worship','government','repair','electronics','clothing','hardware',
  'beauty','transport','other'
];

export function listCategories() { return CATEGORIES; }

/* ---------------------- SEARCH ---------------------- */

export async function searchPlaces({
  q, category, lat, lng, radiusM = 5000, accessibleOnly = false,
  limit = 30, offset = 0,
} = {}) {
  const where = [`p.status = 'approved'`];
  const params = [];

  if (q && q.trim()) {
    where.push('(p.name LIKE ? OR p.name_rw LIKE ? OR p.description LIKE ? OR p.category LIKE ?)');
    const like = `%${q.trim()}%`;
    params.push(like, like, like, like);
  }
  if (category) {
    where.push('p.category = ?');
    params.push(category);
  }
  if (accessibleOnly) {
    where.push(`EXISTS (
      SELECT 1 FROM place_accessibility pa
      WHERE pa.place_source='internal'
        AND pa.place_external_id = CAST(p.id AS CHAR)
        AND pa.wheelchair_accessible = 1
    )`);
  }

  const distanceExpr = (lat != null && lng != null)
    ? `(6371000 * acos(
        cos(radians(?)) * cos(radians(p.lat)) * cos(radians(p.lng) - radians(?))
        + sin(radians(?)) * sin(radians(p.lat))
      ))`
    : 'NULL';

  const distanceParams = (lat != null && lng != null) ? [lat, lng, lat] : [];

  if (lat != null && lng != null && radiusM) {
    where.push(`${distanceExpr} <= ?`);
    params.push(...distanceParams, radiusM);
  }

  const sql = `
    SELECT
      p.id, p.name, p.name_rw, p.category, p.description, p.address,
      p.lat, p.lng, p.phone, p.website, p.opening_hours, p.source, p.status,
      p.owner_user_id, p.created_at, p.updated_at,
      ${lat != null && lng != null ? `${distanceExpr} AS distance_m` : 'NULL AS distance_m'},
      pa.wheelchair_accessible, pa.has_ramp, pa.has_accessible_toilet,
      pa.has_accessible_parking, pa.has_tactile_paving,
      pa.verification_source, pa.verified_at
    FROM places p
    LEFT JOIN place_accessibility pa
      ON pa.place_source='internal' AND pa.place_external_id = CAST(p.id AS CHAR)
    WHERE ${where.join(' AND ')}
    ORDER BY ${distanceExpr !== 'NULL' ? 'distance_m ASC' : 'p.name ASC'}
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...distanceParams, ...params, limit, offset];
  const [rows] = await pool.query(sql, queryParams);

  return rows.map(normalizePlaceRow);
}

export async function getPlaceById(id) {
  const [rows] = await pool.query(
    `SELECT p.*, pa.wheelchair_accessible, pa.has_ramp, pa.has_accessible_toilet,
            pa.has_accessible_parking, pa.has_tactile_paving,
            pa.verification_source, pa.verified_at
     FROM places p
     LEFT JOIN place_accessibility pa
       ON pa.place_source='internal' AND pa.place_external_id = CAST(p.id AS CHAR)
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;

  const [photos] = await pool.query(
    `SELECT id, url, created_at FROM place_photos WHERE place_id=? ORDER BY id DESC LIMIT 12`,
    [id]
  );

  return { ...normalizePlaceRow(rows[0]), photos };
}

function normalizePlaceRow(r) {
  return {
    id: r.id,
    name: r.name,
    name_rw: r.name_rw,
    category: r.category,
    description: r.description,
    address: r.address,
    lat: Number(r.lat),
    lng: Number(r.lng),
    phone: r.phone,
    website: r.website,
    opening_hours: r.opening_hours,
    source: r.source,
    status: r.status,
    owner_user_id: r.owner_user_id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    distance_m: r.distance_m != null ? Math.round(r.distance_m) : null,
    accessibility: {
      status:
        r.wheelchair_accessible === 1 ? 'accessible' :
        r.wheelchair_accessible === 0 ? 'not_accessible' :
        'unknown',
      wheelchair: r.wheelchair_accessible,
      ramp: r.has_ramp,
      toilet: r.has_accessible_toilet,
      parking: r.has_accessible_parking,
      tactile: r.has_tactile_paving,
      verificationSource: r.verification_source,
      verifiedAt: r.verified_at,
    },
  };
}

/* ---------------------- SUBMISSIONS ---------------------- */

export async function createSubmission({ submittedBy, kind, targetPlaceId, payload }) {
  const [result] = await pool.query(
    `INSERT INTO place_submissions (submitted_by, kind, target_place_id, payload, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [submittedBy ?? null, kind ?? 'new', targetPlaceId ?? null, JSON.stringify(payload)]
  );
  return { id: result.insertId, status: 'pending' };
}

export async function listSubmissions({ status = 'pending', limit = 100 } = {}) {
  const [rows] = await pool.query(
    `SELECT id, submitted_by, kind, target_place_id, payload, status,
            reviewer_id, review_notes, reviewed_at, created_at
     FROM place_submissions
     WHERE status = ?
     ORDER BY created_at DESC
     LIMIT ?`,
    [status, limit]
  );
  return rows;
}

export async function getMySubmissions(userId) {
  const [rows] = await pool.query(
    `SELECT id, kind, target_place_id, payload, status, review_notes, reviewed_at, created_at
     FROM place_submissions WHERE submitted_by = ? ORDER BY created_at DESC LIMIT 100`,
    [userId]
  );
  return rows;
}

export async function approveSubmission(id, reviewerId, overrides = {}) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[sub]] = await conn.query(
      `SELECT * FROM place_submissions WHERE id = ? AND status = 'pending' FOR UPDATE`,
      [id]
    );
    if (!sub) { await conn.rollback(); return { ok: false, error: 'not_found' }; }

    const payload = { ...(typeof sub.payload === 'string' ? JSON.parse(sub.payload) : sub.payload), ...overrides };

    let placeId;
    if (sub.kind === 'new') {
      const [r] = await conn.query(
        `INSERT INTO places
         (name, name_rw, category, description, address, lat, lng, phone, website, opening_hours, source, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'community', 'approved')`,
        [
          payload.name, payload.name_rw ?? null, payload.category ?? 'other',
          payload.description ?? null, payload.address ?? null,
          Number(payload.lat), Number(payload.lng),
          payload.phone ?? null, payload.website ?? null, payload.opening_hours ?? null,
        ]
      );
      placeId = r.insertId;

      if (payload.accessibility) {
        const a = payload.accessibility;
        await conn.query(
          `INSERT INTO place_accessibility
           (place_source, place_external_id, place_name, lat, lng,
            wheelchair_accessible, has_ramp, has_accessible_toilet,
            has_accessible_parking, has_tactile_paving, verification_source, verified_at)
           VALUES ('internal', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'community-approved', NOW())`,
          [
            String(placeId), payload.name, Number(payload.lat), Number(payload.lng),
            a.wheelchair != null ? Number(a.wheelchair) : null,
            a.ramp != null ? Number(a.ramp) : null,
            a.toilet != null ? Number(a.toilet) : null,
            a.parking != null ? Number(a.parking) : null,
            a.tactile != null ? Number(a.tactile) : null,
          ]
        );
      }
    } else if (sub.kind === 'update' && sub.target_place_id) {
      placeId = sub.target_place_id;
      const fields = [];
      const values = [];
      for (const k of ['name','name_rw','category','description','address','phone','website','opening_hours']) {
        if (payload[k] !== undefined) { fields.push(`${k}=?`); values.push(payload[k]); }
      }
      if (payload.lat != null) { fields.push('lat=?'); values.push(Number(payload.lat)); }
      if (payload.lng != null) { fields.push('lng=?'); values.push(Number(payload.lng)); }
      if (fields.length) {
        values.push(placeId);
        await conn.query(`UPDATE places SET ${fields.join(', ')} WHERE id=?`, values);
      }
    } else {
      await conn.rollback();
      return { ok: false, error: 'invalid_kind' };
    }

    await conn.query(
      `UPDATE place_submissions SET status='approved', reviewer_id=?, reviewed_at=NOW() WHERE id=?`,
      [reviewerId, id]
    );
    await conn.commit();
    return { ok: true, placeId };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function rejectSubmission(id, reviewerId, reason) {
  await pool.query(
    `UPDATE place_submissions SET status='rejected', reviewer_id=?, review_notes=?, reviewed_at=NOW()
     WHERE id=? AND status='pending'`,
    [reviewerId, reason ?? null, id]
  );
  return { ok: true };
}

/* ---------------------- BUSINESS CLAIMS ---------------------- */

export async function createClaim({ placeId, claimantUserId, evidence }) {
  const [[exists]] = await pool.query(`SELECT id FROM places WHERE id = ?`, [placeId]);
  if (!exists) return { ok: false, error: 'place_not_found' };

  const [result] = await pool.query(
    `INSERT INTO business_claims (place_id, claimant_user_id, evidence, status)
     VALUES (?, ?, ?, 'pending')`,
    [placeId, claimantUserId, evidence ?? null]
  );
  return { ok: true, id: result.insertId };
}

export async function listClaims({ status = 'pending' } = {}) {
  const [rows] = await pool.query(
    `SELECT c.*, p.name AS place_name, p.category AS place_category
     FROM business_claims c JOIN places p ON p.id = c.place_id
     WHERE c.status = ? ORDER BY c.created_at DESC LIMIT 200`,
    [status]
  );
  return rows;
}

export async function approveClaim(id, reviewerId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [[claim]] = await conn.query(
      `SELECT * FROM business_claims WHERE id = ? AND status = 'pending' FOR UPDATE`,
      [id]
    );
    if (!claim) { await conn.rollback(); return { ok: false, error: 'not_found' }; }

    await conn.query(`UPDATE places SET owner_user_id = ? WHERE id = ?`,
      [claim.claimant_user_id, claim.place_id]);
    await conn.query(
      `UPDATE business_claims SET status='approved', reviewer_id=?, reviewed_at=NOW() WHERE id=?`,
      [reviewerId, id]
    );
    await conn.commit();
    return { ok: true };
  } catch (err) { await conn.rollback(); throw err; }
  finally { conn.release(); }
}

export async function rejectClaim(id, reviewerId, reason) {
  await pool.query(
    `UPDATE business_claims SET status='rejected', reviewer_id=?, review_notes=?, reviewed_at=NOW()
     WHERE id=? AND status='pending'`,
    [reviewerId, reason ?? null, id]
  );
  return { ok: true };
}

/* ---------------------- BUSINESS DASHBOARD ---------------------- */

export async function getMyBusinesses(userId) {
  const [rows] = await pool.query(
    `SELECT * FROM places WHERE owner_user_id = ? AND status = 'approved' ORDER BY name`,
    [userId]
  );
  return rows;
}

export async function updateMyBusiness(placeId, userId, data) {
  const [[place]] = await pool.query(
    `SELECT id FROM places WHERE id = ? AND owner_user_id = ?`,
    [placeId, userId]
  );
  if (!place) return { ok: false, error: 'not_owner' };

  const fields = [];
  const values = [];
  for (const k of ['name','name_rw','category','description','address','phone','website','opening_hours']) {
    if (data[k] !== undefined) { fields.push(`${k}=?`); values.push(data[k]); }
  }
  if (data.lat != null) { fields.push('lat=?'); values.push(Number(data.lat)); }
  if (data.lng != null) { fields.push('lng=?'); values.push(Number(data.lng)); }
  if (!fields.length) return { ok: true };

  values.push(placeId);
  await pool.query(`UPDATE places SET ${fields.join(', ')} WHERE id=?`, values);
  return { ok: true };
}

/* ---------------------- STAFF ---------------------- */

export async function listStaff(placeId, ownerUserId) {
  const [[own]] = await pool.query(`SELECT id FROM places WHERE id=? AND owner_user_id=?`, [placeId, ownerUserId]);
  if (!own) throw Object.assign(new Error('Not owner'), { status: 403 });

  const [rows] = await pool.query(
    `SELECT id, full_name, phone, active, created_at FROM staff_members
     WHERE business_place_id = ? ORDER BY full_name`,
    [placeId]
  );
  return rows;
}

export async function addStaff(placeId, ownerUserId, { fullName, phone }) {
  const [[own]] = await pool.query(`SELECT id FROM places WHERE id=? AND owner_user_id=?`, [placeId, ownerUserId]);
  if (!own) throw Object.assign(new Error('Not owner'), { status: 403 });

  const [r] = await pool.query(
    `INSERT INTO staff_members (business_place_id, full_name, phone) VALUES (?, ?, ?)`,
    [placeId, fullName, phone ?? null]
  );
  return { id: r.insertId };
}

export async function removeStaff(staffId, ownerUserId) {
  const [[staff]] = await pool.query(
    `SELECT s.id, s.business_place_id FROM staff_members s
     JOIN places p ON p.id = s.business_place_id
     WHERE s.id = ? AND p.owner_user_id = ?`,
    [staffId, ownerUserId]
  );
  if (!staff) throw Object.assign(new Error('Not owner'), { status: 403 });
  await pool.query(`UPDATE staff_members SET active = 0 WHERE id = ?`, [staffId]);
  return { ok: true };
}

/* ---------------------- ATTENDANCE ---------------------- */

export async function clockIn({ staffId, recordedBy }) {
  const [[staff]] = await pool.query(
    `SELECT id, business_place_id, active FROM staff_members WHERE id = ?`,
    [staffId]
  );
  if (!staff || !staff.active) throw Object.assign(new Error('Staff not found'), { status: 404 });

  const [[last]] = await pool.query(
    `SELECT action FROM staff_attendance WHERE staff_id = ? ORDER BY at DESC LIMIT 1`,
    [staffId]
  );
  if (last && last.action === 'in') {
    throw Object.assign(new Error('Already clocked in'), { status: 409 });
  }

  const [r] = await pool.query(
    `INSERT INTO staff_attendance (staff_id, business_place_id, action, recorded_by) VALUES (?, ?, 'in', ?)`,
    [staffId, staff.business_place_id, recordedBy ?? null]
  );
  return { id: r.insertId, at: new Date() };
}

export async function clockOut({ staffId, recordedBy }) {
  const [[staff]] = await pool.query(
    `SELECT id, business_place_id, active FROM staff_members WHERE id = ?`,
    [staffId]
  );
  if (!staff || !staff.active) throw Object.assign(new Error('Staff not found'), { status: 404 });

  const [[last]] = await pool.query(
    `SELECT action FROM staff_attendance WHERE staff_id = ? ORDER BY at DESC LIMIT 1`,
    [staffId]
  );
  if (!last || last.action !== 'in') {
    throw Object.assign(new Error('Not clocked in'), { status: 409 });
  }

  const [r] = await pool.query(
    `INSERT INTO staff_attendance (staff_id, business_place_id, action, recorded_by) VALUES (?, ?, 'out', ?)`,
    [staffId, staff.business_place_id, recordedBy ?? null]
  );
  return { id: r.insertId, at: new Date() };
}

export async function listAttendance(placeId, ownerUserId, { from, to } = {}) {
  const [[own]] = await pool.query(`SELECT id FROM places WHERE id=? AND owner_user_id=?`, [placeId, ownerUserId]);
  if (!own) throw Object.assign(new Error('Not owner'), { status: 403 });

  const conds = ['a.business_place_id = ?'];
  const params = [placeId];
  if (from) { conds.push('a.at >= ?'); params.push(from); }
  if (to) { conds.push('a.at <= ?'); params.push(to); }

  const [rows] = await pool.query(
    `SELECT a.id, a.staff_id, s.full_name, a.action, a.at, a.note
     FROM staff_attendance a
     JOIN staff_members s ON s.id = a.staff_id
     WHERE ${conds.join(' AND ')}
     ORDER BY a.at DESC LIMIT 500`,
    params
  );
  return rows;
}

/* ---------------------- OSM IMPORT ---------------------- */

export async function importOsmPlaces({ bbox, categories, limit = 100, dryRun = false }) {
  if (!bbox) throw Object.assign(new Error('bbox required'), { status: 400 });
  const [south, west, north, east] = bbox.split(',').map(Number);
  if ([south, west, north, east].some((n) => isNaN(n))) {
    throw Object.assign(new Error('bbox must be "south,west,north,east"'), { status: 400 });
  }

  const catFilter = categories && categories.length
    ? `[amenity~"^(${categories.join('|')})$"]`
    : `[amenity]`;

  const query = `
    [out:json][timeout:25];
    (
      node${catFilter}(${south},${west},${north},${east});
      way${catFilter}(${south},${west},${north},${east});
    );
    out center tags 200;
  `;

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw Object.assign(new Error(`Overpass error ${res.status}`), { status: 502 });

  const data = await res.json();
  const elements = (data.elements || []).slice(0, limit);

  let inserted = 0, skipped = 0;
  for (const el of elements) {
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (lat == null || lng == null) { skipped++; continue; }
    if (!el.tags?.name) { skipped++; continue; }

    const sourceRef = `osm:${el.type}:${el.id}`;

    const [[exists]] = await pool.query(
      `SELECT id FROM places WHERE source_ref = ? LIMIT 1`,
      [sourceRef]
    );
    if (exists) { skipped++; continue; }

    if (dryRun) { inserted++; continue; }

    const category = mapOsmCategory(el.tags.amenity);
    await pool.query(
      `INSERT INTO places
       (name, category, description, address, lat, lng, phone, website, opening_hours,
        source, source_ref, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'osm', ?, 'approved')`,
      [
        el.tags.name, category,
        el.tags.description ?? null,
        el.tags['addr:street'] ?? el.tags['addr:city'] ?? null,
        lat, lng,
        el.tags.phone ?? null,
        el.tags.website ?? null,
        el.tags.opening_hours ?? null,
        sourceRef,
      ]
    );

    // Wheelchair tag if present in OSM
    if (el.tags.wheelchair) {
      const val = el.tags.wheelchair === 'yes' ? 1 : el.tags.wheelchair === 'no' ? 0 : null;
      if (val !== null) {
        const [result] = await pool.query(`SELECT LAST_INSERT_ID() AS id`);
        const placeId = result[0].id;
        await pool.query(
          `INSERT INTO place_accessibility
           (place_source, place_external_id, place_name, lat, lng, wheelchair_accessible, verification_source, verified_at)
           VALUES ('internal', ?, ?, ?, ?, ?, 'osm-tag', NOW())`,
          [String(placeId), el.tags.name, lat, lng, val]
        );
      }
    }

    inserted++;
  }

  return { ok: true, found: elements.length, inserted, skipped, dryRun };
}

function mapOsmCategory(amenity) {
  const map = {
    restaurant: 'restaurant', cafe: 'cafe', fast_food: 'fast_food', bar: 'bar',
    pub: 'bar', pharmacy: 'pharmacy', hospital: 'hospital', clinic: 'clinic',
    bank: 'bank', atm: 'atm', fuel: 'fuel', marketplace: 'market',
    school: 'school', university: 'university', place_of_worship: 'place_of_worship',
    townhall: 'government', post_office: 'government', police: 'government',
  };
  return map[amenity] || 'other';
}