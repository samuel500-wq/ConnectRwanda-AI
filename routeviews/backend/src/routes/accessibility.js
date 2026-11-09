import { Router } from 'express';
import { z } from 'zod';
import { getAccessibilityForPlace } from '../services/accessibility.js';

const router = Router();

const q = z.object({
  source: z.enum(['internal', 'osm', 'manual']).default('internal'),
  id: z.string().min(1),
});

router.get('/places/accessibility', async (req, res, next) => {
  try {
    const parsed = q.parse(req.query);
    const result = await getAccessibilityForPlace({ source: parsed.source, externalId: parsed.id });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;