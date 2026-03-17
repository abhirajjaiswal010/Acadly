import React from 'react';
import { Pencil, Eraser, Trash2, Save, Download } from 'lucide-react';

const Toolbar = ({ 
  color, 
  setColor, 
  size, 
  setSize, 
  tool, 
  setTool, 
  onClear, 
  onSave,
  onExport 
}) => {
  const colors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', 
    '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
    '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'
  ];

  return (
    <div className="whiteboard-toolbar">
      {/* Tool Selection */}
      <div className="toolbar-section">
        <button 
          className={`toolbar-btn ${tool === 'pen' ? 'active' : ''}`}
          onClick={() => setTool('pen')}
          title="Pencil"
        >
          <Pencil size={18} />
        </button>
        <button 
          className={`toolbar-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="Eraser"
        >
          <Eraser size={18} />
        </button>
      </div>

      <div className="divider-v" />

      {/* Color Selection */}
      <div className="toolbar-section colors-grid">
        {colors.map(c => (
          <button
            key={c}
            className={`color-dot ${color === c ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => {
              setColor(c);
              if (tool === 'eraser') setTool('pen');
            }}
          />
        ))}
      </div>

      <div className="divider-v" />

      {/* Size Selection */}
      <div className="toolbar-section flex-col gap-1 px-2">
        <span className="text-[10px] uppercase font-bold opacity-50">Size</span>
        <input 
          type="range" 
          min="1" 
          max="20" 
          value={size} 
          onChange={(e) => setSize(parseInt(e.target.value))}
          className="w-24 accent-primary"
        />
      </div>

      <div className="divider-v" />

      {/* Actions */}
      <div className="toolbar-section">
        <button className="toolbar-btn text-danger" onClick={onClear} title="Clear All">
          <Trash2 size={18} />
        </button>
        <button className="toolbar-btn text-primary" onClick={onSave} title="Save to Cloud">
          <Save size={18} />
        </button>
        <button className="toolbar-btn" onClick={onExport} title="Export as PNG">
          <Download size={18} />
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
