import React, { useState, useEffect } from 'react';
import Canvas from './Canvas';
import Toolbar from './Toolbar';
import API from '../../utils/api';
import toast from 'react-hot-toast';

const Whiteboard = ({ socket, roomId }) => {
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(3);
  const [tool, setTool] = useState('pen');
  const [incomingDrawData, setIncomingDrawData] = useState(null);
  const [clearTrigger, setClearTrigger] = useState(false);
  const [initialStrokes, setInitialStrokes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Buffer for local strokes to save to DB
  const [currentStrokes, setCurrentStrokes] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);

  useEffect(() => {
    // Fetch saved whiteboard data
    const fetchWhiteboardData = async () => {
      try {
        const res = await API.get(`/whiteboard/${roomId}`);
        if (res.data.success) {
          setInitialStrokes(res.data.data);
          setCurrentStrokes(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching whiteboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWhiteboardData();

    // Listen for socket events
    if (socket) {
      socket.on('draw', (data) => {
        setIncomingDrawData(data);
      });

      socket.on('clear-whiteboard', () => {
        setClearTrigger(true);
      });
    }

    return () => {
      if (socket) {
        socket.off('draw');
        socket.off('clear-whiteboard');
      }
    };
  }, [socket, roomId]);

  const handleDrawAction = (data) => {
    // Basic stroke tracking for saving
    if (data.type === 'start') {
      setCurrentStroke({
        color: data.color,
        size: data.size,
        points: [{ x: data.x, y: data.y }]
      });
    } else if (data.type === 'draw' && currentStroke) {
      setCurrentStroke(prev => ({
        ...prev,
        points: [...prev.points, { x: data.x, y: data.y }]
      }));
    } else if (data.type === 'stop' && currentStroke) {
      setCurrentStrokes(prev => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear the entire board for everyone?')) {
      socket?.emit('clear-whiteboard', { roomId });
      setClearTrigger(true);
      setCurrentStrokes([]);
    }
  };

  const handleSave = async () => {
    try {
      toast.loading('Saving whiteboard...', { id: 'save-wb' });
      await API.post('/whiteboard/save', 
        { roomId, strokes: currentStrokes }
      );
      toast.success('Whiteboard saved!', { id: 'save-wb' });
    } catch (err) {
      toast.error('Failed to save whiteboard', { id: 'save-wb' });
    }
  };

  const handleExport = () => {
    const canvas = document.querySelector('.whiteboard-canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.download = `whiteboard-${roomId}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  if (loading) {
    return <div className="whiteboard-loading">Loading whiteboard...</div>;
  }

  return (
    <div className="whiteboard-container">
      <Toolbar 
        color={color} 
        setColor={setColor} 
        size={size} 
        setSize={setSize} 
        tool={tool} 
        setTool={setTool}
        onClear={handleClear}
        onSave={handleSave}
        onExport={handleExport}
      />
      <div className="canvas-wrapper">
        <Canvas 
          color={color} 
          size={size} 
          tool={tool} 
          socket={socket} 
          roomId={roomId}
          incomingDrawData={incomingDrawData}
          clearTrigger={clearTrigger}
          onClearDone={() => setClearTrigger(false)}
          onDraw={handleDrawAction}
          initialStrokes={initialStrokes}
        />
      </div>
    </div>
  );
};

export default Whiteboard;
