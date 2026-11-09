// Accessibility lookup service.
// Returns "unknown" if nothing verified — never fabricates accessibility.
import { pool } from '../db/pool.js';

export async function getAccessibilityForPlace({ source, externalId }) {
  const [rows] = await pool.query(
    `SELECT * FROM place_accessibility WHERE place_source=? AND place_external_id=? LIMIT 1`,
    [source, externalId]
  );

  if (!rows[0]) {
    return { available: false, status: 'unknown', reason: 'No verified record' };
  }

  const r = rows[0];
  return {
    available: true,
    status:
      r.wheelchair_accessible === null ? 'unknown'
      : r.wheelchair_accessible ? 'accessible'
      : 'not_accessible',
    details: {
      ramp: r.has_ramp,
      toilet: r.has_accessible_toilet,
      parking: r.has_accessible_parking,
      tactile: r.has_tactile_paving,
    },
    provenance: {
      source: r.place_source,
      verification: r.verification_source,
      verifiedAt: r.verified_at,
      freshnessDays: r.data_freshness_days,
    },
    notes: r.notes,
  };
}