/**
 * database.js — SQLite Database Connection & Schema Initialization
 *
 * Provides a promise-based query interface over SQLite (sqlite3).
 * Compatible with local development and lightweight deployments.
 */
const sqlite3  = require('sqlite3').verbose();
const path     = require('path');
const logger   = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/edusphere.sqlite3');

// Open SQLite database (creates file if not exists)
const sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    logger.error('❌ Failed to open SQLite database:', err.message);
    throw err;
  }
  // Enable WAL mode for better concurrency
  sqliteDb.run('PRAGMA journal_mode=WAL;');
  sqliteDb.run('PRAGMA foreign_keys=ON;');
  // Wait up to 5 seconds if the database is locked (prevents SQLITE_BUSY)
  sqliteDb.run('PRAGMA busy_timeout=5000;');
  logger.info(`✅ SQLite database opened: ${DB_PATH}`);
});

/**
 * Promise-based query helpers
 */
const db = {
  /**
   * Run a query that modifies data (INSERT, UPDATE, DELETE)
   * Returns { lastID, changes }
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  /**
   * Fetch a single row (SELECT ... LIMIT 1)
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      sqliteDb.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      });
    });
  },

  /**
   * Fetch multiple rows (SELECT ...)
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  },

  /**
   * Execute a raw SQL string (for schema creation etc.)
   */
  exec(sql) {
    return new Promise((resolve, reject) => {
      sqliteDb.exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },

  /**
   * Close the database (graceful shutdown)
   */
  close() {
    return new Promise((resolve, reject) => {
      sqliteDb.close((err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },
};

/**
 * Initialize all database tables and indexes
 */
async function initDatabase() {
  logger.info('⏳ Initializing SQLite database schema...');

  const statements = [
    // Users / Admin table
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT DEFAULT 'School Admin',
      role TEXT DEFAULT 'admin',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Admissions form enquiries
    `CREATE TABLE IF NOT EXISTS admission_enquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      parent_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      dob TEXT,
      class_applied TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'new',
      admin_notes TEXT,
      submitted_from TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Contact messages
    `CREATE TABLE IF NOT EXISTS contact_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'new',
      admin_notes TEXT,
      submitted_from TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Alumni registrations
    `CREATE TABLE IF NOT EXISTS alumni_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      graduation_year TEXT,
      passout_year TEXT,
      current_occupation TEXT,
      message TEXT,
      status TEXT DEFAULT 'new',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Announcements
    `CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'medium',
      expires_at TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // News Ticker Items
    `CREATE TABLE IF NOT EXISTS ticker_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      link TEXT,
      order_num INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Upcoming Events
    `CREATE TABLE IF NOT EXISTS upcoming_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT,
      venue TEXT,
      description TEXT,
      type TEXT DEFAULT 'general',
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Gallery
    `CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      class_grade TEXT,
      image_url TEXT,
      cloudinary_public_id TEXT,
      images_json TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Faculty and Staff
    `CREATE TABLE IF NOT EXISTS faculty (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      department TEXT,
      qualification TEXT,
      experience TEXT,
      email TEXT,
      phone TEXT,
      image_url TEXT,
      cloudinary_public_id TEXT,
      order_num INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Parent Downloads & Circulars
    `CREATE TABLE IF NOT EXISTS parent_downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT DEFAULT 'forms',
      class_grade TEXT DEFAULT 'all',
      file_url TEXT NOT NULL,
      cloudinary_public_id TEXT,
      file_size INTEGER,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Student Achievements
    `CREATE TABLE IF NOT EXISTS student_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      student_name TEXT,
      class_grade TEXT,
      category TEXT DEFAULT 'academic',
      achievement_date TEXT,
      year TEXT DEFAULT '',
      recipient TEXT DEFAULT '',
      description TEXT,
      image_url TEXT,
      cloudinary_public_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // SSC Toppers
    `CREATE TABLE IF NOT EXISTS ssc_toppers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_name TEXT NOT NULL,
      percentage TEXT NOT NULL,
      total_marks TEXT,
      rank_num INTEGER DEFAULT 1,
      academic_year TEXT NOT NULL,
      image_url TEXT,
      cloudinary_public_id TEXT,
      stream TEXT,
      remarks TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Student Life
    `CREATE TABLE IF NOT EXISTS student_life (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      class_grade TEXT,
      description TEXT,
      image_url TEXT,
      images_json TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Academics
    `CREATE TABLE IF NOT EXISTS academics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      section_key TEXT DEFAULT '',
      highlights TEXT DEFAULT '',
      timings TEXT DEFAULT '',
      age_criteria TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      event_date TEXT DEFAULT '',
      class_grade TEXT DEFAULT '',
      exam_type TEXT DEFAULT '',
      file_url TEXT,
      cloudinary_public_id TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Circulars & Holidays
    `CREATE TABLE IF NOT EXISTS circulars_holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      event_date TEXT,
      file_url TEXT,
      cloudinary_public_id TEXT,
      description TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`,

    // Indexes
    `CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_ticker_active ON ticker_items(is_active, order_num)`,
    `CREATE INDEX IF NOT EXISTS idx_events_active ON upcoming_events(is_active, event_date)`,
    `CREATE INDEX IF NOT EXISTS idx_gallery_cat ON gallery(category, is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_faculty_order ON faculty(is_active, order_num)`,
    `CREATE INDEX IF NOT EXISTS idx_admissions_status ON admission_enquiries(status, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_contacts_status ON contact_inquiries(status, created_at)`,
    `CREATE INDEX IF NOT EXISTS idx_downloads_cat ON parent_downloads(category, is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_achievements_cat ON student_achievements(category, is_active)`,
    `CREATE INDEX IF NOT EXISTS idx_student_life_cat ON student_life(category, is_active)`,
  ];

  // ─── Schema Migrations ─────────────────────────────────────
  // ALTER TABLE statements for adding columns to existing databases.
  // These are safe to run repeatedly — SQLite will throw "duplicate column"
  // which we silently ignore.
  const migrations = [
    // Task 2: academics — missing columns needed by programs, calendar, exams
    `ALTER TABLE academics ADD COLUMN section_key TEXT DEFAULT ''`,
    `ALTER TABLE academics ADD COLUMN highlights TEXT DEFAULT ''`,
    `ALTER TABLE academics ADD COLUMN timings TEXT DEFAULT ''`,
    `ALTER TABLE academics ADD COLUMN age_criteria TEXT DEFAULT ''`,
    `ALTER TABLE academics ADD COLUMN image_url TEXT DEFAULT ''`,
    `ALTER TABLE academics ADD COLUMN event_date TEXT DEFAULT ''`,
    `ALTER TABLE academics ADD COLUMN class_grade TEXT DEFAULT ''`,
    `ALTER TABLE academics ADD COLUMN exam_type TEXT DEFAULT ''`,

    // Task 3: upcoming_events — type column for alumni events
    `ALTER TABLE upcoming_events ADD COLUMN type TEXT DEFAULT 'general'`,

    // Task 4: student_achievements — year & recipient for awards module
    `ALTER TABLE student_achievements ADD COLUMN year TEXT DEFAULT ''`,
    `ALTER TABLE student_achievements ADD COLUMN recipient TEXT DEFAULT ''`,
  ];

  for (const stmt of statements) {
    try {
      await db.run(stmt);
    } catch (err) {
      // Ignore "already exists" errors
      if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
        logger.warn(`⚠️  Schema warning: ${err.message}`);
      }
    }
  }

  // Run migrations (safe: "duplicate column name" errors are silently ignored)
  for (const migration of migrations) {
    try {
      await db.run(migration);
    } catch (err) {
      // Expected error when column already exists — silently ignore
      if (!err.message.includes('duplicate column name')) {
        logger.warn(`⚠️  Migration warning: ${err.message}`);
      }
    }
  }

  logger.info('✅ SQLite Schema & Indexes initialized successfully');
}

module.exports = { db, initDatabase };
