/**
 * test-endpoints.js — Automated test suite for backend API endpoints
 * Tests health check, auth, news, gallery, faculty, admissions, contact, and alumni.
 */
const http = require('http');
const { initDatabase } = require('../src/config/database');
const app = require('../src/app');

async function runTests() {
  console.log('\n========================================');
  console.log('  EDUSPHERE BACKEND API TEST SUITE');
  console.log('========================================\n');

  await initDatabase();

  // Start test server on random high port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(5099, resolve));
  const baseUrl = 'http://localhost:5099/api';
  console.log(`[TEST SERVER] Running on ${baseUrl}\n`);

  let passed = 0;
  let failed = 0;
  let adminToken = '';

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ? PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ? FAIL: ${name} ->`, err.message);
      failed++;
    }
  }

  // 1. Health check
  await test('GET /health (SQLite Connection)', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const json = await res.json();
    if (res.status !== 200 || !json.data || json.data.status !== 'healthy') {
      throw new Error(`Unexpected response: ${JSON.stringify(json)}`);
    }
    if (json.data.database.connected !== true) {
      throw new Error('Database not connected');
    }
  });

  // 2. Admin Auth Login
  await test('POST /auth/login (Admin Credentials)', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@edusphere.app', password: 'Admin@123' }),
    });
    const json = await res.json();
    if (res.status !== 200 || !json.data || !json.data.token) {
      throw new Error(`Auth failed: ${JSON.stringify(json)}`);
    }
    adminToken = json.data.token;
  });

  // 3. Admin Auth Verify
  await test('GET /auth/verify (JWT Token Validation)', async () => {
    const res = await fetch(`${baseUrl}/auth/verify`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const json = await res.json();
    if (res.status !== 200 || !json.data || !json.data.valid) {
      throw new Error(`Token verification failed: ${JSON.stringify(json)}`);
    }
  });

  // 4. Announcements
  await test('GET /news/announcements (Seeded announcements)', async () => {
    const res = await fetch(`${baseUrl}/news/announcements`);
    const json = await res.json();
    if (res.status !== 200 || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error(`Expected announcements array, got: ${JSON.stringify(json)}`);
    }
  });

  // 5. Ticker
  await test('GET /ticker (News ticker items)', async () => {
    const res = await fetch(`${baseUrl}/ticker`);
    const json = await res.json();
    if (res.status !== 200 || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error(`Expected ticker array, got: ${JSON.stringify(json)}`);
    }
  });

  // 6. Faculty
  await test('GET /faculty (Public Faculty list with photoUrl)', async () => {
    const res = await fetch(`${baseUrl}/faculty`);
    const json = await res.json();
    if (res.status !== 200 || !Array.isArray(json.data)) {
      throw new Error(`Expected faculty array, got: ${JSON.stringify(json)}`);
    }
  });

  // 7. Admission Enquiry Form
  await test('POST /admissions (Public enquiry submission)', async () => {
    const res = await fetch(`${baseUrl}/admissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentName: 'Aarav Sharma',
        parentName: 'Rohan Sharma',
        email: 'rohan.sharma@example.com',
        phone: '9876543210',
        dob: '2018-05-15',
        classApplied: '1',
        message: 'Looking for Class 1 admission for academic year 2026-27.',
      }),
    });
    const json = await res.json();
    if (res.status !== 201 || !json.data || !json.data.id) {
      throw new Error(`Admission submit failed: ${JSON.stringify(json)}`);
    }
  });

  // 8. Contact Form
  await test('POST /contact (Public contact message)', async () => {
    const res = await fetch(`${baseUrl}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sunita Patil',
        email: 'sunita.patil@example.com',
        phone: '9123456789',
        subject: 'General School Inquiry',
        message: 'Hello, what are the school office working hours on Saturday?',
      }),
    });
    const json = await res.json();
    if (res.status !== 201 || !json.data || !json.data.id) {
      throw new Error(`Contact submit failed: ${JSON.stringify(json)}`);
    }
  });

  // 9. Alumni Form
  await test('POST /alumni (Alumni registration with graduationYear)', async () => {
    const res = await fetch(`${baseUrl}/alumni`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vikram Joshi',
        email: 'vikram.joshi@example.com',
        phone: '9822012345',
        graduationYear: 2015,
        currentOccupation: 'Software Engineer at Pune Tech Park',
        message: 'Proud to be a Thomian! Looking forward to alumni meets.',
      }),
    });
    const json = await res.json();
    if (res.status !== 201 || !json.data || !json.data.id) {
      throw new Error(`Alumni submit failed: ${JSON.stringify(json)}`);
    }
  });

  // 10. Gallery Creation (Class-wise album with admin token)
  let createdGalleryId = null;
  await test('POST /gallery (Admin create album with classGrade & metadata)', async () => {
    const res = await fetch(`${baseUrl}/gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Class 5 Science Exhibition 2026',
        category: 'academics',
        classGrade: 'Class 5',
        description: 'Students displaying their working models and science charts.',
        isActive: true,
      }),
    });
    const json = await res.json();
    if (res.status !== 201 || !json.data || !json.data.id) {
      throw new Error(`Gallery create failed: ${JSON.stringify(json)}`);
    }
    createdGalleryId = json.data.id;
  });

  // 11. Gallery Fetch by Class
  await test('GET /gallery?classGrade=Class 5 (Filter by class)', async () => {
    const res = await fetch(`${baseUrl}/gallery?classGrade=Class%205`);
    const json = await res.json();
    if (res.status !== 200 || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error(`Expected gallery items for Class 5, got: ${JSON.stringify(json)}`);
    }
    if (json.data[0].classGrade !== 'Class 5') {
      throw new Error(`Unexpected classGrade: ${json.data[0].classGrade}`);
    }
  });

  // 12. Faculty Creation with Photo Upload (Multipart FormData)
  let createdFacultyId = null;
  await test('POST /faculty (Admin create faculty with photo upload)', async () => {
    const fd = new FormData();
    fd.append('name', 'Mrs. Anita Deshmukh');
    fd.append('designation', 'Senior Primary Teacher');
    fd.append('department', 'Primary Section');
    fd.append('qualification', 'B.A., B.Ed.');
    fd.append('experience', '12 Years');
    fd.append('email', 'anita.deshmukh@edusphere.app');
    fd.append('order', '5');
    fd.append('isActive', 'true');

    // Create a dummy image file (1x1 transparent PNG)
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    const file = new File([pngBuffer], 'faculty-test.png', { type: 'image/png' });
    fd.append('photo', file);

    const res = await fetch(`${baseUrl}/faculty`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fd,
    });
    const json = await res.json();
    if (res.status !== 201 || !json.data || !json.data.id) {
      throw new Error(`Faculty creation failed: ${JSON.stringify(json)}`);
    }
    if (!json.data.photoUrl) {
      throw new Error('Expected photoUrl to be populated on created faculty');
    }
    createdFacultyId = json.data.id;
  });

  // 13. Gallery Multi-photo 1-Click Batch Upload (Multipart FormData)
  let multiPhotoAlbumId = null;
  await test('POST /gallery (Batch multi-photo upload under single title)', async () => {
    const fd = new FormData();
    fd.append('title', 'Pre-Primary Yellow Day Celebration 2026');
    fd.append('category', 'pre-primary');
    fd.append('classGrade', 'Nursery');
    fd.append('description', 'Fun activities, coloring, and craft work celebrating Yellow Day.');
    fd.append('isActive', 'true');

    // Attach 3 dummy images simulating 1-click batch upload
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fd.append('images', new File([pngBuffer], 'yellow-day-1.png', { type: 'image/png' }));
    fd.append('images', new File([pngBuffer], 'yellow-day-2.png', { type: 'image/png' }));
    fd.append('images', new File([pngBuffer], 'yellow-day-3.png', { type: 'image/png' }));

    const res = await fetch(`${baseUrl}/gallery`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fd,
    });
    const json = await res.json();
    if (res.status !== 201 || !json.data || !json.data.id) {
      throw new Error(`Batch gallery upload failed: ${JSON.stringify(json)}`);
    }
    if (!json.data.imageUrl) {
      throw new Error('Expected cover imageUrl to be set');
    }
    if (!Array.isArray(json.data.images) || json.data.images.length !== 3) {
      throw new Error(`Expected 3 photos in album, got: ${json.data.images ? json.data.images.length : 0}`);
    }
    multiPhotoAlbumId = json.data.id;
  });

  // 14. Parent Downloads Creation with PDF File Upload and classGrade
  let createdDownloadId = null;
  await test('POST /parents/downloads (Admin create download with file upload and classGrade)', async () => {
    const fd = new FormData();
    fd.append('title', 'Class 5 Term 2 Examination Timetable');
    fd.append('category', 'timetable');
    fd.append('classGrade', 'Class 5');
    fd.append('description', 'Detailed schedule and exam instructions for Class 5 students.');
    fd.append('isActive', 'true');

    // Create a dummy PDF buffer
    const dummyPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    fd.append('file', new File([dummyPdf], 'class-5-timetable.pdf', { type: 'application/pdf' }));

    const res = await fetch(`${baseUrl}/parents/downloads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: fd,
    });
    const json = await res.json();
    if (res.status !== 201 || !json.data || !json.data.id) {
      throw new Error(`Parent download creation failed: ${JSON.stringify(json)}`);
    }
    if (!json.data.fileUrl) {
      throw new Error('Expected fileUrl to be set on created parent download');
    }
    if (json.data.classGrade !== 'Class 5') {
      throw new Error(`Expected classGrade to be 'Class 5', got: ${json.data.classGrade}`);
    }
    createdDownloadId = json.data.id;
  });

  // 15. Parent Downloads Fetch by Class
  await test('GET /parents/downloads?classGrade=Class 5 (Public filter downloads by class)', async () => {
    const res = await fetch(`${baseUrl}/parents/downloads?classGrade=Class%205`);
    const json = await res.json();
    if (res.status !== 200 || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error(`Expected parent download items for Class 5, got: ${JSON.stringify(json)}`);
    }
    if (json.data[0].classGrade !== 'Class 5') {
      throw new Error(`Unexpected classGrade in fetched download: ${json.data[0].classGrade}`);
    }
  });

  // 16. Cleanups
  await test(`DELETE /faculty/${createdFacultyId} & /gallery/${createdGalleryId},${multiPhotoAlbumId} & /parents/downloads/${createdDownloadId}`, async () => {
    if (createdFacultyId) {
      await fetch(`${baseUrl}/faculty/${createdFacultyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
    if (createdGalleryId) {
      await fetch(`${baseUrl}/gallery/${createdGalleryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
    if (multiPhotoAlbumId) {
      await fetch(`${baseUrl}/gallery/${multiPhotoAlbumId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
    if (createdDownloadId) {
      await fetch(`${baseUrl}/parents/downloads/${createdDownloadId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  });

  // Close server
  server.close();

  console.log('\n========================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
