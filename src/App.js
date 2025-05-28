import React, { useState, useEffect, useRef, useCallback } from 'react';
import './utils/pixel-perfect.js';
import './App.css';

function App() {
  // Constants handling drawing canvas directly
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 512 }); // try to make this modular later
  const [scale, setScale] = useState(1);

  // Constants handling drawing functions
  const [isDrawing, setIsDrawing] = useState(false);
  const drawSize = 3;
  const lastPos = useRef(null);

  // Constants handling colors and color changes
  const [selectedColor, setSelectedColor] = useState('#000000'); // Init with default to black
  const colors = [ // Array of all 32 colors available to users
    { name: 'burgundy', hex: '#6d001a' }, { name: 'darkred', hex: '#be0039' },
    { name: 'red', hex: '#ff4500' }, { name: 'orange', hex: '#ffa800' },
    { name: 'yellow', hex: '#ffd635' }, { name: 'cream', hex: '#fff8b8' },
    { name: 'darkgreen', hex: '#00a368' }, { name: 'green', hex: '#00cc78' },
    { name: 'lime', hex: '#7eed56' }, { name: 'darkteal', hex: '#00756f' },
    { name: 'teal', hex: '#009eaa' }, { name: 'lightteal', hex: '#00ccc0' },
    { name: 'darkblue', hex: '#2450a4' }, { name: 'blue', hex: '#3690ea' },
    { name: 'cyan', hex: '#51e9f4' }, { name: 'indigo', hex: '#493ac1' },
    { name: 'periwinkle', hex: '#6a5cff' }, { name: 'lavender', hex: '#94b3ff' },
    { name: 'darkpurple', hex: '#811e9f' }, { name: 'purple', hex: '#b44ac0' },
    { name: 'palepurple', hex: '#e4abff' }, { name: 'magenta', hex: '#de107f' },
    { name: 'pink', hex: '#ff3881' }, { name: 'palepink', hex: '#ff99aa' },
    { name: 'darkbrown', hex: '#6d482f' }, { name: 'brown', hex: '#9c6926' },
    { name: 'beige', hex: '#ffb470' }, { name: 'black', hex: '#000000' },
    { name: 'darkgrey', hex: '#515252' }, { name: 'grey', hex: '#898d90' },
    { name: 'lightgrey', hex: '#d4d7d9' }, { name: 'white', hex: '#ffffff' }
  ]

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
        resume test
      </header>
      <div ref={canvasContainerRef} className="canvas-container">
        <canvas ref={canvasRef} id="resumeCanvas"
          width={canvasSize.width}
          height={canvasSize.height}
          className="pixel-perfect"
          style={{ width: canvasSize.width, height: canvasSize.height }}
          onMouseDown={startDrawing}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onMouseMove={draw}
        ></canvas>
      </div>
      <div className="colorBar">
        {colors.map((color) => (
          <div
            key={color.name}
            className={`colorButton ${color.name}`}
            data-color={color.name}
            style={{ backgroundColor: color.hex }}
            onClick={() => handleColorChange(color)}
          ></div>
        ))}
      </div>
    </div>
  );
}

export default App;
