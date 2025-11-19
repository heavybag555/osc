import { useState, useMemo } from 'react';
import './App.css';
import { Knob } from './components/Knob';
import { Oscilloscope } from './components/Oscilloscope';

// Map color value (0-100) to a color range (same as in Oscilloscope)
const getBeamColor = (value: number): string => {
  const colors = [
    { pos: 0, color: "#00ffff" }, // Cyan
    { pos: 20, color: "#00ff00" }, // Green
    { pos: 40, color: "#88ff00" }, // Yellow-green
    { pos: 60, color: "#ffff00" }, // Yellow
    { pos: 80, color: "#ff8800" }, // Orange
    { pos: 100, color: "#ff00ff" }, // Magenta
  ];

  let lower = colors[0];
  let upper = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (value >= colors[i].pos && value <= colors[i + 1].pos) {
      lower = colors[i];
      upper = colors[i + 1];
      break;
    }
  }

  const range = upper.pos - lower.pos;
  const rangeValue = value - lower.pos;
  const ratio = rangeValue / range;

  const lowerRGB = {
    r: parseInt(lower.color.slice(1, 3), 16),
    g: parseInt(lower.color.slice(3, 5), 16),
    b: parseInt(lower.color.slice(5, 7), 16),
  };

  const upperRGB = {
    r: parseInt(upper.color.slice(1, 3), 16),
    g: parseInt(upper.color.slice(3, 5), 16),
    b: parseInt(upper.color.slice(5, 7), 16),
  };

  const r = Math.round(lowerRGB.r + (upperRGB.r - lowerRGB.r) * ratio);
  const g = Math.round(lowerRGB.g + (upperRGB.g - lowerRGB.g) * ratio);
  const b = Math.round(lowerRGB.b + (upperRGB.b - lowerRGB.b) * ratio);

  return `${r}, ${g}, ${b}`; // Return as RGB values for rgba()
};

function App() {
  const [shape, setShape] = useState(50);
  const [speed, setSpeed] = useState(30);
  const [variation, setVariation] = useState(10);
  const [color, setColor] = useState(50);

  // Calculate the current beam color RGB values
  const beamColorRGB = useMemo(() => getBeamColor(color), [color]);

  return (
    <div className="app-container">
      <div className="tv-chassis">
        <div className="tv-screen-bezel">
          <div 
            className="tv-screen"
            style={{
              boxShadow: `
                0 0 40px rgba(${beamColorRGB}, 0.15),
                0 0 60px rgba(${beamColorRGB}, 0.1),
                0 0 80px rgba(${beamColorRGB}, 0.05),
                inset 0 0 30px rgba(0, 0, 0, 0.9),
                inset 0 0 8px rgba(255, 255, 255, 0.15)
              `
            }}
          >
            <Oscilloscope shape={shape} speed={speed} variation={variation} color={color} />
            <div className="screen-overlay"></div>
          </div>
        </div>
        
        <div className="tv-controls">
          {/* Styled as heat vents */}
          <div className="speaker-grill">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grill-line"></div>
            ))}
          </div>
          
          <div className="knobs-panel">
            <Knob 
              label="FREQ" 
              value={shape} 
              onChange={setShape} 
              min={0} 
              max={100} 
            />
            <Knob 
              label="RATE" 
              value={speed} 
              onChange={setSpeed} 
              min={0} 
              max={100} 
            />
            <Knob 
              label="FLUX" 
              value={variation} 
              onChange={setVariation} 
              min={0} 
              max={100} 
            />
            <Knob 
              label="COLOR" 
              value={color} 
              onChange={setColor} 
              min={0} 
              max={100} 
            />
          </div>
          
          <div className="tv-brand">
            B.D. Technologies
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
