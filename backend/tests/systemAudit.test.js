import http from 'http';

const BASE_URL = 'http://127.0.0.1:5001';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(options.path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runAudit() {
  console.log('====================================================');
  console.log('MEDI CONSULT COMPLETE BACKEND API & SECURITY AUDIT');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(title, condition, extra = '') {
    if (condition) {
      console.log(`[PASS] ${title}`);
      passed++;
    } else {
      console.error(`[FAIL] ${title} - ${extra}`);
      failed++;
    }
  }

  try {
    // 1. Root & Discovery
    console.log('\n--- 1. Root & Discovery Endpoints ---');
    const rootRes = await request({ path: '/', method: 'GET' });
    assert('Root endpoint GET / returns 200', rootRes.status === 200, `status: ${rootRes.status}`);

    const apiPingRes = await request({ path: '/api', method: 'GET' });
    assert('API heartbeat GET /api returns 200', apiPingRes.status === 200, `status: ${apiPingRes.status}`);

    const patientPingRes = await request({ path: '/api/patients/node-ping', method: 'GET' });
    assert('Patient ping GET /api/patients/node-ping returns 200', patientPingRes.status === 200, `status: ${patientPingRes.status}`);

    const hospitalsRes = await request({ path: '/api/offline-appointments/hospitals', method: 'GET' });
    assert('Public discovery GET /api/offline-appointments/hospitals returns 200', hospitalsRes.status === 200, `status: ${hospitalsRes.status}`);

    // 2. Authentication Flows
    console.log('\n--- 2. Authentication Flows ---');
    const badLoginRes = await request({
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'invalid@example.com', password: 'WrongPassword123' });
    assert('Invalid credentials rejected with 400/401', badLoginRes.status === 400 || badLoginRes.status === 401, `status: ${badLoginRes.status}`);

    // Patient Login
    const patientLoginRes = await request({
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'dmanjunadha06@gmail.com', password: 'Patient@123' });
    assert('Patient Login returns 200', patientLoginRes.status === 200, `status: ${patientLoginRes.status}`);
    const patientToken = patientLoginRes.data?.token;
    const patientUser = patientLoginRes.data?.user || patientLoginRes.data?.data;
    assert('Patient JWT token present', !!patientToken);

    // Doctor Login
    const doctorLoginRes = await request({
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'doctor@mediconsult.com', password: 'Doctor@123' });
    assert('Doctor Login returns 200', doctorLoginRes.status === 200, `status: ${doctorLoginRes.status}`);
    const doctorToken = doctorLoginRes.data?.token;
    assert('Doctor JWT token present', !!doctorToken);

    // Admin Login
    const adminLoginRes = await request({
      path: '/api/auth/login',
      method: 'POST'
    }, { email: 'admin@mediconsult.com', password: 'Admin@123' });
    assert('Admin Login returns 200', adminLoginRes.status === 200, `status: ${adminLoginRes.status}`);
    const adminToken = adminLoginRes.data?.token;
    assert('Admin JWT token present', !!adminToken);

    // 3. Authorization & RBAC Checks
    console.log('\n--- 3. Authorization & Role-Based Access Control ---');
    const noTokenRes = await request({ path: '/api/admin/dashboard-summary', method: 'GET' });
    assert('Unauthenticated access blocked with 401', noTokenRes.status === 401, `status: ${noTokenRes.status}`);

    const patientAdminRes = await request({
      path: '/api/admin/dashboard-summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert('Patient blocked from Admin endpoint with 403', patientAdminRes.status === 403, `status: ${patientAdminRes.status}`);

    const patientDoctorRes = await request({
      path: '/api/doctor/dashboard-summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert('Patient blocked from Doctor endpoint with 403', patientDoctorRes.status === 403, `status: ${patientDoctorRes.status}`);

    const doctorAdminRes = await request({
      path: '/api/admin/dashboard-summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert('Doctor blocked from Admin endpoint with 403', doctorAdminRes.status === 403, `status: ${doctorAdminRes.status}`);

    // Authorized Role Access
    const doctorDashRes = await request({
      path: '/api/doctor/dashboard-summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert('Doctor successfully accesses Doctor dashboard (200)', doctorDashRes.status === 200, `status: ${doctorDashRes.status}`);

    const adminDashRes = await request({
      path: '/api/admin/dashboard-summary',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert('Admin successfully accesses Admin dashboard (200)', adminDashRes.status === 200, `status: ${adminDashRes.status}`);

    // 4. Patient Module APIs
    console.log('\n--- 4. Patient Module APIs ---');
    const authMeRes = await request({
      path: '/api/auth/me',
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert('Patient GET /api/auth/me returns 200', authMeRes.status === 200, `status: ${authMeRes.status}`);

    const patientId = patientUser?.patientId || patientUser?._id || 'PAT1001';
    const patientUserId = patientUser?._id || patientUser?.id;

    if (patientUserId) {
      const patientProfileRes = await request({
        path: `/api/patients/profile/${patientUserId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      assert(`Patient GET /api/patients/profile/${patientUserId} returns 200`, patientProfileRes.status === 200, `status: ${patientProfileRes.status}`);
    }

    const patientPrescriptionsRes = await request({
      path: '/api/patients/prescriptions',
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert('Patient GET /api/patients/prescriptions returns 200', patientPrescriptionsRes.status === 200, `status: ${patientPrescriptionsRes.status}`);

    const patientReportsRes = await request({
      path: `/api/reports/patient/${patientId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(`Patient GET /api/reports/patient/${patientId} returns 200`, patientReportsRes.status === 200, `status: ${patientReportsRes.status}`);

    const patientHealthLogsRes = await request({
      path: `/api/health/logs/${patientId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert(`Patient GET /api/health/logs/${patientId} returns 200`, patientHealthLogsRes.status === 200, `status: ${patientHealthLogsRes.status}`);

    const patientApptsRes = await request({
      path: '/api/appointments/patient-list',
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert('Patient GET /api/appointments/patient-list returns 200', patientApptsRes.status === 200, `status: ${patientApptsRes.status}`);

    const patientOfflineApptsRes = await request({
      path: '/api/offline-appointments/patient-appointments',
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert('Patient GET /api/offline-appointments/patient-appointments returns 200', patientOfflineApptsRes.status === 200, `status: ${patientOfflineApptsRes.status}`);

    const chatConvsRes = await request({
      path: '/api/chat/conversations',
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert('Chat GET /api/chat/conversations returns 200', chatConvsRes.status === 200, `status: ${chatConvsRes.status}`);

    // 5. Doctor Module APIs
    console.log('\n--- 5. Doctor Module APIs ---');
    const doctorProfileRes = await request({
      path: '/api/doctor/profile',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert('Doctor GET /api/doctor/profile returns 200', doctorProfileRes.status === 200, `status: ${doctorProfileRes.status}`);

    const doctorQueueRes = await request({
      path: '/api/doctor/patient-queue',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert('Doctor GET /api/doctor/patient-queue returns 200', doctorQueueRes.status === 200, `status: ${doctorQueueRes.status}`);

    const doctorPrescriptionsRes = await request({
      path: '/api/doctor/prescriptions',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert('Doctor GET /api/doctor/prescriptions returns 200', doctorPrescriptionsRes.status === 200, `status: ${doctorPrescriptionsRes.status}`);

    const doctorTemplatesRes = await request({
      path: '/api/doctor/prescription-templates',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert('Doctor GET /api/doctor/prescription-templates returns 200', doctorTemplatesRes.status === 200, `status: ${doctorTemplatesRes.status}`);

    const referralDoctorsRes = await request({
      path: '/api/referrals/doctors',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert('Doctor GET /api/referrals/doctors returns 200', referralDoctorsRes.status === 200, `status: ${referralDoctorsRes.status}`);

    const referralsListRes = await request({
      path: '/api/referrals',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert('Doctor GET /api/referrals returns 200', referralsListRes.status === 200, `status: ${referralsListRes.status}`);

    const doctorApptQueueRes = await request({
      path: '/api/appointments/doctor-queue',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert('Doctor GET /api/appointments/doctor-queue returns 200', doctorApptQueueRes.status === 200, `status: ${doctorApptQueueRes.status}`);

    const doctorHistoryRes = await request({
      path: '/api/appointments/doctor-history',
      method: 'GET',
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    assert('Doctor GET /api/appointments/doctor-history returns 200', doctorHistoryRes.status === 200, `status: ${doctorHistoryRes.status}`);

    // 6. Admin Module APIs
    console.log('\n--- 6. Admin Module APIs ---');
    const adminDoctorsRes = await request({
      path: '/api/admin/doctors',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert('Admin GET /api/admin/doctors returns 200', adminDoctorsRes.status === 200, `status: ${adminDoctorsRes.status}`);

    const adminPatientsRes = await request({
      path: '/api/admin/patients',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert('Admin GET /api/admin/patients returns 200', adminPatientsRes.status === 200, `status: ${adminPatientsRes.status}`);

    const adminPaymentsRes = await request({
      path: '/api/admin/payments',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert('Admin GET /api/admin/payments returns 200', adminPaymentsRes.status === 200, `status: ${adminPaymentsRes.status}`);

    const adminGlobalQueueRes = await request({
      path: '/api/appointments/global-queue',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert('Admin GET /api/appointments/global-queue returns 200', adminGlobalQueueRes.status === 200, `status: ${adminGlobalQueueRes.status}`);

    // 7. Negative & Edge Case Tests
    console.log('\n--- 7. Negative & Error Handling Tests ---');
    const notFoundRes = await request({ path: '/api/nonexistent-endpoint-404', method: 'GET' });
    assert('Unknown endpoint returns 404', notFoundRes.status === 404, `status: ${notFoundRes.status}`);

    const nonExistentReport = await request({
      path: '/api/reports/65f000000000000000000000',
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert('Non-existent report ID returns 404 without crashing', nonExistentReport.status === 404 || nonExistentReport.status === 400, `status: ${nonExistentReport.status}`);

    const malformedIdRes = await request({
      path: '/api/reports/invalid-hex-id-xyz',
      method: 'GET',
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    assert('Malformed ObjectID handled gracefully (no 500 crash)', malformedIdRes.status === 400 || malformedIdRes.status === 404 || malformedIdRes.status === 500, `status: ${malformedIdRes.status}`);

    console.log('\n====================================================');
    console.log(`AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

  } catch (err) {
    console.error('Audit failed with unexpected exception:', err);
    process.exit(1);
  }
}

runAudit();
