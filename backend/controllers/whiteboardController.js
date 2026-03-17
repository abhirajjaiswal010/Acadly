const Whiteboard = require('../models/Whiteboard');

// @desc    Get saved strokes for a room
// @route   GET /api/whiteboard/:roomId
// @access  Private
exports.getWhiteboard = async (req, res) => {
  try {
    const { roomId } = req.params;
    let whiteboard = await Whiteboard.findOne({ roomId });

    if (!whiteboard) {
      return res.status(200).json({ success: true, data: [] });
    }

    res.status(200).json({ success: true, data: whiteboard.strokes });
  } catch (error) {
    console.error('Error fetching whiteboard:', error);
    res.status(500).json({ success: false, message: 'Server error fetching whiteboard data.' });
  }
};

// @desc    Save strokes for a room
// @route   POST /api/whiteboard/save
// @access  Private
exports.saveWhiteboard = async (req, res) => {
  try {
    const { roomId, strokes } = req.body;

    if (!roomId || !strokes) {
      return res.status(400).json({ success: false, message: 'roomId and strokes are required' });
    }

    let whiteboard = await Whiteboard.findOne({ roomId });

    if (whiteboard) {
      whiteboard.strokes = strokes;
      await whiteboard.save();
    } else {
      whiteboard = await Whiteboard.create({ roomId, strokes });
    }

    res.status(200).json({ success: true, message: 'Whiteboard saved successfully', data: whiteboard });
  } catch (error) {
    console.error('Error saving whiteboard:', error);
    res.status(500).json({ success: false, message: 'Server error saving whiteboard data' });
  }
};
