/**
 * school.config.js — Central School/College Configuration
 *
 * ╔═══════════════════════════════════════════════════════════════════╗
 * ║  THIS IS THE ONLY FILE YOU NEED TO EDIT FOR A NEW CLIENT.       ║
 * ║  All pages, headers, footers, and API calls read from here.     ║
 * ╚═══════════════════════════════════════════════════════════════════╝
 *
 * When deploying for a new school/college:
 *   1. Edit this file with the client's information
 *   2. Replace assets/logo.svg with the client's logo
 *   3. Update backend/.env with API credentials
 *   4. Deploy!
 */
const SCHOOL_CONFIG = {
  // ─── School Identity ──────────────────────────────────
  name: 'Greenwood Public School',
  shortName: 'GPS',
  motto: 'All great achievements happen in small steps',
  tagline: 'Model Colony, Pune',
  trustName: 'Greenwood Education Foundation',
  foundedYear: 1995,
  board: 'SSC',                       // SSC | CBSE | ICSE | IGCSE | IB | State Board

  // ─── Branding ─────────────────────────────────────────
  branding: {
    logoPath: 'assets/logo.svg',
    faviconPath: 'assets/logo.svg',
    primaryColor: '#1a365d',          // Dark navy (header, buttons)
    accentColor: '#C79820',           // Gold (highlights, accents)
    heroImage: 'assets/school_building_hero.jpg',
  },

  // ─── Contact Information ──────────────────────────────
  contact: {
    phones: ['+91 98765 43210'],
    email: 'info@greenwoodschool.edu.in',
    whatsapp: '919876543210',
    address: 'Model Colony, Shivajinagar, Pune - 411016',
    addressShort: 'Model Colony, Pune',
    mapEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.0!2d73.8!3d18.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1',
    timings: 'Mon–Fri: 7:30 AM – 2:00 PM | Sat: 8:00 AM – 12:00 PM',
  },

  // ─── Social Media ─────────────────────────────────────
  social: {
    facebook: '',
    instagram: '',
    youtube: '',
    twitter: '',
    linkedin: '',
  },

  // ─── API Configuration ────────────────────────────────
  api: {
    // Leave empty for auto-detection (localhost:5000 in dev, /api in production)
    // Set explicitly when backend is on a different domain
    baseUrl: '',
  },

  // ─── Feature Toggles ─────────────────────────────────
  // Enable/disable sections based on what the school has
  features: {
    admissions: true,
    alumni: true,
    sscToppers: true,           // Set false for non-SSC board schools
    onlinePayment: false,       // Future: Razorpay integration
    parentPortal: false,        // Future: Parent login
    studentPortal: false,       // Future: Student login
    transportTracking: false,   // Future: Bus tracking
    examResults: false,         // Future: Online results
  },

  // ─── Grades / Classes Offered ─────────────────────────
  grades: [
    'Nursery', 'Jr. KG', 'Sr. KG',
    '1st', '2nd', '3rd', '4th', '5th',
    '6th', '7th', '8th', '9th', '10th',
  ],

  // ─── SEO / Meta ───────────────────────────────────────
  seo: {
    titleSuffix: ' | Greenwood Public School, Pune',
    defaultDescription: 'Welcome to Greenwood Public School, Pune. Supporting academic excellence and holistic child development.',
    ogImage: 'assets/school_building_hero.jpg',
  },
};

// Make globally available
if (typeof window !== 'undefined') {
  window.SCHOOL_CONFIG = SCHOOL_CONFIG;
}
if (typeof module !== 'undefined') {
  module.exports = SCHOOL_CONFIG;
}
