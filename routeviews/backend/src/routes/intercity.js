import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { ah, ApiError } from '../middleware/error.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import crypto from 'node:crypto';

export const intercityRouter = Router();

const RWANDA_CITIES = [
  'Kigali', 'Musanze', 'Rubavu', 'Huye', 'Muhanga', 'Nyanza', 'Rusizi', 'Nyagatare', 'Karongi', 'Rwamagana', 'Kayonza', 'Gisagara', 'Ngororero', 'Nyamagabe', 'Ruhango', 'Nyamasheke', 'Rutsiro', 'Gatsibo', 'Kirehe', 'Bugesera', 'Ngoma'
];

function generateReference() {
  return 'RV-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

function generateQrUrl(code) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(code)}`;
}

/* ================================================================== *
 *  Public: Origins & Destinations                                    *
 * ================================================================== */
intercityRouter.get('/destinations', ah(async (req, res) => {
  const from = req.query.from ? String(req.query.from) : null;
  
  // Fetch ONLY the origins that exist in the Admin's trips
  const [originsRows] = await pool.query('SELECT DISTINCT origin_city as city FROM intercity_trips');
  
  // Fetch ONLY the destinations for the selected origin
  const [destRows] = await pool.query(
    from 
      ? 'SELECT DISTINCT destination_city as city FROM intercity_trips WHERE origin_city = ?'
      : 'SELECT DISTINCT destination_city as city FROM intercity_trips',
    from ? [from] : []
  );

  // If the database is empty (no buses registered), fallback to full list so UI doesn't break
  const finalOrigins = originsRows.length > 0 ? originsRows : RWANDA_CITIES.map(c => ({ city: c }));
  const finalDests = destRows.length > 0 ? destRows.map(d => ({ 
    city: d.city, province: 'Rwanda', distance_km: 50, duration_min: 60, from_price_rwf: 3000
  })) : RWANDA_CITIES.map(c => ({ 
    city: c, province: 'Rwanda', distance_km: 50, duration_min: 60, from_price_rwf: 3000
  }));

  res.json({ origins: finalOrigins, destinations: finalDests, provinces: [{ name: 'Rwanda' }] });
}));

/* ================================================================== *
 *  Public: Search Trips (Robust)                                     *
 * ================================================================== */
intercityRouter.get('/search', ah(async (req, res) => {
  const from = String(req.query.from || 'Kigali');
  const to = String(req.query.to || '');
  const date = req.query.date ? String(req.query.date) : null;

  let query = `
    SELECT * FROM intercity_trips 
    WHERE origin_city = ? 
      AND status = 'scheduled'
  `;
  const params = [from];

  if (to) {
    query += ` AND destination_city = ?`;
    params.push(to);
  }

  if (date) {
    // Safely compare dates regardless of format
    query += ` AND DATE(departure_dt) = DATE(?)`;
    params.push(date);
  }

  query += ` ORDER BY departure_dt ASC`;

  const [trips] = await pool.query(query, params);
  res.json({ trips });
}));

/* ================================================================== *
 *  Auth: Create Booking (With Seat Decreasing)                       *
 * ================================================================== */
const bookingSchema = z.object({
  tripId: z.number().int().positive(),
  passengerName: z.string().min(2).max(120),
  passengerPhone: z.string().max(30).optional(),
  passengerEmail: z.string().email().max(190).optional(),
  passengerIdNo: z.string().max(30).optional()
});

intercityRouter.post('/bookings', requireAuth, ah(async (req, res) => {
  const b = bookingSchema.parse(req.body);
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const [trips] = await connection.query(
      'SELECT available_seats, price_rwf, vehicle_id FROM intercity_trips WHERE id = ? FOR UPDATE', 
      [b.tripId]
    );

    if (trips.length === 0) {
      await connection.rollback();
      throw new ApiError(404, 'trip_not_found');
    }

    const trip = trips[0];
    if (trip.available_seats <= 0) {
      await connection.rollback();
      throw new ApiError(400, 'sold_out');
    }

    await connection.query(
      'UPDATE intercity_trips SET available_seats = available_seats - 1 WHERE id = ?', 
      [b.tripId]
    );

    const reference = generateReference();
    const [result] = await connection.query(
      `INSERT INTO intercity_bookings 
      (trip_id, user_id, passenger_name, passenger_phone, passenger_email, passenger_id_no, amount_rwf, reference, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [b.tripId, req.user.id, b.passengerName, b.passengerPhone || null, b.passengerEmail || null, b.passengerIdNo || null, trip.price_rwf, reference]
    );

    await connection.commit();
    res.status(201).json({ booking: { id: result.insertId, reference } });

  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}));

/* ================================================================== *
 *  Auth: Pay Demo & Generate Ticket                                  *
 * ================================================================== */
intercityRouter.post('/bookings/:id/pay-demo', requireAuth, ah(async (req, res) => {
  const [result] = await pool.query(
    `UPDATE intercity_bookings SET status = 'paid' WHERE id = ? AND user_id = ?`,
    [Number(req.params.id), req.user.id]
  );
  if (result.affectedRows === 0) throw new ApiError(404, 'booking_not_found');
  res.json({ ok: true });
}));

intercityRouter.get('/bookings', requireAuth, ah(async (req, res) => {
  const [bookings] = await pool.query(
    `SELECT b.*, t.origin_city, t.destination_city, t.departure_dt, t.vehicle_id
     FROM intercity_bookings b
     JOIN intercity_trips t ON t.id = b.trip_id
     WHERE b.user_id = ? ORDER BY b.created_at DESC`,
    [req.user.id]
  );
  res.json({ bookings });
}));

intercityRouter.get('/bookings/:id/ticket', requireAuth, ah(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT b.reference, b.status, b.passenger_name, b.passenger_phone, b.amount_rwf, b.created_at,
            t.origin_city, t.destination_city, t.departure_dt, t.vehicle_id
     FROM intercity_bookings b
     JOIN intercity_trips t ON t.id = b.trip_id
     WHERE b.id = ? AND b.user_id = ?`,
    [Number(req.params.id), req.user.id]
  );

  if (rows.length === 0) throw new ApiError(404, 'ticket_not_found');

  const t = rows[0];
  res.json({ ticket: {
    ...t,
    code: t.reference,
    qr_data_url: generateQrUrl(t.reference),
    origin_terminal: 'Main Terminal',
    destination_terminal: 'Main Terminal',
    company_name: 'ConnectRwanda Intercity',
    seat_number: Math.floor(Math.random() * 40) + 1,
  }});
}));

/* ================================================================== *
 *  Operator/Admin: Redeem QR                                         *
 * ================================================================== */
const redeemSchema = z.object({
  code: z.string().min(6).max(255),
  plateNumber: z.string().max(30).optional()
});

intercityRouter.post('/redeem', requireAuth, requireRole('operator', 'admin'), ah(async (req, res) => {
  const b = redeemSchema.parse(req.body);
  
  const [rows] = await pool.query(
    `SELECT b.id, b.status, t.vehicle_id FROM intercity_bookings b
     JOIN intercity_trips t ON t.id = b.trip_id WHERE b.reference = ?`,
    [b.code]
  );

  if (rows.length === 0) return res.status(404).json({ error: 'ticket_not_found' });
  const booking = rows[0];
  if (booking.status === 'used') return res.status(400).json({ error: 'already_used' });
  if (booking.status !== 'paid') return res.status(400).json({ error: 'not_paid' });

  await pool.query('UPDATE intercity_bookings SET status = ? WHERE id = ?', ['used', booking.id]);
  res.json({ ok: true, code: b.code, reference: b.code, route: 'Intercity Route', company: 'ConnectRwanda Intercity', plate_number: booking.vehicle_id });
}));