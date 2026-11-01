/**
 * setup-db.js — SQLite Database Initialization & Seeding Script
 *
 * Run with: node scripts/setup-db.js
 * Creates all tables and seeds the default admin user and initial school data.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { initDatabase, db } = require('../src/config/database');
const AuthService = require('../src/services/auth.service');

async function seed() {
  console.log('?? Starting EduSphere Database Initialization...');

  // 1. Initialize tables & indexes
  await initDatabase();

  // 2. Seed Default Administrator Account
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@edusphere.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminUser = await AuthService.createOrUpdateAdmin({
    email: adminEmail,
    password: adminPassword,
    name: 'EDUSPHERE Administrator',
    role: 'admin',
  });
  console.log(`? Admin Account Configured: ${adminEmail} (Password: ${adminPassword})`);

  // 3. Seed Announcements
  const existingAnnouncements = await db.get('SELECT COUNT(*) as count FROM announcements');
  if (existingAnnouncements.count === 0) {
    const announcements = [
      {
        title: 'Admissions Open for Academic Year 2026-27',
        content: 'Admissions are now open for Pre-Primary to Class IX. Online inquiries and school campus tours are available on all working days.',
        priority: 'urgent',
        is_active: 1,
      },
      {
        title: '100% SSC Board Examination Results',
        content: 'Heartiest congratulations to our Class X students and dedicated faculty for securing a 100% passing rate with outstanding distinctions.',
        priority: 'high',
        is_active: 1,
      },
      {
        title: 'Annual Sports & Athletic Meet 2026',
        content: 'The school will host its Annual Sports Meet next month. Students from all houses are requested to submit entry forms to their house mentors.',
        priority: 'medium',
        is_active: 1,
      },
    ];

    for (const a of announcements) {
      await db.run(
        'INSERT INTO announcements (title, content, priority, is_active, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [a.title, a.content, a.priority, a.is_active]
      );
    }
    console.log(`? Seeded ${announcements.length} announcements`);
  }

  // 4. Seed News Ticker Items
  const existingTicker = await db.get('SELECT COUNT(*) as count FROM ticker_items');
  if (existingTicker.count === 0) {
    const tickers = [
      { text: 'Admissions open for Pre-Primary to Class IX (2026-27 Academic Year). Enquire online today!', order_num: 1 },
      { text: 'Celebrating 100% SSC Results for the academic year! Congratulations to students and staff.', order_num: 2 },
      { text: 'Recipient of the Prestigious "Best Dynamic School" Award in the region.', order_num: 3 },
      { text: 'School hours for inquiry: Monday to Friday from 9:00 a.m. to 12:00 p.m.', order_num: 4 },
    ];

    for (const t of tickers) {
      await db.run(
        'INSERT INTO ticker_items (text, link, order_num, is_active, created_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)',
        [t.text, '', t.order_num]
      );
    }
    console.log(`? Seeded ${tickers.length} ticker items`);
  }

  // 5. Seed Upcoming Events
  const existingEvents = await db.get('SELECT COUNT(*) as count FROM upcoming_events');
  if (existingEvents.count === 0) {
    const events = [
      {
        title: 'Science & Art Exhibition 2026',
        event_date: '2026-10-15',
        event_time: '10:00 AM',
        venue: 'School Main Auditorium',
        description: 'Annual inter-class science, technology, and art showcase featuring innovative models built by students.',
      },
      {
        title: 'Parent-Teacher Interactive Forum',
        event_date: '2026-10-24',
        event_time: '09:00 AM',
        venue: 'School Conference Hall',
        description: 'Term review and interactive discussion on student progress with class mentors and principal.',
      },
    ];

    for (const e of events) {
      await db.run(
        'INSERT INTO upcoming_events (title, event_date, event_time, venue, description, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)',
        [e.title, e.event_date, e.event_time, e.venue, e.description]
      );
    }
    console.log(`? Seeded ${events.length} events`);
  }

  // 6. Seed Faculty Members
  const existingFaculty = await db.get('SELECT COUNT(*) as count FROM faculty');
  if (existingFaculty.count === 0) {
    const facultyMembers = [
      {
        name: 'Mrs. Ananya Sharma',
        designation: 'Principal & Academic Director',
        department: 'Administration',
        qualification: 'M.A., M.Ed.',
        experience: '22 Years',
        email: 'principal@edusphere.app',
        order_num: 1,
      },
      {
        name: 'Mr. Rajesh Kulkarni',
        designation: 'Head of Mathematics',
        department: 'Science & Math',
        qualification: 'M.Sc. (Math), B.Ed.',
        experience: '15 Years',
        email: 'rajesh.k@edusphere.app',
        order_num: 2,
      },
      {
        name: 'Mrs. Anita Deshmukh',
        designation: 'Senior English Educator',
        department: 'Languages',
        qualification: 'M.A. (English), B.Ed.',
        experience: '12 Years',
        email: 'anita.d@edusphere.app',
        order_num: 3,
      },
    ];

    for (const f of facultyMembers) {
      await db.run(
        'INSERT INTO faculty (name, designation, department, qualification, experience, email, order_num, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)',
        [f.name, f.designation, f.department, f.qualification, f.experience, f.email, f.order_num]
      );
    }
    console.log(`? Seeded ${facultyMembers.length} faculty profiles`);
  }

  // 7. Seed Sample Parent Downloads
  const existingDownloads = await db.get('SELECT COUNT(*) as count FROM parent_downloads');
  if (existingDownloads.count === 0) {
    const downloads = [
      {
        title: 'School Prospectus & Information Brochure 2026-27',
        category: 'forms',
        file_url: 'assets/documents/prospectus-sample.pdf',
        description: 'Complete academic handbook, fee guidelines, and school rules.',
      },
      {
        title: 'Admission Registration Form (Printable PDF)',
        category: 'forms',
        file_url: 'assets/documents/admission-form-sample.pdf',
        description: 'Official offline registration form for direct campus submission.',
      },
    ];

    for (const d of downloads) {
      await db.run(
        'INSERT INTO parent_downloads (title, category, file_url, description, is_active, created_at) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)',
        [d.title, d.category, d.file_url, d.description]
      );
    }
    console.log(`? Seeded ${downloads.length} parent download items`);
  }

  console.log('\n?? Database setup & seeding complete! You can now start the server.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('? Database setup failed:', err);
  process.exit(1);
});
