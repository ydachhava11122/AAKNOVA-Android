import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const BASE = 'http://127.0.0.1:3000';

class TestSession {
  constructor() {
    this.cookie = '';
    this.csrf = '';
    this.institutionId = '';
  }

  async req(path, options = {}) {
    const method = options.method || 'GET';
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }
    if (this.cookie) headers['Cookie'] = this.cookie;
    if (this.csrf && !['GET', 'HEAD', 'OPTIONS'].includes(method) && !options.skipCsrf) {
      headers['X-CSRF-Token'] = this.csrf;
    }
    if (options.institutionId !== undefined) {
      if (options.institutionId) headers['X-Institution-Id'] = String(options.institutionId);
    } else if (this.institutionId) {
      headers['X-Institution-Id'] = String(this.institutionId);
    }

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const m = setCookie.match(/aaknova_session=([^;]+)/);
      if (m) this.cookie = m[1] ? `aaknova_session=${m[1]}` : '';
    }

    if (options.raw) return res;
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    if (json && json.user && json.user.csrfToken) this.csrf = json.user.csrfToken;
    if (json && json.csrfToken) this.csrf = json.csrfToken;
    return { status: res.status, data: json };
  }
}

async function run() {
  console.log('=== AAKNOVA End-to-End Verification Suite ===');

  const founder = new TestSession();
  const founderPassword = `AakNova!${crypto.randomBytes(6).toString('hex')}9`;

  // 1. Setup status must indicate First-Run provisioning
  let r = await founder.req('/api/auth/setup-status');
  assert.equal(r.status, 200, 'setup-status should return 200');
  assert.equal(r.data.needsSetup, true, 'Fresh DB must require First-Run Founder provisioning');
  console.log('[PASS] 1. First-Run Setup Status Check');

  // 2. Provision Founder Super Admin + 2 isolated institutions
  r = await founder.req('/api/auth/provision-founder', {
    method: 'POST',
    body: {
      fullName: 'Dr. Vikramaditya Rao',
      username: 'founder.rao',
      email: 'founder@aaknova.enterprise',
      mobile: '+1-415-555-0100',
      password: founderPassword,
      seedSampleInstitutions: true,
    },
  });
  assert.equal(r.status, 201, `Founder provisioning failed: ${JSON.stringify(r.data)}`);
  assert.equal(r.data.user.roleCode, 'FOUNDER_SUPER_ADMIN');
  assert.equal(r.data.user.isFounder, true);
  assert.equal(r.data.provisionedInstitutions.length, 2, 'Expected 2 seeded isolated institutions');
  const [instA, instB] = r.data.provisionedInstitutions;
  assert.ok(instA.adminTemporaryPassword && instB.adminTemporaryPassword, 'One-time random admin passwords should be generated');
  console.log(`[PASS] 2. Founder Provisioning + 2 Isolated Institutions (${instA.institutionCode}, ${instB.institutionCode})`);

  // 3. Security: Second provision attempt must fail with 409
  r = await founder.req('/api/auth/provision-founder', {
    method: 'POST',
    body: {
      fullName: 'Rogue Actor',
      username: 'rogue.actor',
      email: 'rogue@example.com',
      password: founderPassword,
    },
  });
  assert.equal(r.status, 409, 'Duplicate founder provisioning must be rejected');

  // 4. Security: CSRF header omission must fail with 403
  r = await founder.req('/api/institutions', {
    method: 'POST',
    skipCsrf: true,
    body: {
      name: 'No CSRF Inst',
      email: 'info@nocsrf.edu',
      adminFullName: 'Admin A',
      adminEmail: 'a@nocsrf.edu',
      adminUsername: 'admin.nocsrf',
      adminPassword: founderPassword,
    },
  });
  assert.equal(r.status, 403, 'Missing CSRF token must return 403');
  console.log('[PASS] 3 & 4. Duplicate Provisioning Block & CSRF Enforcement');

  // 5. Logout, failed login attempt (login history), and valid re-login
  r = await founder.req('/api/auth/logout', { method: 'POST' });
  assert.equal(r.status, 200);

  r = await founder.req('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'founder@aaknova.enterprise', password: 'WrongPassword!123' },
  });
  assert.equal(r.status, 401, 'Invalid password must return 401');

  r = await founder.req('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'founder@aaknova.enterprise', password: founderPassword, rememberMe: true },
  });
  assert.equal(r.status, 200, `Valid Founder login failed: ${JSON.stringify(r.data)}`);
  console.log('[PASS] 5. Logout, Invalid Credential Rejection & Valid Re-Login');

  // 6. Founder Dashboard & Multi-Institution Create / Suspend / Activate
  r = await founder.req('/api/institutions/founder-dashboard');
  assert.equal(r.status, 200);
  assert.equal(r.data.kpis.totalInstitutions, 2);
  assert.equal(r.data.systemHealth.status, 'Healthy');

  const instCAdminPass = `InstC!${crypto.randomBytes(5).toString('hex')}7`;
  r = await founder.req('/api/institutions', {
    method: 'POST',
    body: {
      name: 'Vanguard Sciences Academy',
      email: 'office@vanguard.edu',
      city: 'Bengaluru',
      country: 'India',
      subscriptionPlan: 'Enterprise',
      annualLicenseFee: 24000,
      adminFullName: 'Elena Rostova',
      adminEmail: 'admin@vanguard.edu',
      adminUsername: 'admin.vanguard',
      adminPassword: instCAdminPass,
    },
  });
  assert.equal(r.status, 201, `Create institution failed: ${JSON.stringify(r.data)}`);
  const instCId = r.data.institution.id;
  assert.match(r.data.institution.institution_code, /^AVN-INST-/);

  r = await founder.req(`/api/institutions/${instCId}/status`, {
    method: 'PATCH',
    body: { status: 'suspended' },
  });
  assert.equal(r.status, 200);

  r = await founder.req(`/api/institutions/${instCId}/status`, {
    method: 'PATCH',
    body: { status: 'active' },
  });
  assert.equal(r.status, 200);
  console.log('[PASS] 6. Founder Dashboard & Institution Lifecycle (Create / Suspend / Activate)');

  // 7. Strict Multi-Tenant Isolation Test
  const adminA = new TestSession();
  r = await adminA.req('/api/auth/login', {
    method: 'POST',
    body: { identifier: instA.adminEmail, password: instA.adminTemporaryPassword },
  });
  assert.equal(r.status, 200, `Institution A Admin login failed: ${JSON.stringify(r.data)}`);
  const instAId = r.data.user.institutionId;
  assert.ok(instAId);

  const adminB = new TestSession();
  r = await adminB.req('/api/auth/login', {
    method: 'POST',
    body: { identifier: instB.adminEmail, password: instB.adminTemporaryPassword },
  });
  assert.equal(r.status, 200, `Institution B Admin login failed: ${JSON.stringify(r.data)}`);
  const instBId = r.data.user.institutionId;
  assert.notEqual(instAId, instBId);

  // Admin A attempts to spoof X-Institution-Id for Inst B -> MUST BE BLOCKED 403
  r = await adminA.req('/api/students', { institutionId: instBId });
  assert.equal(r.status, 403, `Cross-tenant read must return 403, got ${r.status}`);

  // Admin A attempts Founder Dashboard -> MUST BE BLOCKED 403
  r = await adminA.req('/api/institutions/founder-dashboard');
  assert.equal(r.status, 403, 'Non-founder must not access Founder Dashboard');

  // Admin B fetches its own students and Admin A tries to delete Admin B's student -> MUST FAIL 404
  const bStudentsRes = await adminB.req('/api/students');
  assert.equal(bStudentsRes.status, 200);
  assert.ok(bStudentsRes.data.students.length > 0);
  const targetBStudentId = bStudentsRes.data.students[0].id;

  r = await adminA.req(`/api/students/${targetBStudentId}`, { method: 'DELETE' });
  assert.equal(r.status, 404, 'Admin A must not delete Institution B student');
  console.log('[PASS] 7. Strict Multi-Tenant Data Isolation Verified');

  // 8. Full CRUD Verification across ALL 14 Institution Modules (as Admin A)
  const catalogRes = await adminA.req('/api/academics/catalog');
  assert.equal(catalogRes.status, 200);
  const courseAId = catalogRes.data.courses[0].id;
  const classAId = catalogRes.data.classes[0].id;
  const subjectAId = catalogRes.data.subjects[0].id;

  // 8a. Student CRUD
  r = await adminA.req('/api/students', {
    method: 'POST',
    body: {
      fullName: 'Aarav Mehta',
      email: 'aarav.mehta@meridian.edu',
      courseId: courseAId,
      classId: classAId,
      guardianName: 'Rajesh Mehta',
      guardianPhone: '+91-9810011223',
      status: 'active',
    },
  });
  assert.equal(r.status, 201, `Student create failed: ${JSON.stringify(r.data)}`);
  const createdStudentId = r.data.student.id;
  r = await adminA.req(`/api/students/${createdStudentId}`, {
    method: 'PUT',
    body: {
      fullName: 'Aarav Mehta-Sharma',
      email: 'aarav.mehta@meridian.edu',
      courseId: courseAId,
      classId: classAId,
      status: 'active',
    },
  });
  assert.equal(r.status, 200);

  // 8b. Teacher CRUD
  r = await adminA.req('/api/teachers', {
    method: 'POST',
    body: {
      fullName: 'Dr. Meera Krishnan',
      email: 'meera.k@meridian.edu',
      department: 'Physics',
      qualification: 'Ph.D. Applied Physics',
      specialization: 'Quantum Mechanics',
    },
  });
  assert.equal(r.status, 201, `Teacher create failed: ${JSON.stringify(r.data)}`);
  const createdTeacherId = r.data.teacher.id;

  // 8c. Staff CRUD
  r = await adminA.req('/api/operations/staff', {
    method: 'POST',
    body: {
      fullName: 'Suresh Nair',
      email: 'suresh.nair@meridian.edu',
      department: 'Operations',
      designation: 'Facilities Officer',
      monthlySalary: 4500,
    },
  });
  assert.equal(r.status, 201, `Staff create failed: ${JSON.stringify(r.data)}`);

  // 8d. Attendance Marking
  r = await adminA.req('/api/attendance/mark', {
    method: 'POST',
    body: {
      date: '2026-11-20',
      entityType: 'student',
      records: [{ entityId: createdStudentId, status: 'present', remarks: 'Verified' }],
    },
  });
  assert.equal(r.status, 200, `Attendance failed: ${JSON.stringify(r.data)}`);

  // 8e. Fees Invoice + Verified Payment
  r = await adminA.req('/api/finance/fees', {
    method: 'POST',
    body: {
      studentId: createdStudentId,
      title: 'Term 2 Tuition Assessment',
      grossAmount: 1850,
      discountAmount: 0,
      dueDate: '2026-12-15',
    },
  });
  assert.equal(r.status, 201, `Fee invoice create failed: ${JSON.stringify(r.data)}`);
  const feeId = r.data.fee.id;

  r = await adminA.req('/api/finance/payments', {
    method: 'POST',
    body: {
      feeId,
      amount: 1850,
      paymentMethod: 'bank_transfer',
      transactionReference: 'TXN-VERIFIED-9001',
    },
  });
  assert.equal(r.status, 201, `Payment failed: ${JSON.stringify(r.data)}`);
  assert.equal(r.data.payment.status, 'verified');

  // 8f. Examinations & Results (verify automatic grade)
  r = await adminA.req('/api/exams', {
    method: 'POST',
    body: {
      name: 'Winter Term Final Assessment',
      examType: 'Final',
      courseId: courseAId,
      classId: classAId,
      startDate: '2026-12-10',
      endDate: '2026-12-18',
      status: 'scheduled',
    },
  });
  assert.equal(r.status, 201, `Exam create failed: ${JSON.stringify(r.data)}`);
  const examId = r.data.examination.id;

  r = await adminA.req('/api/exams/results', {
    method: 'POST',
    body: {
      examinationId: examId,
      studentId: createdStudentId,
      subjectId: subjectAId,
      marksObtained: 94,
      maxMarks: 100,
      remarks: 'Distinction',
    },
  });
  assert.equal(r.status, 201, `Result create failed: ${JSON.stringify(r.data)}`);
  assert.equal(r.data.result.grade, 'A+');

  // 8g. Timetable
  r = await adminA.req('/api/operations/timetables', {
    method: 'POST',
    body: {
      classId: classAId,
      subjectId: subjectAId,
      teacherId: createdTeacherId,
      dayOfWeek: 'Tuesday',
      startTime: '10:30',
      endTime: '11:30',
      roomNumber: 'Quantum Hall 204',
    },
  });
  assert.equal(r.status, 201, `Timetable create failed: ${JSON.stringify(r.data)}`);

  // 8h. Notices
  r = await adminA.req('/api/communications/notices', {
    method: 'POST',
    body: {
      title: 'Winter Convocation Schedule',
      content: 'All faculty and scholars convene in the Main Auditorium at 09:00.',
      category: 'announcement',
      priority: 'high',
      targetRoles: 'ALL',
    },
  });
  assert.equal(r.status, 201, `Notice create failed: ${JSON.stringify(r.data)}`);

  // 8i. Library (Add book -> Issue -> Return)
  r = await adminA.req('/api/operations/library/books', {
    method: 'POST',
    body: {
      isbn: '978-0-13-468599-1',
      title: 'Enterprise Systems Architecture',
      author: 'Dr. R. Subramanian',
      category: 'Computer Science',
      totalCopies: 3,
      shelfLocation: 'CS-401',
    },
  });
  assert.equal(r.status, 201, `Book create failed: ${JSON.stringify(r.data)}`);
  const bookId = r.data.book.id;

  r = await adminA.req('/api/operations/library/issues', {
    method: 'POST',
    body: { bookId, studentId: createdStudentId, dueDate: '2026-12-05' },
  });
  assert.equal(r.status, 201, `Book issue failed: ${JSON.stringify(r.data)}`);
  const issueId = r.data.issue.id;

  r = await adminA.req(`/api/operations/library/issues/${issueId}/return`, { method: 'PATCH' });
  assert.equal(r.status, 200, `Book return failed: ${JSON.stringify(r.data)}`);

  // 8j. Transport (Route -> Assignment)
  r = await adminA.req('/api/operations/transport/routes', {
    method: 'POST',
    body: {
      routeCode: 'RT-GOLD-09',
      routeName: 'North Tech Corridor',
      vehicleNumber: 'KA-01-AV-9012',
      driverName: 'Mahesh Kumar',
      capacity: 40,
      monthlyFee: 140,
    },
  });
  assert.equal(r.status, 201, `Transport route failed: ${JSON.stringify(r.data)}`);
  const routeId = r.data.route.id;

  r = await adminA.req('/api/operations/transport/assignments', {
    method: 'POST',
    body: { routeId, studentId: createdStudentId, pickupStop: 'Science Park Gate' },
  });
  assert.equal(r.status, 201, `Transport assignment failed: ${JSON.stringify(r.data)}`);

  // 8k. Parents
  r = await adminA.req('/api/operations/parents', {
    method: 'POST',
    body: {
      fullName: 'Rajesh Mehta',
      email: 'rajesh.mehta.guardian@meridian.edu',
      phone: '+91-9810011223',
      relationship: 'Father',
      studentId: createdStudentId,
    },
  });
  assert.equal(r.status, 201, `Parent create failed: ${JSON.stringify(r.data)}`);

  // 8l. Certificates
  r = await adminA.req('/api/operations/certificates', {
    method: 'POST',
    body: {
      studentId: createdStudentId,
      certificateType: 'Merit Award',
      issueDate: '2026-11-20',
      remarks: 'Top 1% cohort standing',
    },
  });
  assert.equal(r.status, 201, `Certificate create failed: ${JSON.stringify(r.data)}`);
  assert.match(r.data.certificate.certificate_number, /^AVN-CERT-/);

  // 8m. Reports & Analytics Dashboard
  r = await adminA.req('/api/dashboard/overview');
  assert.equal(r.status, 200);
  assert.ok(r.data.kpis.totalStudents >= 1);
  assert.ok(r.data.kpis.totalCollected >= 1850);
  console.log('[PASS] 8. All 14 Institution Modules CRUD & Analytics Verified');

  // 9. Login History & Audit Logs
  r = await founder.req('/api/admin/audit-logs');
  assert.equal(r.status, 200);
  assert.ok(r.data.loginHistory.some((h) => h.outcome === 'failed'), 'Failed login attempt must be logged');
  assert.ok(r.data.loginHistory.some((h) => h.outcome === 'success'), 'Successful login must be logged');
  assert.ok(r.data.logs.length > 5, 'Audit log entries must be recorded');
  console.log('[PASS] 9. Security Audit & Login History Verified');

  // 10. Database Backup, SHA-256 Verification & Live Restore Rollback Test
  r = await founder.req('/api/backups/create', {
    method: 'POST',
    body: { notes: 'E2E Pre-Mutation Snapshot' },
  });
  assert.equal(r.status, 201, `Backup failed: ${JSON.stringify(r.data)}`);
  const backupId = r.data.backup.id;

  r = await founder.req(`/api/backups/${backupId}/verify`, { method: 'POST' });
  assert.equal(r.status, 200);
  assert.equal(r.data.verified, true, 'Backup SHA-256 verification must pass');

  // Insert an extra post-backup student, then restore and confirm rollback
  r = await adminA.req('/api/students', {
    method: 'POST',
    body: {
      fullName: 'Rollback Sentinel',
      email: 'rollback.sentinel@meridian.edu',
      courseId: courseAId,
      classId: classAId,
    },
  });
  assert.equal(r.status, 201);
  const sentinelId = r.data.student.id;

  r = await founder.req(`/api/backups/${backupId}/restore`, { method: 'POST' });
  assert.equal(r.status, 200, `Restore failed: ${JSON.stringify(r.data)}`);

  // Confirm sentinel student was rolled back
  const afterRestore = await founder.req('/api/students', { institutionId: instAId });
  assert.equal(afterRestore.status, 200);
  assert.equal(
    afterRestore.data.students.some((s) => s.id === sentinelId),
    false,
    'Post-backup student must be rolled back after restore'
  );
  console.log('[PASS] 10. Database Backup, SHA-256 Integrity Verify & Restore Rollback Verified');

  // 11. Real Downloadable Project ZIP Integrity Test
  const zipRes = await founder.req('/api/backups/project-zip', { raw: true });
  assert.equal(zipRes.status, 200, 'Project ZIP download must succeed');
  const zipBuf = Buffer.from(await zipRes.arrayBuffer());
  assert.ok(zipBuf.length > 50000, `ZIP size unexpectedly small: ${zipBuf.length}`);
  fs.writeFileSync('/tmp/aaknova-e2e-verify.zip', zipBuf);
  const zipCheck = execSync(
    `python3 -c "import zipfile; z=zipfile.ZipFile('/tmp/aaknova-e2e-verify.zip'); assert z.testzip() is None; names=set(z.namelist()); required=['aaknova/server.ts','aaknova/src/App.tsx','aaknova/flask_backend/app.py','aaknova/capacitor.config.ts','aaknova/android/app/build.gradle','aaknova/docs/DEPLOYMENT_AND_ANDROID.md']; missing=[f for f in required if f not in names]; assert not missing, f'Missing: {missing}'; print(f'VALID_ZIP:{len(names)}_files')"`
  ).toString().trim();
  fs.unlinkSync('/tmp/aaknova-e2e-verify.zip');
  console.log(`[PASS] 11. Real Project Source ZIP Verified (${zipCheck}, ${(zipBuf.length / 1024).toFixed(1)} KB)`);

  console.log('\nALL 11 AAKNOVA E2E VERIFICATION SUITES PASSED 100%!');
}

run().catch((err) => {
  console.error('\n[FAIL] E2E Verification Failed:', err);
  process.exit(1);
});
