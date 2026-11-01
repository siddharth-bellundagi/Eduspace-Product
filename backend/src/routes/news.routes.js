/**
 * news.routes.js — News & Announcements routes
 *
 * Sub-routes for: announcements, ticker, circulars, holidays
 * Public GET endpoints for frontend + Admin CRUD endpoints
 */
const { Router } = require('express');
const newsController = require('../controllers/news.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const validate = require('../middlewares/validator');
const {
  createAnnouncementRules, updateAnnouncementRules,
  createTickerRules, updateTickerRules,
  createCircularRules, updateCircularRules,
  createHolidayRules, updateHolidayRules,
} = require('../validators/news.validator');

const router = Router();

// ─── ANNOUNCEMENTS ───────────────────────────────────────
// Public
router.get('/announcements', newsController.listAnnouncements);
// Admin
router.get('/announcements/all', verifyToken, requireAdmin, newsController.getAllAnnouncements);
router.get('/announcements/:id', verifyToken, requireAdmin, newsController.getAnnouncementById);
router.post('/announcements', verifyToken, requireAdmin, createAnnouncementRules, validate, newsController.createAnnouncement);
router.put('/announcements/:id', verifyToken, requireAdmin, updateAnnouncementRules, validate, newsController.updateAnnouncement);
router.delete('/announcements/:id', verifyToken, requireAdmin, newsController.deleteAnnouncement);

// ─── TICKER ITEMS ────────────────────────────────────────
// Public
router.get('/ticker', newsController.listTicker);
// Admin
router.get('/ticker/all', verifyToken, requireAdmin, newsController.getAllTicker);
router.get('/ticker/:id', verifyToken, requireAdmin, newsController.getTickerById);
router.post('/ticker', verifyToken, requireAdmin, createTickerRules, validate, newsController.createTicker);
router.put('/ticker/:id', verifyToken, requireAdmin, updateTickerRules, validate, newsController.updateTicker);
router.delete('/ticker/:id', verifyToken, requireAdmin, newsController.deleteTicker);

// ─── CIRCULARS ───────────────────────────────────────────
// Public
router.get('/circulars', newsController.listCirculars);
// Admin
router.get('/circulars/all', verifyToken, requireAdmin, newsController.getAllCirculars);
router.get('/circulars/:id', verifyToken, requireAdmin, newsController.getCircularById);
router.post('/circulars', verifyToken, requireAdmin, createCircularRules, validate, newsController.createCircular);
router.put('/circulars/:id', verifyToken, requireAdmin, updateCircularRules, validate, newsController.updateCircular);
router.delete('/circulars/:id', verifyToken, requireAdmin, newsController.deleteCircular);

// ─── HOLIDAYS ────────────────────────────────────────────
// Public
router.get('/holidays', newsController.listHolidays);
// Admin
router.get('/holidays/all', verifyToken, requireAdmin, newsController.getAllHolidays);
router.get('/holidays/:id', verifyToken, requireAdmin, newsController.getHolidayById);
router.post('/holidays', verifyToken, requireAdmin, createHolidayRules, validate, newsController.createHoliday);
router.put('/holidays/:id', verifyToken, requireAdmin, updateHolidayRules, validate, newsController.updateHoliday);
router.delete('/holidays/:id', verifyToken, requireAdmin, newsController.deleteHoliday);

module.exports = router;
