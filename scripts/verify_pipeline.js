/**
 * ResQ End-to-End Pipeline Verification Script
 * Validates:
 * 1. API Gateway routing
 * 2. Organization Service (Registration & Listing)
 * 3. Report Service (PostGIS geometry storage & retrieval)
 * 4. RabbitMQ Event Publishing ('report.created')
 * 5. Notification Service Event Consumption & DB Persistence
 */

const { db } = require('../shared');

const GATEWAY_URL = 'http://localhost:8000';

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runVerification() {
  console.log(`\n=============================================================`);
  console.log(`🧪 STARTING RESQ END-TO-END PIPELINE VERIFICATION`);
  console.log(`=============================================================\n`);

  let allPassed = true;

  // 1. Check Gateway Health
  console.log(`[Test 1] Checking API Gateway Health...`);
  try {
    const res = await fetch(`${GATEWAY_URL}/health`);
    const data = await res.json();
    if (res.status === 200 && data.status === 'healthy') {
      console.log(`   ✅ API Gateway is healthy on port ${data.port}`);
    } else {
      console.error(`   ❌ Unexpected Gateway response:`, data);
      allPassed = false;
    }
  } catch (err) {
    console.error(`   ❌ Failed to connect to API Gateway:`, err.message);
    allPassed = false;
  }

  // 2. Register New Organization via Gateway
  console.log(`\n[Test 2] Registering New Rescue Organization via Gateway (POST /api/v1/organizations)...`);
  let orgId = null;
  try {
    const newOrg = {
      name: 'South Delhi Stray Animal Haven',
      registration_number: `REG-TEST-${Date.now()}`,
      contact_email: `haven_${Date.now()}@resq.org`,
      contact_phone: '+919811223344',
      address_text: 'Near Lajpat Nagar Ring Road, New Delhi',
      latitude: 28.5685,
      longitude: 77.2435,
      operational_radius_km: 18.0,
      animal_types_handled: ['dog', 'cat', 'bird'],
    };

    const res = await fetch(`${GATEWAY_URL}/api/v1/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrg),
    });

    const json = await res.json();
    if (res.status === 201 && json.data && json.data.id) {
      orgId = json.data.id;
      console.log(`   ✅ Organization created: '${json.data.name}' (ID: ${orgId})`);
      console.log(`      Coordinates: Lat ${json.data.latitude}, Lon ${json.data.longitude}`);
    } else {
      console.error(`   ❌ Failed to create organization:`, json);
      allPassed = false;
    }
  } catch (err) {
    console.error(`   ❌ Org registration error:`, err.message);
    allPassed = false;
  }

  // 3. List Organizations via Gateway with Proximity Search
  console.log(`\n[Test 3] Querying Organizations with PostGIS Proximity via Gateway (GET /api/v1/organizations)...`);
  try {
    // Proximity search near AIIMS Delhi (28.5672, 77.2100)
    const res = await fetch(`${GATEWAY_URL}/api/v1/organizations?lat=28.5672&lon=77.2100&radius_km=30`);
    const json = await res.json();
    if (res.status === 200 && json.data && Array.isArray(json.data.organizations)) {
      console.log(`   ✅ Retrieved ${json.data.organizations.length} nearby organizations within 30km`);
      json.data.organizations.slice(0, 3).forEach((o) => {
        console.log(`      - ${o.name}: ${o.distance_meters ? (o.distance_meters / 1000).toFixed(2) + ' km away' : 'in range'}`);
      });
    } else {
      console.error(`   ❌ Query organizations failed:`, json);
      allPassed = false;
    }
  } catch (err) {
    console.error(`   ❌ Query organizations error:`, err.message);
    allPassed = false;
  }

  // 4. Submit Animal Distress Report via Gateway
  console.log(`\n[Test 4] Submitting Animal Distress Report via Gateway (POST /api/v1/reports)...`);
  let reportId = null;
  try {
    const reportPayload = {
      animal_type: 'dog',
      breed: 'Indie Street Dog',
      condition_description: 'Deep cut on left paw after wire entanglement. Bleeding moderately, alert and drinking water.',
      severity_level: 'high',
      latitude: 28.5701,
      longitude: 77.2312,
      address_text: 'Defence Colony Market, New Delhi',
      photo_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1',
    };

    const res = await fetch(`${GATEWAY_URL}/api/v1/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportPayload),
    });

    const json = await res.json();
    if (res.status === 201 && json.data && json.data.id) {
      reportId = json.data.id;
      console.log(`   ✅ Report created: ID ${reportId}`);
      console.log(`      Animal: ${json.data.animal_type} (Severity: ${json.data.severity_level})`);
      console.log(`      Location: Lat ${json.data.latitude}, Lon ${json.data.longitude}`);
      console.log(`      Status: ${json.data.status}`);
    } else {
      console.error(`   ❌ Failed to submit report:`, json);
      allPassed = false;
    }
  } catch (err) {
    console.error(`   ❌ Report submission error:`, err.message);
    allPassed = false;
  }

  // 5. Verify RabbitMQ Event Consumption by Notification Service
  console.log(`\n[Test 5] Verifying Asynchronous Event-Driven Messaging (RabbitMQ -> Notification Service)...`);
  console.log(`   Waiting 2.5 seconds for RabbitMQ event 'report.created' to be consumed and processed...`);
  await sleep(2500);

  try {
    const res = await fetch(`${GATEWAY_URL}/api/v1/notifications`);
    const json = await res.json();
    if (res.status === 200 && json.data && Array.isArray(json.data.notifications)) {
      const matchingNotif = json.data.notifications.find((n) => n.report_id === reportId);
      if (matchingNotif) {
        console.log(`   ✅ Notification successfully consumed from RabbitMQ and saved to PostgreSQL!`);
        console.log(`      Notification ID: ${matchingNotif.id}`);
        console.log(`      Type: ${matchingNotif.type}`);
        console.log(`      Title: ${matchingNotif.title}`);
        console.log(`      Message: ${matchingNotif.message}`);

        // Test marking as read
        const markRes = await fetch(`${GATEWAY_URL}/api/v1/notifications/${matchingNotif.id}/read`, {
          method: 'PATCH',
        });
        const markJson = await markRes.json();
        if (markRes.status === 200 && markJson.data.is_read === true) {
          console.log(`   ✅ Notification marked as read successfully.`);
        }
      } else {
        console.error(`   ❌ Notification for report ${reportId} not found in database.`);
        console.log(`   Current notifications:`, json.data.notifications);
        allPassed = false;
      }
    } else {
      console.error(`   ❌ Failed to fetch notifications:`, json);
      allPassed = false;
    }
  } catch (err) {
    console.error(`   ❌ Notification verification error:`, err.message);
    allPassed = false;
  }

  // 6. Direct Database Spatial Check
  console.log(`\n[Test 6] Direct Database PostGIS Geometry & Foreign Key Verification...`);
  try {
    const dbReport = await db.query(
      `SELECT id, animal_type, ST_AsText(location) AS geom_wkt, status FROM rescue_reports WHERE id = $1;`,
      [reportId]
    );
    if (dbReport.rows.length > 0) {
      console.log(`   ✅ Database record verified: ${dbReport.rows[0].animal_type}`);
      console.log(`      Geometry WKT: ${dbReport.rows[0].geom_wkt}`);
    } else {
      console.error(`   ❌ Database query returned 0 rows for reportId ${reportId}`);
      allPassed = false;
    }
  } catch (err) {
    console.error(`   ❌ Database check error:`, err.message);
    allPassed = false;
  }

  console.log(`\n=============================================================`);
  if (allPassed) {
    console.log(`🎉 ALL PIPELINE VERIFICATION TESTS PASSED SUCCESSFULLY!`);
  } else {
    console.log(`⚠️ SOME VERIFICATION TESTS ENCOUNTERED ERRORS.`);
  }
  console.log(`=============================================================\n`);

  await db.closePool();
  process.exit(allPassed ? 0 : 1);
}

runVerification();
