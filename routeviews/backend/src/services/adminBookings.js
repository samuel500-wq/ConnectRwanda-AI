import { pool } from '../db/pool.js';

export async function listBookings({ page = 1, pageSize = 20, status, type, q, date_from, date_to }) {
  const offset = (page - 1) * pageSize;
  
  let unionParts = [];
  let params = [];

  // 1. Urban Bookings
  if (type === 'all' || type === 'urban') {
    unionParts.push(`
      SELECT 
        CONVERT('urban' USING utf8mb4) as type,
        b.id,
        CONVERT(b.reference USING utf8mb4) as reference,
        CONVERT(b.passenger_name USING utf8mb4) as passenger_name,
        CONVERT(u.email USING utf8mb4) as user_email,
        CONVERT(r.code USING utf8mb4) as route_code,
        CONVERT(r.color_hex USING utf8mb4) as route_color,
        CONVERT(r.name_en USING utf8mb4) as route_name,
        CONVERT(NULL USING utf8mb4) as origin,
        CONVERT(NULL USING utf8mb4) as destination,
        b.depart_at as trip_departure,
        b.amount_rwf,
        CONVERT(b.status USING utf8mb4) as status,
        CONVERT(t.status USING utf8mb4) as ticket_status
      FROM bookings b
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN routes r ON r.id = b.route_id
      LEFT JOIN tickets t ON t.booking_id = b.id
      WHERE 1=1
      ${status ? `AND b.status = ?` : ''}
      ${q ? `AND (b.reference LIKE ? OR b.passenger_name LIKE ? OR u.email LIKE ?)` : ''}
      ${date_from ? `AND DATE(b.created_at) >= ?` : ''}
      ${date_to ? `AND DATE(b.created_at) <= ?` : ''}
    `);
    if (status) params.push(status);
    if (q) params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    if (date_from) params.push(date_from);
    if (date_to) params.push(date_to);
  }

  // 2. Intercity Bookings
  if (type === 'all' || type === 'intercity') {
    unionParts.push(`
      SELECT 
        CONVERT('intercity' USING utf8mb4) as type,
        b.id,
        CONVERT(b.reference USING utf8mb4) as reference,
        CONVERT(b.passenger_name USING utf8mb4) as passenger_name,
        CONVERT(u.email USING utf8mb4) as user_email,
        CONVERT('IC' USING utf8mb4) as route_code,
        CONVERT('#10B981' USING utf8mb4) as route_color,
        CONVERT(NULL USING utf8mb4) as route_name,
        CONVERT(t.origin_city USING utf8mb4) as origin,
        CONVERT(t.destination_city USING utf8mb4) as destination,
        t.departure_dt as trip_departure,
        b.amount_rwf,
        CONVERT(b.status USING utf8mb4) as status,
        CONVERT(NULL USING utf8mb4) as ticket_status
      FROM intercity_bookings b
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN intercity_trips t ON t.id = b.trip_id
      WHERE 1=1
      ${status ? `AND b.status = ?` : ''}
      ${q ? `AND (b.reference LIKE ? OR b.passenger_name LIKE ? OR u.email LIKE ?)` : ''}
      ${date_from ? `AND DATE(b.created_at) >= ?` : ''}
      ${date_to ? `AND DATE(b.created_at) <= ?` : ''}
    `);
    if (status) params.push(status);
    if (q) params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    if (date_from) params.push(date_from);
    if (date_to) params.push(date_to);
  }

  if (unionParts.length === 0) return { total: 0, page, pageSize, rows: [] };

  const unionQuery = unionParts.join(' UNION ALL ');
  
  const countQuery = `SELECT COUNT(*) as total FROM (${unionQuery}) as sub`;
  const [countResult] = await pool.query(countQuery, params);
  const total = countResult[0].total;

  const dataQuery = `${unionQuery} ORDER BY trip_departure DESC LIMIT ? OFFSET ?`;
  const [rows] = await pool.query(dataQuery, [...params, Number(pageSize), Number(offset)]);

  return { total, page: Number(page), pageSize: Number(pageSize), rows };
}

export async function getBooking({ type, id }) {
  if (type === 'urban') {
    const [rows] = await pool.query(`
      SELECT 
        b.*, 
        r.code, r.color_hex as color, r.name_en,
        u.email,
        t.code as ticket_code, t.status as ticket_status, t.issued_at, t.used_at
      FROM bookings b
      LEFT JOIN routes r ON r.id = b.route_id
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN tickets t ON t.booking_id = b.id
      WHERE b.id = ?
    `, [id]);
    
    if (!rows[0]) return null;
    const b = rows[0];
    return {
      booking: b,
      route: { code: b.code, color: b.color, name_en: b.name_en, from_stop: b.from_stop || '—', to_stop: b.to_stop || '—' },
      user: { email: b.email },
      ticket: b.ticket_code ? { code: b.ticket_code, status: b.ticket_status, issued_at: b.issued_at, used_at: b.used_at } : null
    };
  } else {
    const [rows] = await pool.query(`
      SELECT 
        b.*,
        t.origin_city, t.destination_city, t.departure_dt, t.vehicle_id,
        u.email
      FROM intercity_bookings b
      LEFT JOIN intercity_trips t ON t.id = b.trip_id
      LEFT JOIN users u ON u.id = b.user_id
      WHERE b.id = ?
    `, [id]);

    if (!rows[0]) return null;
    const b = rows[0];
    return {
      booking: b,
      route: { origin_city: b.origin_city, destination_city: b.destination_city, distance_km: 0, duration_min: 0, province: 'Rwanda' },
      trip: { departure_dt: b.departure_dt, plate_number: b.vehicle_id, driver_name: '—', bus_type: 'Intercity' },
      company: { name: 'ConnectRwanda Intercity', phone: '—' },
      user: { email: b.email },
      ticket: b.reference ? { code: b.reference, status: b.status, issued_at: b.created_at, used_at: null } : null
    };
  }
}