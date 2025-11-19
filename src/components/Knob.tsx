import React, { useState, useEffect, useRef } from 'react';
import './Knob.css';

interface KnobProps {
  label: string;
  min?: number;
  max?: number;
  value: number;
  onChange: (value: number) => void;
}

export const Knob: React.FC<KnobProps> = ({ label, min = 0, max = 100, value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartValue(value);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startY - e.clientY;
      const range = max - min;
      const deltaValue = (deltaY / 100) * range; // 100px drag = full range
      const newValue = Math.min(max, Math.max(min, startValue + deltaValue));
      onChange(newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startValue, min, max, onChange]);

  // Calculate rotation based on value (mapping min-max to -135deg to 135deg)
  const percentage = (value - min) / (max - min);
  const rotation = -135 + (percentage * 270);

  return (
    <div className="knob-container">
      <div className="knob-label">{label}</div>
      <div 
        className="knob-outer" 
        onMouseDown={handleMouseDown}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="knob-inner">
          <div className="knob-indicator"></div>
        </div>
      </div>
    </div>
  );
};


