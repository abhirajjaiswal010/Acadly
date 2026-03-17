const mongoose = require('mongoose');

const WhiteboardSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    strokes: [
      {
        points: [
          {
            x: Number,
            y: Number,
          },
        ],
        color: String,
        size: Number,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Whiteboard', WhiteboardSchema);
