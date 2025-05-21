import React, { useState, useEffect, useRef, useCallback } from 'react';
import './utils/pixel-perfect.js';
import './App.css';

function App() {
  // constants handling drawing canvas directly
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 512, height: 512 }); // try to make this modular later
  const [scale, setScale] = useState(1);

  // Constants handling colors and color changes
  const [selectedColor, setSelectedColor] = useState('#000000'); // Init with default to black
  const [highlightedPixel, setHighlightedPixel] = useState(null);
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
  const [sendButtonColor, setSendButtonColor] = useState(colors[0].hex);

  // Handles the user selecting a color
  const handleColorChange = (color) => {
  }

  // Handles the user drawing on the canvas
  const handleCanvasClick = (color) => {
  }

  return (
    <div className="App">
      <header className="header">
        resume test
      </header>
      <div ref={canvasContainerRef} className="canvas-container">
        <canvas ref={canvasRef} id="resumeCanvas"
          onClick={handleCanvasClick}
          width="514" height="514" class="pixel-perfect" style={{ width: "514px", height: "514px" }}
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
