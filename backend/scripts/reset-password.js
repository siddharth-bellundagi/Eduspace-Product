/**
 * reset-password.js — Reset / update admin password in the SQLite database
 *
 * Usage:
 *   node scripts/reset-password.js
 *
 * Reads ADMIN_EMAIL and ADMIN_PASSWORD from .env and updates the database.
 * Run this whenever you change the credentials in .env.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const bcrypt   = require('bcryptjs');
const sqlite3  = require('sqlite3').verbose();
const path     = require('path');

const NEW_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@edusphere.school';
const NEW_PASSWORD = process.env.ADMIN_PASSWORD || 'EduSphere@2026#Admin';
const ADMIN_NAME   = 'EduSphere School Admin';
const DB_PATH      = path.join(__dirname, '../data/edusphere.sqlite3');

async function main() {
  console.log('');
  console.log('══════════════════════════════════════════════');
  console.log('  🔐 EduSphere — Admin Password Reset Tool');
  console.log('══════════════════════════════════════════════');
  console.log('');
  console.log(`  Using database: ${DB_PATH}`);
  console.log('');

  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 12);
  const db = new sqlite3.Database(DB_PATH);

  return new Promise((resolve) => {
    db.get('SELECT id, email FROM users WHERE role = ? LIMIT 1', ['admin'], (err, row) => {
      if (err) {
        console.error('❌ DB Error:', err.message);
        db.close();
        resolve();
        return;
      }

      const done = (err2, action) => {
        if (err2) {
          console.error('❌ Error:', err2.message);
        } else {
          console.log(`✅ Admin credentials ${action}!`);
          console.log('');
          console.log(`  📧 Email:    ${NEW_EMAIL}`);
          console.log(`  🔑 Password: ${NEW_PASSWORD}`);
          console.log(`  👤 Name:     ${ADMIN_NAME}`);
          console.log('');
          console.log('  You can now login via the Admin Login button on the website.');
          console.log('══════════════════════════════════════════════');
          console.log('');
        }
        db.close();
        resolve();
      };

      if (row) {
        db.run(
          'UPDATE users SET email=?, password_hash=?, name=?, updated_at=datetime("now") WHERE id=?',
          [NEW_EMAIL, passwordHash, ADMIN_NAME, row.id],
          (e) => done(e, 'updated')
        );
      } else {
        db.run(
          'INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)',
          [NEW_EMAIL, passwordHash, ADMIN_NAME, 'admin'],
          (e) => done(e, 'created')
        );
      }
    });
  });
}

main().catch((err) => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
