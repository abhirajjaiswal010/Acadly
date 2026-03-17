const Class = require('../models/Class');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Create a new class
 * @route   POST /api/classes
 * @access  Private/Teacher
 */
const createClass = asyncHandler(async (req, res) => {
  const { title, description, subject, maxStudents, scheduledAt, tags } = req.body;

  if (!title) {
    return res.status(400).json({ success: false, message: 'Class title is required' });
  }

  const newClass = await Class.create({
    title,
    description,
    subject,
    maxStudents,
    scheduledAt,
    tags,
    teacher: req.user._id,
  });

  await newClass.populate('teacher', 'name email avatar');

  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    class: newClass,
  });
});

/**
 * @desc    Get all classes (with filters)
 * @route   GET /api/classes
 * @access  Private
 */
const getClasses = asyncHandler(async (req, res) => {
  let query = {};

  // Teacher sees their own classes; student sees all active classes
  if (req.user.role === 'teacher') {
    query.teacher = req.user._id;
  } else if (req.user.role === 'student') {
    query.isActive = true;
  }

  const classes = await Class.find(query)
    .populate('teacher', 'name email avatar')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: classes.length,
    classes,
  });
});

/**
 * @desc    Get single class by ID
 * @route   GET /api/classes/:id
 * @access  Private
 */
const getClass = asyncHandler(async (req, res) => {
  const classItem = await Class.findById(req.params.id)
    .populate('teacher', 'name email avatar')
    .populate('students.user', 'name email avatar');

  if (!classItem) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  res.status(200).json({ success: true, class: classItem });
});

/**
 * @desc    Get class by sessionId (room code)
 * @route   GET /api/classes/session/:sessionId
 * @access  Private
 */
const getClassBySessionId = asyncHandler(async (req, res) => {
  const classItem = await Class.findOne({ sessionId: req.params.sessionId.toUpperCase() })
    .populate('teacher', 'name email avatar')
    .populate('students.user', 'name email avatar');

  if (!classItem) {
    return res.status(404).json({ success: false, message: 'Class not found with that session code' });
  }

  if (!classItem.isActive) {
    return res.status(400).json({ success: false, message: 'This class is no longer active' });
  }

  res.status(200).json({ success: true, class: classItem });
});

/**
 * @desc    Update class
 * @route   PUT /api/classes/:id
 * @access  Private/Teacher (own class) or Admin
 */
const updateClass = asyncHandler(async (req, res) => {
  let classItem = await Class.findById(req.params.id);

  if (!classItem) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  // Ensure teacher owns the class (or admin)
  if (
    classItem.teacher.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized to update this class' });
  }

  const { title, description, subject, maxStudents, scheduledAt, tags, isActive } = req.body;

  classItem = await Class.findByIdAndUpdate(
    req.params.id,
    { title, description, subject, maxStudents, scheduledAt, tags, isActive },
    { new: true, runValidators: true }
  ).populate('teacher', 'name email avatar');

  res.status(200).json({
    success: true,
    message: 'Class updated successfully',
    class: classItem,
  });
});

/**
 * @desc    Delete class
 * @route   DELETE /api/classes/:id
 * @access  Private/Teacher (own class) or Admin
 */
const deleteClass = asyncHandler(async (req, res) => {
  const classItem = await Class.findById(req.params.id);

  if (!classItem) {
    return res.status(404).json({ success: false, message: 'Class not found' });
  }

  if (
    classItem.teacher.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this class' });
  }

  await classItem.deleteOne();

  res.status(200).json({ success: true, message: 'Class deleted successfully' });
});

/**
 * @desc    Student joins a class via sessionId
 * @route   POST /api/classes/join
 * @access  Private/Student
 */
const joinClass = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'Session code is required' });
  }

  const classItem = await Class.findOne({ sessionId: sessionId.toUpperCase() });

  if (!classItem) {
    return res.status(404).json({ success: false, message: 'Invalid session code' });
  }

  if (!classItem.isActive) {
    return res.status(400).json({ success: false, message: 'This class is not active' });
  }

  if (classItem.students.length >= classItem.maxStudents) {
    return res.status(400).json({ success: false, message: 'Class is full' });
  }

  // Check if already enrolled
  const alreadyEnrolled = classItem.students.some(
    (s) => s.user.toString() === req.user._id.toString()
  );

  if (!alreadyEnrolled) {
    classItem.students.push({ user: req.user._id });
  }

  // Add to session history
  classItem.sessionHistory.push({
    user: req.user._id,
    userName: req.user.name,
    userRole: req.user.role,
    action: 'joined',
  });

  await classItem.save();
  await classItem.populate('teacher', 'name email avatar');

  res.status(200).json({
    success: true,
    message: 'Joined class successfully',
    class: classItem,
  });
});

/**
 * @desc    Get all classes for admin
 * @route   GET /api/classes/admin/all
 * @access  Private/Admin
 */
const getAllClassesAdmin = asyncHandler(async (req, res) => {
  const classes = await Class.find({})
    .populate('teacher', 'name email')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    count: classes.length,
    classes,
  });
});

module.exports = {
  createClass,
  getClasses,
  getClass,
  getClassBySessionId,
  updateClass,
  deleteClass,
  joinClass,
  getAllClassesAdmin,
};
