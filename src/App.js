import React, { useState, useRef} from 'react';
import { ChromePicker } from 'react-color';
import './utils/pixel-perfect.js';
import './App.css';

function App() {
  // Constants handling drawing canvas directly
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 512 });
  const [scale, setScale] = useState(1);

  // Constants handling drawing functions
  const [isDrawing, setIsDrawing] = useState(false);
  const drawSize = 3;
  const lastPos = useRef(null);

  // Constants handling colors and color changes
  const [selectedColor, setSelectedColor] = useState('#000000'); // Init with default to black
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Toggle color picker state
  const togglePicker = () => {
    setIsPickerOpen(prev => !prev);
  };

  // Handles the user selecting a color
  const handleColorChange = (color) => {
    // Update selected color for the user globally
    setSelectedColor(color.hex);
  };

  // Helper to get mouse position
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Return mouse coords
    return {
      x: Math.floor((e.clientX - rect.left) / scale),
      y: Math.floor((e.clientY - rect.top) / scale)
    };
  };

  // Set isDrawing event to true
  const startDrawing = (e) => {
    // Set drawing value
    setIsDrawing(true);

    // Set up interpolation for smoother drawing
    const { x, y } = getMousePos(e);
    lastPos.current = { x, y };
    drawAt(x, y);
  };

  // Reset isDrawing event to false
  const endDrawing = () => {
    // Set drawing value and reset lastPos
    setIsDrawing(false);
    lastPos.current = null;
  };

  // Handles the user drawing on the canvas
  const draw = (e) => {
    // Exit function if isDrawing is false
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const { x, y } = getMousePos(e);

    // Interpolation calcs (funny math that I totally for sure did without any help)
    const prev = lastPos.current;
    if(prev) {
      // Get difference from current coords to lastPos
      const dx = x - prev.x;
      const dy = y - prev.y;
      
      // Get a hypotenuse to fill in
      const distance = Math.hypot(dx, dy);

      // Calculate how many circles are needed to appropriately fill distance
      const steps = Math.ceil(distance / (drawSize / 2));

      // Interpolate the necessary circles
      for (let i = 0; i<= steps; i++) {
        const interpX = prev.x + (dx * i) / steps;
        const interpY = prev.y + (dy * i) / steps;
        drawAt(interpX, interpY);
      }
    }

    // Update lastPos to current position
    lastPos.current = { x, y };
  };

  // Helper function for interpolation w/ circular brush
  const drawAt = (x, y) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // More circles to fill in gaps
    context.fillStyle = selectedColor;
    context.beginPath();
    context.arc(x, y, drawSize / 2, 0, 2 * Math.PI);
    context.fill();
  }

  return (
    <div className="App">
      <header className="header">
        Resume Test
      </header>
      <div ref={canvasContainerRef} className="canvas-container">
        <canvas
          ref={canvasRef}
          width={5000}
          height={5000}
          class="pixel-perfect"
          className="drawing-canvas"
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onMouseMove={draw}
        ></canvas>
      </div>
      <div className={`color-picker-panel ${isPickerOpen ? 'open' : ''}`}>
        <div className="picker-tab" onClick={togglePicker}>
          {isPickerOpen ? '▶' : '◀'}
        </div>
        <ChromePicker
          color={selectedColor}
          onChange={handleColorChange}
          disableAlpha
        />
      </div>
    </div>
  );
}

export default App;
