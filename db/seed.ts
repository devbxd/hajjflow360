import pg from 'pg';
import { pilgrims, groupLeaders, hotels, buses, flights, recentActivity } from '../src/lib/mockData';

// One-time seed values for the 3 fixed staff accounts. These bcrypt hashes
// were generated once from the passwords the client provided; users.ts no
// longer keeps a static copy since accounts now live in staff_users.
const staffSeed = [
  { username: 'user1', displayName: 'Utilisateur 1', passwordHash: '$2b$10$lHmDKxGrKQScPQygy280DOJQ5vxMzLtIgVJKj4bLptFZopaG3D7bm' },
  { username: 'user2', displayName: 'Utilisateur 2', passwordHash: '$2b$10$PlImnUG9vaAVboH4obmpMeBa9AVhNi7mMfU/68t0w7yIz6.c87bs6' },
  { username: 'user3', displayName: 'Utilisateur 3', passwordHash: '$2b$10$oblSxHwS8PSfFysHw.d9EO5xDkCq0Ba89jAzuEuEeR2AbwAEYvfYm' },
];

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Run with: npm run db:seed');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  await pool.query('BEGIN');
  try {
    // Staff accounts
    for (const u of staffSeed) {
      await pool.query(
        `INSERT INTO staff_users (username, display_name, password_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO UPDATE SET display_name = EXCLUDED.display_name, password_hash = EXCLUDED.password_hash`,
        [u.username, u.displayName, u.passwordHash]
      );
    }

    // Group leaders (pilgrim/visa/passport/payment counters are computed
    // from real pilgrim rows at query time, not stored here)
    for (const gl of groupLeaders) {
      await pool.query(
        `INSERT INTO group_leaders (id, name, phone, group_id)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone`,
        [gl.id, gl.name, gl.phone, gl.groupId]
      );
    }

    // Hotels / buses / flights (reference/capacity data)
    for (const h of hotels) {
      await pool.query(
        `INSERT INTO hotels (id, name, city, stars, total_rooms, check_in, check_out)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [h.id, h.name, h.city, h.stars, h.totalRooms, h.checkIn, h.checkOut]
      );
    }
    for (const b of buses) {
      await pool.query(
        `INSERT INTO buses (id, number, capacity, driver, route, group_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [b.id, b.number, b.capacity, b.driver, b.route, b.groupId]
      );
    }
    for (const f of flights) {
      await pool.query(
        `INSERT INTO flights (id, flight_number, airline, origin, destination, flight_date, flight_time, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [f.id, f.flightNumber, f.airline, f.origin, f.destination, f.date, f.time, f.status]
      );
    }

    // Pilgrims + one payment row per pilgrim seeding their current paymentPaid total
    for (const p of pilgrims) {
      await pool.query(
        `INSERT INTO pilgrims (
           id, name, name_ar, nationality, nationality_code, passport_number, passport_expiry,
           passport_status, visa_status, visa_number, visa_expiry, flight_status, flight_number,
           flight_date, hotel_makkah, hotel_madinah, room_number, room_type, bus_number, seat_number,
           group_id, payment_total, payment_status, gender, date_of_birth, age, phone, email, emergency_contact,
           emergency_phone, mahram_id, attendance_status, registered_at
         ) VALUES (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
           $21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33
         )
         ON CONFLICT (id) DO NOTHING`,
        [
          p.id, p.name, p.nameAr ?? null, p.nationality, p.nationalityCode, p.passportNumber, p.passportExpiry,
          p.passportStatus, p.visaStatus, p.visaNumber ?? null, p.visaExpiry ?? null, p.flightStatus, p.flightNumber ?? null,
          p.flightDate ?? null, p.hotelMakkah ?? null, p.hotelMadinah ?? null, p.roomNumber ?? null, p.roomType ?? null,
          p.busNumber ?? null, p.seatNumber ?? null, p.groupId, p.paymentTotal, p.paymentStatus, p.gender, p.dateOfBirth, p.age, p.phone,
          p.email, p.emergencyContact, p.emergencyPhone, p.mahramId ?? null, p.attendanceStatus, p.registeredAt,
        ]
      );

      if (p.paymentPaid > 0) {
        // registeredAt is already YYYY-MM-DD in mockData
        await pool.query(
          `INSERT INTO payments (pilgrim_id, paid_on, amount, method, reference, status)
           VALUES ($1, $2, $3, $4, $5, 'cleared')`,
          [p.id, p.registeredAt, p.paymentPaid, 'Bank Transfer', `TXN-${p.id}`]
        );
      }
    }

    // Recent activity feed
    for (const a of recentActivity) {
      await pool.query(
        `INSERT INTO activity_log (type, message, icon) VALUES ($1, $2, $3)`,
        [a.type, a.message, a.icon]
      );
    }

    await pool.query('COMMIT');
    console.log(`✓ Seeded ${pilgrims.length} pilgrims, ${groupLeaders.length} group leaders, ${hotels.length} hotels, ${buses.length} buses, ${flights.length} flights, ${recentActivity.length} activity entries, ${staffSeed.length} staff accounts.`);
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } finally {
    await pool.end();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
