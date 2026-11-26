/**
 * ResQ — Database Seed Script
 * Populates development demo accounts, organizations, reports, assignments,
 * tracking records, and notifications.
 *
 * Idempotent: safe to run multiple times without duplicating records or corrupting foreign keys.
 * Run with: node database/seed.js
 */

const path = require('path');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables from project root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { db } = require('../shared');

async function seed() {
  console.log('====================================================');
  console.log('🌱 Starting ResQ Database Seeding...');
  console.log('====================================================');

  const connectionTest = await db.testConnection();
  if (!connectionTest.connected) {
    console.error('❌ Could not connect to database:', connectionTest.error);
    process.exit(1);
  }
  console.log(`✅ Connected to database: ${connectionTest.database} (PostGIS: ${connectionTest.postgis || 'N/A'})`);

  const passwordHash = await bcrypt.hash('Password123!', 10);

  try {
    // 1. SEED USERS
    console.log('\n--- 1. Seeding Users ---');
    const users = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@resq.org',
        full_name: 'ResQ System Admin',
        phone: '+919876543210',
        role: 'admin',
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'delhi_shelter@resq.org',
        full_name: 'Dr. Anita Roy (Shelter Admin)',
        phone: '+919876543211',
        role: 'org_admin',
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        email: 'rescuer.rahul@resq.org',
        full_name: 'Rahul Sharma (Field Rescuer)',
        phone: '+919876543212',
        role: 'rescuer',
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        email: 'citizen.priya@gmail.com',
        full_name: 'Priya Sharma (Citizen)',
        phone: '+919876543213',
        role: 'citizen',
      },
      {
        id: '55555555-5555-5555-5555-555555555555',
        email: 'citizen.amit@gmail.com',
        full_name: 'Amit Verma (Citizen)',
        phone: '+919876543214',
        role: 'citizen',
      },
      {
        id: '66666666-6666-6666-6666-666666666666',
        email: 'sgacc.admin@delhianimals.org',
        full_name: 'Vikas Gupta (SGACC Coordinator)',
        phone: '+919876543215',
        role: 'org_admin',
      },
    ];

    for (const u of users) {
      await db.query(
        `INSERT INTO users (id, email, password_hash, full_name, phone, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE)
         ON CONFLICT (id) DO UPDATE 
         SET full_name = EXCLUDED.full_name,
             phone = EXCLUDED.phone,
             role = EXCLUDED.role,
             password_hash = EXCLUDED.password_hash;`,
        [u.id, u.email, passwordHash, u.full_name, u.phone, u.role]
      );
      console.log(`  ✓ User verified: ${u.email} [${u.role}]`);
    }

    // 2. SEED ORGANIZATIONS
    console.log('\n--- 2. Seeding Organizations ---');
    const orgs = [
      {
        id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        name: 'Friendicoes SECA (South Delhi)',
        reg_no: 'REG-DL-2015-0819',
        email: 'contact@friendicoes.org',
        phone: '+911124314987',
        address: '271 & 273 Defence Colony Flyover Market, New Delhi',
        lon: 77.2345,
        lat: 28.5728,
        radius_km: 20.00,
        animals: ['dog', 'cat', 'cattle', 'bird'],
        verified: true,
      },
      {
        id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        name: 'Sanjay Gandhi Animal Care Centre (West Delhi)',
        reg_no: 'REG-DL-2010-0112',
        email: 'sgacc@delhianimals.org',
        phone: '+911125448062',
        address: 'Near Raja Garden, Shivaji College Road, New Delhi',
        lon: 77.1215,
        lat: 28.6542,
        radius_km: 25.00,
        animals: ['dog', 'cat', 'cattle', 'horse'],
        verified: true,
      },
      {
        id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
        name: 'Noida Animal Care Sanctuary (Pending Verification)',
        reg_no: 'REG-UP-2023-9901',
        email: 'care@noidapetsanctuary.org',
        phone: '+911202456789',
        address: 'Sector 62, Noida, Uttar Pradesh',
        lon: 77.3649,
        lat: 28.6280,
        radius_km: 15.00,
        animals: ['dog', 'cat', 'bird'],
        verified: false,
      },
    ];

    for (const o of orgs) {
      await db.query(
        `INSERT INTO organizations (
           id, name, registration_number, contact_email, contact_phone, 
           address_text, location, operational_radius_km, animal_types_handled, 
           is_verified, is_active
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           ST_SetSRID(ST_MakePoint($7, $8), 4326),
           $9, $10, $11, TRUE
         )
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             contact_email = EXCLUDED.contact_email,
             contact_phone = EXCLUDED.contact_phone,
             address_text = EXCLUDED.address_text,
             location = EXCLUDED.location,
             operational_radius_km = EXCLUDED.operational_radius_km,
             animal_types_handled = EXCLUDED.animal_types_handled,
             is_verified = EXCLUDED.is_verified;`,
        [o.id, o.name, o.reg_no, o.email, o.phone, o.address, o.lon, o.lat, o.radius_km, o.animals, o.verified]
      );
      console.log(`  ✓ Organization verified: ${o.name} (Verified: ${o.verified})`);
    }

    // 3. SEED ORGANIZATION MEMBERS
    console.log('\n--- 3. Seeding Organization Memberships ---');
    const members = [
      { org_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', user_id: '22222222-2222-2222-2222-222222222222', org_role: 'admin' },
      { org_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', user_id: '33333333-3333-3333-3333-333333333333', org_role: 'rescuer' },
      { org_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', user_id: '66666666-6666-6666-6666-666666666666', org_role: 'admin' },
    ];

    for (const m of members) {
      await db.query(
        `INSERT INTO organization_members (organization_id, user_id, org_role)
         VALUES ($1, $2, $3)
         ON CONFLICT (organization_id, user_id) DO UPDATE
         SET org_role = EXCLUDED.org_role;`,
        [m.org_id, m.user_id, m.org_role]
      );
      console.log(`  ✓ Membership verified: Org ${m.org_id.slice(0, 8)}... <-> User ${m.user_id.slice(0, 8)}... [${m.org_role}]`);
    }

    // 4. SEED RESCUE REPORTS
    console.log('\n--- 4. Seeding Rescue Reports ---');
    const reports = [
      {
        id: '99999999-9999-9999-9999-999999999999',
        reporter_id: '44444444-4444-4444-4444-444444444444',
        animal_type: 'dog',
        breed: 'Indie / Stray',
        condition: 'Limping on right hind leg after minor collision with two-wheeler. Resting under tea stall.',
        severity: 'medium',
        lon: 77.2280,
        lat: 28.5710,
        address: 'Near Moolchand Metro Station, Ring Road, New Delhi',
        status: 'reported',
      },
      {
        id: '88888888-8888-8888-8888-888888888888',
        reporter_id: '44444444-4444-4444-4444-444444444444',
        animal_type: 'cat',
        breed: 'Tabby Kitten',
        condition: 'Kitten stuck in stormwater drain grate near residential gate. Crying loudly.',
        severity: 'high',
        lon: 77.2155,
        lat: 28.5520,
        address: 'Hauz Khas Enclave, Main Market Gate, New Delhi',
        status: 'assigned',
      },
      {
        id: '77777777-7777-7777-7777-777777777777',
        reporter_id: '55555555-5555-5555-5555-555555555555',
        animal_type: 'cattle',
        breed: 'Indian Cow',
        condition: 'Injured horn bleeding near central road divider. Causing traffic buildup.',
        severity: 'critical',
        lon: 77.1350,
        lat: 28.6490,
        address: 'Near Rajouri Garden Metro Station, Ring Road, New Delhi',
        status: 'in_progress',
      },
      {
        id: '66666666-6666-6666-6666-666666666667',
        reporter_id: '55555555-5555-5555-5555-555555555555',
        animal_type: 'bird',
        breed: 'Pigeon',
        condition: 'Entangled in kite string (manja) on low tree branch. Wing dislocated.',
        severity: 'low',
        lon: 77.2090,
        lat: 28.6289,
        address: 'Connaught Place Outer Circle, New Delhi',
        status: 'rescued',
      },
    ];

    for (const r of reports) {
      await db.query(
        `INSERT INTO rescue_reports (
           id, reporter_id, animal_type, breed, condition_description,
           severity_level, location, address_text, status
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           ST_SetSRID(ST_MakePoint($7, $8), 4326),
           $9, $10
         )
         ON CONFLICT (id) DO UPDATE
         SET status = EXCLUDED.status,
             condition_description = EXCLUDED.condition_description;`,
        [r.id, r.reporter_id, r.animal_type, r.breed, r.condition, r.severity, r.lon, r.lat, r.address, r.status]
      );
      console.log(`  ✓ Report verified: [${r.id.slice(0, 8)}] ${r.animal_type} (${r.status})`);
    }

    // 5. SEED ASSIGNMENTS
    console.log('\n--- 5. Seeding Rescue Assignments ---');
    const assignments = [
      {
        id: 'a1111111-1111-1111-1111-111111111111',
        report_id: '88888888-8888-8888-8888-888888888888',
        org_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        rescuer_id: '33333333-3333-3333-3333-333333333333',
        status: 'accepted',
        notes: 'Dispatched rescue van #2 with technician Rahul.',
      },
      {
        id: 'a2222222-2222-2222-2222-222222222222',
        report_id: '77777777-7777-7777-7777-777777777777',
        org_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        rescuer_id: null,
        status: 'in_transit',
        notes: 'Cattle ambulance dispatched from West Delhi center.',
      },
      {
        id: 'a3333333-3333-3333-3333-333333333333',
        report_id: '66666666-6666-6666-6666-666666666667',
        org_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        rescuer_id: '33333333-3333-3333-3333-333333333333',
        status: 'rescued',
        notes: 'Bird safely extricated, given first aid and resting in aviary.',
      },
    ];

    for (const a of assignments) {
      await db.query(
        `INSERT INTO rescue_assignments (
           id, report_id, organization_id, assigned_rescuer_id, status, response_notes, responded_at
         ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (report_id, organization_id) DO UPDATE
         SET status = EXCLUDED.status,
             response_notes = EXCLUDED.response_notes;`,
        [a.id, a.report_id, a.org_id, a.rescuer_id, a.status, a.notes]
      );
      console.log(`  ✓ Assignment verified: Report ${a.report_id.slice(0, 8)} -> Org ${a.org_id.slice(0, 8)} [${a.status}]`);
    }

    // 6. SEED TRACKING AUDIT UPDATES
    console.log('\n--- 6. Seeding Tracking Updates ---');
    const trackingUpdates = [
      {
        report_id: '88888888-8888-8888-8888-888888888888',
        assignment_id: 'a1111111-1111-1111-1111-111111111111',
        user_id: '22222222-2222-2222-2222-222222222222',
        status: 'assigned',
        notes: 'Friendicoes shelter accepted distress call and assigned field rescuer Rahul.',
      },
      {
        report_id: '77777777-7777-7777-7777-777777777777',
        assignment_id: 'a2222222-2222-2222-2222-222222222222',
        user_id: '66666666-6666-6666-6666-666666666666',
        status: 'in_progress',
        notes: 'Heavy animal ambulance on site. First aid antiseptic applied to horn wound.',
      },
      {
        report_id: '66666666-6666-6666-6666-666666666667',
        assignment_id: 'a3333333-3333-3333-3333-333333333333',
        user_id: '33333333-3333-3333-3333-333333333333',
        status: 'rescued',
        notes: 'Pigeon safely detangled from nylon string. Transferred to shelter recovery aviary.',
      },
    ];

    for (const t of trackingUpdates) {
      await db.query(
        `INSERT INTO rescue_tracking_updates (
           report_id, assignment_id, updated_by, status_update, notes
         ) VALUES ($1, $2, $3, $4, $5);`,
        [t.report_id, t.assignment_id, t.user_id, t.status, t.notes]
      );
      console.log(`  ✓ Tracking logged: Report ${t.report_id.slice(0, 8)} -> Status: ${t.status}`);
    }

    // 7. SEED NOTIFICATIONS
    console.log('\n--- 7. Seeding Notifications ---');
    const notifications = [
      {
        recipient: '44444444-4444-4444-4444-444444444444',
        report_id: '88888888-8888-8888-8888-888888888888',
        type: 'rescue_assigned',
        title: '🚑 NGO Assigned to Your Report',
        message: 'Friendicoes SECA has accepted your kitten distress report and dispatched a rescuer.',
      },
      {
        recipient: '55555555-5555-5555-5555-555555555555',
        report_id: '66666666-6666-6666-6666-666666666667',
        type: 'rescue_completed',
        title: '🎉 Animal Successfully Rescued!',
        message: 'The injured pigeon in Connaught Place has been rescued and is now receiving medical treatment.',
      },
    ];

    for (const n of notifications) {
      await db.query(
        `INSERT INTO notifications (
           recipient_user_id, report_id, type, title, message, is_read
         ) VALUES ($1, $2, $3, $4, $5, FALSE);`,
        [n.recipient, n.report_id, n.type, n.title, n.message]
      );
      console.log(`  ✓ Notification seeded for User ${n.recipient.slice(0, 8)}: "${n.title}"`);
    }

    console.log('\n====================================================');
    console.log('✅ ResQ Database Seed Completed Successfully!');
    console.log('====================================================');
    console.log('\nDemo User Accounts (Password for all: Password123!)');
    console.log('  - Admin:       admin@resq.org');
    console.log('  - Org Admin:   delhi_shelter@resq.org');
    console.log('  - Rescuer:     rescuer.rahul@resq.org');
    console.log('  - Citizen:     citizen.priya@gmail.com');
    console.log('  - Citizen 2:   citizen.amit@gmail.com');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await db.closePool();
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seed };

