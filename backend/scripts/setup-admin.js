/**
 * setup-admin.js — One-time admin account creation
 *
 * Usage:
 *   node scripts/setup-admin.js
 */

// Load env before anything else
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('../src/config/database');

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@edusphere.app';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'EduSphere@2026#SecureAdmin';
const ADMIN_NAME     = 'School Admin';

async function main() {
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log('  🔐 EduSphere — Admin Setup');
  console.log('═══════════════════════════════════════════');
  console.log('');

  try {
    // Initialize tables
    await initDatabase();

    // Check if admin already exists
    const existing = await db.get('SELECT id, email FROM users WHERE email = ?', [ADMIN_EMAIL]);
    if (existing) {
      console.log(`⚠️  Admin already exists: ${existing.email}`);
      console.log('   You can login with your existing password.');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    // Insert admin user
    await db.run(
      'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [ADMIN_EMAIL, passwordHash, ADMIN_NAME, 'admin']
    );

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log(`  Email:    ${ADMIN_EMAIL}`);
    console.log(`  Password: ${ADMIN_PASSWORD}`);
    console.log(`  Name:     ${ADMIN_NAME}`);
    console.log('');
    console.log('  You can now login through the admin panel.');
    console.log('═══════════════════════════════════════════');
    console.log('');

  } catch (err) {
    console.error('❌ Error creating admin:', err.message);
  }

  process.exit(0);
}

main();
