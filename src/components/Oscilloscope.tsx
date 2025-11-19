import React, { useRef, useEffect } from "react";

interface OscilloscopeProps {
  shape: number; // 0-100
  speed: number; // 0-100
  variation: number; // 0-100
  color: number; // 0-100
}

// Map color value (0-100) to a color range
const getBeamColor = (value: number): string => {
  // Color spectrum: Cyan -> Green -> Yellow -> Orange -> Red -> Magenta
  const colors = [
    { pos: 0, color: "#00ffff" }, // Cyan
    { pos: 20, color: "#00ff00" }, // Green
    { pos: 40, color: "#88ff00" }, // Yellow-green
    { pos: 60, color: "#ffff00" }, // Yellow
    { pos: 80, color: "#ff8800" }, // Orange
    { pos: 100, color: "#ff00ff" }, // Magenta
  ];

  // Find the two colors to interpolate between
  let lower = colors[0];
  let upper = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (value >= colors[i].pos && value <= colors[i + 1].pos) {
      lower = colors[i];
      upper = colors[i + 1];
      break;
    }
  }

  // Interpolate between the two colors
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

  return `#${r.toString(16).padStart(2, "0")}${g
    .toString(16)
    .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
};

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  shape,
  speed,
  variation,
  color,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>();
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle canvas resize
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      // Radius of the globe
      // Reduced by 25% from original 0.45 factor (0.45 * 0.75 = 0.3375)
      const radius = Math.min(width, height) * 0.3375;

      // Clear entire canvas
      ctx.fillStyle = "rgba(5, 5, 5, 1)";
      ctx.fillRect(0, 0, width, height);

      // --- Fixed Background Grid ---
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(40, 40, 40, 1)"; // Subtle grid color
      const gridSize = 20;

      ctx.beginPath();
      // Vertical lines
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      // Horizontal lines
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // --- 1. Circular Mask & Globe Background ---
      ctx.save();
      ctx.beginPath();
      // Create a circular mask centered on the screen
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Globe background (within mask)
      // Make background transparent so we see the grid behind it
      // Removed clearRect and fillRect to allow underlying grid to show through

      // --- 2. The Beam (Projected onto Sphere) ---

      // Get beam color based on color knob value
      const beamColor = getBeamColor(color);

      // Parameters mapped from props
      const speedFactor = (speed / 50) * 0.05 + 0.01;
      timeRef.current += speedFactor;

      // Shape affects the Lissajous frequency ratio
      const freqX = 1 + shape / 100;
      const freqY = 3;
      // Variation adds noise/jitter
      const noiseMagnitude = (variation / 100) * 0.1; // Reduced noise for sphere math stability

      // Rotation speed for the globe/wave spin
      const rotAngle = timeRef.current * 0.2;
      const cosRot = Math.cos(rotAngle);
      const sinRot = Math.sin(rotAngle);

      // Generate the path points once
      const pathPoints: Array<{ x: number; y: number }> = [];
      const pathLength = Math.PI * 2 * 10;
      for (let i = 0; i < pathLength; i += 0.05) {
        const t = timeRef.current + i;

        // Map standard Lissajous to spherical angles
        // x -> Longitude (-PI to PI)
        // y -> Latitude (-PI/2 to PI/2)

        const rawX = Math.sin(t * freqX);
        const rawY = Math.cos(t * freqY);

        // Add noise to raw values
        const nX = rawX + (Math.random() - 0.5) * noiseMagnitude;
        const nY = rawY + (Math.random() - 0.5) * noiseMagnitude;

        const lon = nX * Math.PI;
        const lat = nY * (Math.PI / 2) * 0.9; // 0.9 to avoid pinching at poles too hard

        // 3D Coordinates on Sphere of radius 'radius'
        // Standard spherical to cartesian:
        // x = r * cos(lat) * sin(lon)
        // y = r * sin(lat)
        // z = r * cos(lat) * cos(lon)

        let pX = radius * Math.cos(lat) * Math.sin(lon);
        let pY = radius * Math.sin(lat);
        let pZ = radius * Math.cos(lat) * Math.cos(lon);

        // Apply Y-axis Rotation (Spin)
        const rotX = pX * cosRot - pZ * sinRot;
        const rotZ = pX * sinRot + pZ * cosRot;
        pX = rotX;
        pZ = rotZ;

        // Project to 2D (Simple Orthographic)
        const screenX = centerX + pX;
        const screenY = centerY + pY;

        pathPoints.push({ x: screenX, y: screenY });
      }

      // --- Draw Central Core FIRST (so beam appears in front) ---

      // Central sphere size (proportional to main sphere) - BIGGER
      const coreRadius = radius * 0.12;

      // Function to create organic jelly blob shape
      const createBlobPath = (baseRadius: number, complexity: number = 8) => {
        const points = [];
        for (let i = 0; i < complexity; i++) {
          const angle = (i / complexity) * Math.PI * 2;
          // Add organic jelly-like variation with multiple frequencies
          const variation =
            Math.sin(angle * 2 + timeRef.current * 0.8) * 0.25 +
            Math.sin(angle * 4 - timeRef.current * 1.2) * 0.18 +
            Math.sin(angle * 6 + timeRef.current * 1.5) * 0.12 +
            Math.sin(timeRef.current * 0.5) * 0.08;
          const r = baseRadius * (1 + variation);
          points.push({
            x: centerX + Math.cos(angle) * r,
            y: centerY + Math.sin(angle) * r,
          });
        }
        return points;
      };

      // Draw blob-shaped core with multiple glow layers
      const coreGlowLayers = [
        { blur: 40, radius: coreRadius * 2.5, alpha: 0.25, complexity: 8 },
        { blur: 28, radius: coreRadius * 1.8, alpha: 0.4, complexity: 8 },
        { blur: 18, radius: coreRadius * 1.3, alpha: 0.55, complexity: 8 },
        { blur: 10, radius: coreRadius * 0.9, alpha: 0.75, complexity: 8 },
      ];

      coreGlowLayers.forEach((layer) => {
        ctx.globalAlpha = layer.alpha;
        ctx.shadowBlur = layer.blur;
        ctx.shadowColor = beamColor;

        // Create gradient at center for glow effect
        const coreGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          layer.radius * 1.5
        );
        coreGradient.addColorStop(0, beamColor);
        coreGradient.addColorStop(0.5, beamColor);
        coreGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = coreGradient;

        // Draw blob shape
        const blobPoints = createBlobPath(layer.radius, layer.complexity);
        ctx.beginPath();
        blobPoints.forEach((point, i) => {
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            // Use quadratic curves for smooth organic shape
            const prevPoint = blobPoints[i - 1];
            const cpX = (prevPoint.x + point.x) / 2;
            const cpY = (prevPoint.y + point.y) / 2;
            ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpX, cpY);
          }
        });
        // Close the blob
        const firstPoint = blobPoints[0];
        const lastPoint = blobPoints[blobPoints.length - 1];
        ctx.quadraticCurveTo(
          lastPoint.x,
          lastPoint.y,
          firstPoint.x,
          firstPoint.y
        );
        ctx.closePath();
        ctx.fill();
      });

      // Bright blob core center
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 15;
      const brightCore = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        coreRadius * 1.2
      );
      brightCore.addColorStop(0, "#ffffff");
      brightCore.addColorStop(0.3, beamColor);
      brightCore.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = brightCore;

      // Draw bright center blob
      const centerBlobPoints = createBlobPath(coreRadius * 0.7, 8);
      ctx.beginPath();
      centerBlobPoints.forEach((point, i) => {
        if (i === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          const prevPoint = centerBlobPoints[i - 1];
          const cpX = (prevPoint.x + point.x) / 2;
          const cpY = (prevPoint.y + point.y) / 2;
          ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, cpX, cpY);
        }
      });
      const firstPoint = centerBlobPoints[0];
      const lastPoint = centerBlobPoints[centerBlobPoints.length - 1];
      ctx.quadraticCurveTo(
        lastPoint.x,
        lastPoint.y,
        firstPoint.x,
        firstPoint.y
      );
      ctx.closePath();
      ctx.fill();

      // --- Draw Smooth Goo-ey Tendrils from Core to Beam ---

      // Number of tendrils varies with time for organic effect
      const tendrilCount = Math.floor(4 + Math.random() * 3); // 4-6 tendrils

      // Randomly select points from the beam path
      const selectedPoints = [];
      for (let i = 0; i < tendrilCount && pathPoints.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * pathPoints.length);
        selectedPoints.push(pathPoints[randomIndex]);
      }

      // Draw smooth, organic tendrils
      selectedPoints.forEach((endPoint) => {
        // Random variations for pulsing effect
        const tendrilAlpha = 0.4 + Math.random() * 0.3;
        const tendrilIntensity = 0.6 + Math.random() * 0.4;

        // Create smooth Bezier curve
        // Control points for organic S-curve
        const dx = endPoint.x - centerX;
        const dy = endPoint.y - centerY;

        // Add smooth, wave-like offset
        const angle = Math.atan2(dy, dx);
        const perpAngle = angle + Math.PI / 2;
        const waveOffset =
          (Math.sin(timeRef.current * 2 + angle) * 0.3 + 0.5) * 20;

        // Control point 1: 1/3 of the way with perpendicular offset
        const cp1x = centerX + dx * 0.33 + Math.cos(perpAngle) * waveOffset;
        const cp1y = centerY + dy * 0.33 + Math.sin(perpAngle) * waveOffset;

        // Control point 2: 2/3 of the way with opposite perpendicular offset
        const cp2x =
          centerX +
          dx * 0.67 +
          Math.cos(perpAngle + Math.PI) * waveOffset * 0.7;
        const cp2y =
          centerY +
          dy * 0.67 +
          Math.sin(perpAngle + Math.PI) * waveOffset * 0.7;

        // Draw tendril with multiple glow layers for smooth, goo-ey effect
        const tendrilGlowLayers = [
          { blur: 25, width: 8, alpha: tendrilAlpha * 0.2 * tendrilIntensity },
          { blur: 15, width: 5, alpha: tendrilAlpha * 0.4 * tendrilIntensity },
          { blur: 8, width: 3, alpha: tendrilAlpha * 0.6 * tendrilIntensity },
        ];

        tendrilGlowLayers.forEach((layer) => {
          ctx.beginPath();
          ctx.strokeStyle = beamColor;
          ctx.globalAlpha = layer.alpha;
          ctx.lineWidth = layer.width;
          ctx.shadowBlur = layer.blur;
          ctx.shadowColor = beamColor;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          ctx.moveTo(centerX, centerY);
          ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endPoint.x, endPoint.y);
          ctx.stroke();
        });

        // Bright core tendril line
        ctx.globalAlpha = tendrilAlpha * tendrilIntensity * 0.8;
        ctx.lineWidth = 1.5;
        ctx.shadowBlur = 6;
        ctx.strokeStyle = beamColor;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endPoint.x, endPoint.y);
        ctx.stroke();
      });

      // Reset alpha and shadow before drawing beam
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      // Draw multiple glow layers for enhanced glow effect
      // Outer glow layers (widest, most transparent)
      const glowLayers = [
        { blur: 40, width: 8, alpha: 0.15 },
        { blur: 25, width: 6, alpha: 0.25 },
        { blur: 15, width: 4, alpha: 0.4 },
        { blur: 8, width: 3, alpha: 0.6 },
      ];

      glowLayers.forEach((layer) => {
        ctx.beginPath();
        ctx.strokeStyle = beamColor;
        ctx.globalAlpha = layer.alpha;
        ctx.lineWidth = layer.width;
        ctx.shadowBlur = layer.blur;
        ctx.shadowColor = beamColor;

        pathPoints.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
      });

      // Core beam (bright center line)
      ctx.globalAlpha = 1.0;
      ctx.lineWidth = 2;
      ctx.shadowBlur = 5;
      ctx.shadowColor = beamColor;
      ctx.strokeStyle = beamColor;

      ctx.beginPath();
      pathPoints.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();

      // Reset alpha
      ctx.globalAlpha = 1.0;

      /*
      // Draw Grid
      
      ctx.strokeStyle = 'rgba(57, 255, 20, 0.15)';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 0;
      
      // Draw Longitude lines
      for (let ln = -180; ln < 180; ln += 30) {
        ctx.beginPath();
        const radLon = ln * Math.PI / 180;
        
        for (let lt = -90; lt <= 90; lt += 5) {
          const radLat = lt * Math.PI / 180;
          
          let gX = radius * Math.cos(radLat) * Math.sin(radLon);
          let gY = radius * Math.sin(radLat);
          let gZ = radius * Math.cos(radLat) * Math.cos(radLon);

          // Apply same rotation to grid
          const gRotX = gX * cosRot - gZ * sinRot;
          const gRotZ = gX * sinRot + gZ * cosRot;
          
          const sx = centerX + gRotX;
          const sy = centerY + gY;
          
          if (lt === -90) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }

      // Draw Latitude lines
      for (let lt = -60; lt <= 60; lt += 30) {
        ctx.beginPath();
        const radLat = lt * Math.PI / 180;
        
        for (let ln = -180; ln <= 180; ln += 5) {
          const radLon = ln * Math.PI / 180;
          
          let gX = radius * Math.cos(radLat) * Math.sin(radLon);
          let gY = radius * Math.sin(radLat);
          let gZ = radius * Math.cos(radLat) * Math.cos(radLon);

          const gRotX = gX * cosRot - gZ * sinRot;
          const gRotZ = gX * sinRot + gZ * cosRot;
          
          const sx = centerX + gRotX;
          const sy = centerY + gY;
          
          if (ln === -180) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
      */

      // Restore to remove clip
      ctx.restore();

      // --- 3. Overlay Elements (Outside or On Top of Mask) ---

      // Glass/Sphere Shine Reflection
      const shineGradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        5,
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.8
      );
      shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
      shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = shineGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      frameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [shape, speed, variation, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        background: "#050505",
        borderRadius: "20px",
      }}
    />
  );
};
