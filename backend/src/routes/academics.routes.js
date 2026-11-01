/**
 * academics.routes.js — Academics routes
 *
 * Sub-routes for: programs, curriculum, academic calendar, syllabus, exams
 */
const { Router } = require('express');
const academicsController = require('../controllers/academics.controller');
const { verifyToken, requireAdmin } = require('../middlewares/auth');
const { imageUpload, mixedUpload } = require('../middlewares/upload');
const validate = require('../middlewares/validator');
const {
  createProgramRules, updateProgramRules,
  createCurriculumRules, updateCurriculumRules,
  createCalendarRules, updateCalendarRules,
  createSyllabusRules, updateSyllabusRules,
  createExamRules, updateExamRules,
} = require('../validators/academics.validator');

const router = Router();

// ─── ACADEMIC PROGRAMS ──────────────────────────────────
// Public
router.get('/programs', academicsController.listPrograms);
// Admin
router.get('/programs/all', verifyToken, requireAdmin, academicsController.getAllPrograms);
router.get('/programs/:id', verifyToken, requireAdmin, academicsController.getProgramById);
router.post('/programs', verifyToken, requireAdmin, imageUpload.single('image'), createProgramRules, validate, academicsController.createProgram);
router.put('/programs/:id', verifyToken, requireAdmin, imageUpload.single('image'), updateProgramRules, validate, academicsController.updateProgram);
router.delete('/programs/:id', verifyToken, requireAdmin, academicsController.deleteProgram);

// ─── CURRICULUM (backward compat — aliases to syllabus) ─
router.get('/curriculum', academicsController.listCurriculum);
router.get('/curriculum/all', verifyToken, requireAdmin, academicsController.getAllCurriculum);
router.get('/curriculum/:id', verifyToken, requireAdmin, academicsController.getCurriculumById);
router.post('/curriculum', verifyToken, requireAdmin, mixedUpload.single('file'), createCurriculumRules, validate, academicsController.createCurriculum);
router.put('/curriculum/:id', verifyToken, requireAdmin, mixedUpload.single('file'), updateCurriculumRules, validate, academicsController.updateCurriculum);
router.delete('/curriculum/:id', verifyToken, requireAdmin, academicsController.deleteCurriculum);

// ─── ACADEMIC CALENDAR ──────────────────────────────────
// Public
router.get('/calendar', academicsController.listCalendar);
// Admin
router.get('/calendar/all', verifyToken, requireAdmin, academicsController.getAllCalendar);
router.get('/calendar/:id', verifyToken, requireAdmin, academicsController.getCalendarById);
router.post('/calendar', verifyToken, requireAdmin, createCalendarRules, validate, academicsController.createCalendar);
router.put('/calendar/:id', verifyToken, requireAdmin, updateCalendarRules, validate, academicsController.updateCalendar);
router.delete('/calendar/:id', verifyToken, requireAdmin, academicsController.deleteCalendar);

// ─── SYLLABUS & COURSE OUTLINE ──────────────────────────
// Public
router.get('/syllabus', academicsController.listSyllabus);
// Admin
router.get('/syllabus/all', verifyToken, requireAdmin, academicsController.getAllSyllabus);
router.get('/syllabus/:id', verifyToken, requireAdmin, academicsController.getSyllabusById);
router.post('/syllabus', verifyToken, requireAdmin, mixedUpload.single('file'), createSyllabusRules, validate, academicsController.createSyllabus);
router.put('/syllabus/:id', verifyToken, requireAdmin, mixedUpload.single('file'), updateSyllabusRules, validate, academicsController.updateSyllabus);
router.delete('/syllabus/:id', verifyToken, requireAdmin, academicsController.deleteSyllabus);

// ─── EXAM SCHEDULES ─────────────────────────────────────
// Public
router.get('/exams', academicsController.listExams);
// Admin
router.get('/exams/all', verifyToken, requireAdmin, academicsController.getAllExams);
router.get('/exams/:id', verifyToken, requireAdmin, academicsController.getExamById);
router.post('/exams', verifyToken, requireAdmin, mixedUpload.single('file'), createExamRules, validate, academicsController.createExam);
router.put('/exams/:id', verifyToken, requireAdmin, mixedUpload.single('file'), updateExamRules, validate, academicsController.updateExam);
router.delete('/exams/:id', verifyToken, requireAdmin, academicsController.deleteExam);

module.exports = router;
