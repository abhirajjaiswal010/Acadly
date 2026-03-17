const express = require('express');
const router = express.Router();
const { getWhiteboard, saveWhiteboard } = require('../controllers/whiteboardController');
const { protect } = require('../middleware/auth'); 

router.get('/:roomId', protect, getWhiteboard);
router.post('/save', protect, saveWhiteboard);

module.exports = router;
