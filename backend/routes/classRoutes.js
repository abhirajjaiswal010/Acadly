const express = require('express');
const router = express.Router();
const {
  createClass,
  getClasses,
  getClass,
  getClassBySessionId,
  updateClass,
  deleteClass,
  joinClass,
  getAllClassesAdmin,
} = require('../controllers/classController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Student: join a class
router.post('/join', authorize('student', 'admin'), joinClass);

// Get class by session code
router.get('/session/:sessionId', getClassBySessionId);

// Admin: get all classes
router.get('/admin/all', authorize('admin'), getAllClassesAdmin);

// Standard CRUD
router.route('/')
  .get(getClasses)
  .post(authorize('teacher', 'admin'), createClass);

router.route('/:id')
  .get(getClass)
  .put(authorize('teacher', 'admin'), updateClass)
  .delete(authorize('teacher', 'admin'), deleteClass);

module.exports = router;
