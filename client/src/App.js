import React, { useState, useRef, useEffect} from 'react';
import { ChromePicker } from 'react-color';
import './utils/pixel-perfect.js';
import './App.css';

function App() {
  // Constants handling drawing canvas directly
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const velocity = useRef({ x: 0, y: 0 });
  const animationFrameID = useRef(null);

  // Constants handling drawing functions
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawSize, setDrawSize] = useState(3);
  const lastPos = useRef(null);
  const saveTimeout = useRef(null);

  // Constants handling colors and color changes
  const [selectedColor, setSelectedColor] = useState('#000000'); // Init with default to black
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  // Constants handling drag momentum
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const scrollStart = useRef({ x: 0, y: 0 });
  const lastDrag = useRef({ time: 0, x: 0, y: 0 });

  // Constant handling text overlay
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);



  // On load actions
  useEffect(() => {
    // Load the most up-to-date canvas art
    loadLatestCanvas();

    // Center the canvas
    const wrapper = canvasContainerRef.current;
    if (wrapper) {
      wrapper.scrollLeft = (canvasRef.current.width - wrapper.clientWidth) / 2;
      wrapper.scrollTop = (canvasRef.current.height - wrapper.clientHeight) / 2;
    }

    // Prevent context menu
    const preventContextMenu = (e) => e.preventDefault();
    window.addEventListener("contextmenu", preventContextMenu);
    return () => {
      window.removeEventListener("contextmenu", preventContextMenu);
    }
  }, []);



  // Toggle color picker state
  const togglePicker = () => setIsPickerOpen(prev => !prev);

  // Enable overlay toggle
  const toggleOverlay = () => setIsOverlayVisible(prev => !prev);

  // Handles the user selecting a color
  const handleColorChange = (color) => setSelectedColor(color.hex);



  // Helper to get mouse position
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Return mouse coords
    return {
      x: Math.floor(e.clientX - rect.left),
      y: Math.floor(e.clientY - rect.top)
    };
  };



  // Handle left/right mouse clicks
  const handleMouseDown = (e) => {
    if (e.button === 2) { // Right cick
      e.preventDefault();

      // Cancel any currently active momentum immediately
      if (animationFrameID.current !== null) {
        cancelAnimationFrame(animationFrameID.current);
        animationFrameID.current = null;
      }
      velocity.current = { x: 0, y: 0 };

      // Always assume click-and-drag
      isDragging.current = true;

      // Drag timer for momentum
      lastDrag.current = { time: performance.now(), x: e.clientX, y: e.clientY };

      // Get positions to determine wrapper velocity later
      dragStart.current = { x: e.clientX, y: e.clientY };
      const wrapper = canvasContainerRef.current;
      scrollStart.current = { x: wrapper.scrollLeft, y: wrapper.scrollTop };
    } else if (e.button === 0) { // Left click
      startDrawing(e);
    }
  };

  // Handle right/left click-and-drag
  const handleMouseMove = (e) => {
    if (isDragging.current) {
      e.preventDefault();

      // Get positional differences
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      // Set up scrolling variables to allow momentum to keep moving the canvas
      const wrapper = canvasContainerRef.current;
      wrapper.scrollLeft = scrollStart.current.x - dx;
      wrapper.scrollTop = scrollStart.current.y - dy;

      // Keep track of momentum through velocity
      // Also track velocity per 16 frames(?) to properly determine momentum
      const now = performance.now();
      const dt = now - lastDrag.current.time || 16;
      velocity.current = {
        x: -((e.clientX - lastDrag.current.x) / dt * 16) * 0.5,
        y: -((e.clientY - lastDrag.current.y) / dt * 16) * 0.5
      };
      lastDrag.current = { time: now, x: e.clientX, y: e.clientY };
    } else if (e.buttons === 1) {
      draw(e);
    }
  };

  // Stop click-and-drag events
  const handleMouseUp = (e) => {
    if (e.button === 2) {
      isDragging.current = false;

      // Employ velocity check for a minimum threshold before applying momentum
      const speed = Math.hypot(velocity.current.x, velocity.current.y);
      if (speed > 3) {
        startMomentum();
      } else {
        velocity.current = { x: 0, y: 0 };
      }
    } else if (e.button === 0) {
      // End drawing
      endDrawing();

      // Check if there is a timeout set to prevent too many POSTs
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      saveTimeout.current = setTimeout(() => {
        const canvas = canvasRef.current;
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result;
            fetch('/.netlify/functions/server/save-canvas', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64data })
            }).then(res => {
              if(!res.ok) console.error('Save failed');
            });
          };
          if (blob) {
            reader.readAsDataURL(blob);
          }
        }, 'image/png');
      }, 2000); // Add a 2s delay before next save is allowed
    }
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
    if (!isDrawing || e.buttons !== 1) return;
    // Interpolation calcs (funny math that I totally for sure did without any help)
    const { x, y } = getMousePos(e);
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
  };



  // Momentum handler
  const startMomentum = () => {
    const wrapper = canvasContainerRef.current;
    let { x, y } = velocity.current;

    // Adjust to tweak downward velocity scaling
    const step = () => {
      x *= 0.95;
      y *= 0.95;
      wrapper.scrollLeft += x;
      wrapper.scrollTop += y;

      if(Math.abs(x) > 0.5 || Math.abs(y) > 0.5) {
        animationFrameID.current = requestAnimationFrame(step);
      } else {
        cancelAnimationFrame(animationFrameID.current);
      }
    };

    animationFrameID.current = requestAnimationFrame(step);
  };

  // Helper function to cancel click-and-drag when entering a UI element
  const cancelDrag = () => {
    startMomentum();
    velocity.current = { x: 0, y: 0 };
    lastPos.current = null;
    isDragging.current = false;
  };

  // Helper function to load the latest canvas art
  const loadLatestCanvas = () => {
    // Set up canvas
    fetch('/netlify/functions/server/latest-canvas')
    .then(res => res.json())
    .then(data => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const context = canvasRef.current.getContext('2d');
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        context.drawImage(img, 0, 0);
      };
      img.src = data.url;
    });
  };



  return (
    <div className="App">
      {!isOverlayVisible && (
        <div className="overlay-tab"
        onClick={toggleOverlay}
        onMouseEnter={cancelDrag}>
          ▶
        </div>
      )}
      {isOverlayVisible && (
        <div className={`canvas-overlay ${isOverlayVisible ? 'visible' : ''}`}>
          <div className="overlay-bar">
            <span>Placeholder Text</span>
            <div className="overlay-hide-button" onClick={toggleOverlay}>
              Let Me Draw!
            </div>
          </div>
        </div>
      )}
      <div ref={canvasContainerRef}
        className={`canvas-container ${isOverlayVisible ? 'disabled' : ''}`}>
        <canvas
          ref={canvasRef}
          width={5000}
          height={5000}
          className="drawing-canvas"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={endDrawing}
          onMouseMove={handleMouseMove}
        />
      </div>
      {!isOverlayVisible && (
        <div className={`color-picker-panel ${isPickerOpen ? 'open' : ''}`}
        onMouseEnter={cancelDrag}>
          <div className="picker-tab" onClick={togglePicker}>
            {isPickerOpen ? '▶' : '◀'}
          </div>
          <div className="color-picker-wrapper">
            <ChromePicker
              color={selectedColor}
              onChange={handleColorChange}
              disableAlpha
            />
          </div>
          <div className="brush-slider-container"
          onMouseEnter={cancelDrag}>
            <input
              type="range"
              min="2"
              max="10"
              value={drawSize}
              onChange={(e) => setDrawSize(Number(e.target.value))}
              className="brush-slider"
              orient="vertical"
            />
            <div className="brush-labels">
              <div className="brush-label brush-size-large"/>
              <div className="brush-label brush-size-medium"/>
              <div className="brush-label brush-size-small"/>
            </div>
          </div>
          <div className="refresh-button" onClick={loadLatestCanvas}>
            <img src="/refresh.png" alt="refresh canvas"/>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
