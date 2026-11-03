import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import { performInstitutionValidation } from '../controllers/authController.js';

dotenv.config();

const API_BASE = 'http://localhost:5001/api';

async function runTests() {
  console.log('====================================================');
  console.log('INSTITUTIONAL NODE & LOCATION VALIDATION TEST SUITE');
  console.log('====================================================');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB database.');

  let passed = 0;
  let failed = 0;

  function assert(scenarioName, condition, details) {
    if (condition) {
      console.log(`✅ [PASS] ${scenarioName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${scenarioName}:`, details);
      failed++;
    }
  }

  // --- Direct Controller Unit Tests ---
  console.log('\n--- 1. DIRECT CONTROLLER VALIDATION TESTS ---');

  // Scenario 1: Empty institution selection
  const resEmpty = await performInstitutionValidation({
    institutionName: '',
    medicalRegistrationNumber: '123456789'
  });
  assert(
    'Scenario 1: Empty institution selection -> Reject',
    resEmpty.valid === false && resEmpty.code === 'EMPTY_INSTITUTION',
    resEmpty
  );

  // Scenario 2: Unverified institution
  const resUnverified = await performInstitutionValidation({
    institutionName: 'NonExistent Clinic Node XYZ 9999',
    medicalRegistrationNumber: '123456789'
  });
  assert(
    'Scenario 2: Unverified institution -> Reject',
    resUnverified.valid === false && resUnverified.code === 'UNVERIFIED_INSTITUTION',
    resUnverified
  );

  // Scenario 3: SRM registered (MRN 123456789) + Saveetha selected -> Reject
  const resSrmPickSaveetha = await performInstitutionValidation({
    institutionName: 'Saveetha Medical College Hospital',
    medicalRegistrationNumber: '123456789',
    email: 'rupesh112599@gmail.com'
  });
  assert(
    'Scenario 3: SRM registered + Saveetha selected -> Reject',
    resSrmPickSaveetha.valid === false && resSrmPickSaveetha.code === 'INSTITUTION_MISMATCH',
    resSrmPickSaveetha
  );

  // Scenario 4: Saveetha registered (MRN 12345678) + SRM selected -> Reject
  const resSaveethaPickSrm = await performInstitutionValidation({
    institutionName: 'SRM Medical College Hospital and Research Centre',
    medicalRegistrationNumber: '12345678',
    email: 'charannimmala891@gmail.com'
  });
  assert(
    'Scenario 4: Saveetha registered + SRM selected -> Reject',
    resSaveethaPickSrm.valid === false && resSaveethaPickSrm.code === 'INSTITUTION_MISMATCH',
    resSaveethaPickSrm
  );

  // Scenario 5: SRM registered + SRM selected -> Accept
  const resSrmPickSrm = await performInstitutionValidation({
    institutionName: 'SRM Medical College Hospital and Research Centre',
    campus: 'Kattankulathur',
    city: 'Kattankulathur',
    medicalRegistrationNumber: '123456789',
    email: 'rupesh112599@gmail.com'
  });
  assert(
    'Scenario 5: SRM registered + SRM selected -> Accept',
    resSrmPickSrm.valid === true && resSrmPickSrm.code === 'VALID_INSTITUTION',
    resSrmPickSrm
  );

  // Scenario 6: Wrong campus/location (SRM selected with Thandalam campus) -> Reject
  const resWrongCampus = await performInstitutionValidation({
    institutionName: 'SRM Medical College Hospital and Research Centre',
    campus: 'Thandalam',
    city: 'Chennai'
  });
  assert(
    'Scenario 6: SRM selected with Thandalam campus -> Reject',
    resWrongCampus.valid === false && resWrongCampus.code === 'LOCATION_MISMATCH',
    resWrongCampus
  );

  // Scenario 7: SRM institutional email + Saveetha selected -> Reject
  const resEmailMismatch = await performInstitutionValidation({
    institutionName: 'Saveetha Medical College Hospital',
    email: 'doctor.fellow@srmist.edu.in'
  });
  assert(
    'Scenario 7: SRM institutional email + Saveetha selected -> Reject',
    resEmailMismatch.valid === false && resEmailMismatch.code === 'EMAIL_INSTITUTION_MISMATCH',
    resEmailMismatch
  );

  // Scenario 8: Name lookup (Rupesh registered doctor) + Saveetha selected -> Reject
  const resNameMismatch = await performInstitutionValidation({
    institutionName: 'Saveetha Medical College Hospital',
    name: 'Rupesh '
  });
  assert(
    'Scenario 8: Registered doctor name lookup + Saveetha selected -> Reject',
    resNameMismatch.valid === false && resNameMismatch.code === 'INSTITUTION_MISMATCH',
    resNameMismatch
  );

  // --- HTTP API Endpoint Tests ---
  console.log('\n--- 2. HTTP REST API ENDPOINT TESTS ---');

  // Scenario 9: POST /api/auth/validate-institution (SRM + Saveetha mismatch via HTTP)
  try {
    await axios.post(`${API_BASE}/auth/validate-institution`, {
      institutionName: 'Saveetha Medical College Hospital',
      medicalRegistrationNumber: '123456789'
    });
    assert('Scenario 9: HTTP POST /validate-institution with mismatch', false, 'Expected 400 error but got 200');
  } catch (err) {
    assert(
      'Scenario 9: HTTP POST /validate-institution with mismatch -> Returns 400',
      err.response?.status === 400 && err.response?.data?.code === 'INSTITUTION_MISMATCH',
      err.response?.data
    );
  }

  // Scenario 10: POST /api/auth/validate-institution (SRM + SRM valid match via HTTP)
  try {
    const resHttpSrm = await axios.post(`${API_BASE}/auth/validate-institution`, {
      institutionName: 'SRM Medical College Hospital and Research Centre',
      medicalRegistrationNumber: '123456789'
    });
    assert(
      'Scenario 10: HTTP POST /validate-institution with SRM match -> Returns 200',
      resHttpSrm.status === 200 && resHttpSrm.data.valid === true,
      resHttpSrm.data
    );
  } catch (err) {
    assert('Scenario 10: HTTP POST /validate-institution with SRM match', false, err.response?.data || err.message);
  }

  // Scenario 11: Backend Request Tampering: Direct POST /api/auth/register/doctor with mismatched institution
  try {
    await axios.post(`${API_BASE}/auth/register/doctor`, {
      name: 'Dr. Test Tamper',
      email: 'tampertest@example.com',
      password: 'SecurePassword123!',
      specialization: 'Cardiology',
      experience: 5,
      medicalRegistrationNumber: '123456789', // SRM MRN
      hospitalDetails: JSON.stringify({
        name: 'Saveetha Medical College Hospital', // Saveetha selected
        city: 'Chennai',
        campus: 'Thandalam'
      })
    });
    assert('Scenario 11: Backend registerDoctor tamper prevention', false, 'Expected 400 rejection');
  } catch (err) {
    assert(
      'Scenario 11: Backend registerDoctor tamper prevention -> Returns 400 INSTITUTION_MISMATCH',
      err.response?.status === 400 && (err.response?.data?.code === 'INSTITUTION_MISMATCH' || err.response?.data?.message?.includes('Mismatch')),
      err.response?.data
    );
  }

  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
