import React, { useRef, useEffect, useState, useCallback } from 'react';

const Canvas = ({ 
  color, 
  size, 
  tool, 
  socket, 
  roomId, 
  onDraw, 
  incomingDrawData,
  clearTrigger,
  onClearDone,
  initialStrokes = []
}) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    // Set display size
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    // Set actual resolution
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    const context = canvas.getContext('2d');
    context.scale(2, 2);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    // Draw initial strokes if any
    if (initialStrokes.length > 0) {
      initialStrokes.forEach(stroke => {
        if (stroke.points && stroke.points.length > 0) {
          context.strokeStyle = stroke.color;
          context.lineWidth = stroke.size;
          context.beginPath();
          context.moveTo(stroke.points[0].x, stroke.points[0].y);
          stroke.points.forEach(p => context.lineTo(p.x, p.y));
          context.stroke();
        }
      });
    }
  }, [initialStrokes]);

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    contextRef.current.lineWidth = size;
    contextRef.current.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);

    const data = {
      type: 'start',
      x: offsetX,
      y: offsetY,
      color: contextRef.current.strokeStyle,
      size,
      tool,
      roomId
    };
    socket?.emit('draw', data);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    
    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    const data = {
      type: 'draw',
      x: offsetX,
      y: offsetY,
      color: tool === 'eraser' ? '#ffffff' : color,
      size,
      tool,
      roomId
    };
    socket?.emit('draw', data);
    onDraw?.(data);
  };

  const stopDrawing = () => {
    contextRef.current.closePath();
    setIsDrawing(false);
    socket?.emit('draw', { type: 'stop', roomId });
  };

  // Handle incoming drawing data from other users
  useEffect(() => {
    if (!incomingDrawData || !contextRef.current) return;

    const { type, x, y, color: inColor, size: inSize, tool: inTool } = incomingDrawData;
    const ctx = contextRef.current;

    if (type === 'start') {
      ctx.beginPath();
      ctx.strokeStyle = inColor;
      ctx.lineWidth = inSize;
      ctx.globalCompositeOperation = inTool === 'eraser' ? 'destination-out' : 'source-over';
      ctx.moveTo(x, y);
    } else if (type === 'draw') {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (type === 'stop') {
      ctx.closePath();
    }
  }, [incomingDrawData]);

  // Handle clear event
  useEffect(() => {
    if (clearTrigger) {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onClearDone?.();
    }
  }, [clearTrigger, onClearDone]);

  return (
    <canvas
      className={`whiteboard-canvas ${tool}-cursor`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      ref={canvasRef}
    />
  );
};

export default Canvas;
