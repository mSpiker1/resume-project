import React, { useState, useRef, useEffect} from 'react';
import { ChromePicker } from 'react-color';
import AnimatedName from './utils/AnimatedName.js';
import { db } from "./utils/firebase.js";
import './App.css';
import { ref, onChildAdded, update } from '@firebase/database';

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
  const [isOverlayClosed, setIsOverlayClosed] = useState(false);
  const [overlayBarLoaded, setOverlayBarLoaded] = useState(false);

  // Constants for firebase relatime db
  const pendingUpdates = useRef({});
  const batchTimeout = useRef(null);
  const renderTimeout = useRef(null);



  // On load actions
  useEffect(() => {
    // Apply unique animations if page just loaded
    if (isOverlayVisible && !isOverlayClosed) {
      setTimeout(() => {
        setOverlayBarLoaded(true);
      }, 10);
    }

    // Load firebase realtime canvas
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const strokes = [];

    const unsub = onChildAdded(ref(db, 'canvas'), (snapshot) => {
      const[x, y] = snapshot.key.split('_').map(Number);
      const {
        color,
        size = 3, // Default size to 3 if not found
        timestamp
      } = snapshot.val();

      // Put pixels into an array to sort by timestamp later
      strokes.push({ x, y, color, size, timestamp });

      if(!renderTimeout.current) {
        renderTimeout.current = setTimeout(() => {
          strokes.sort((a, b) => a.timestamp - b.timestamp);
          strokes.forEach(({ x, y, color, size }) => {
            context.fillStyle = color;
            context.beginPath();
            context.arc(x, y, size / 2, 0, 2 * Math.PI);
            context.fill();
          });
          renderTimeout.current = null;
        }, 100);
      }
    });

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
      unsub();
      window.removeEventListener("contextmenu", preventContextMenu);
    }
  }, [isOverlayVisible, isOverlayClosed]);



  // Firebase pixel updates
  const queuePixelUpdate = (x, y, color, size) => {
    const key = `${Math.floor(x)}_${Math.floor(y)}`;
    pendingUpdates.current[key] = { color, size, timestamp: Date.now() };

    if (batchTimeout.current) clearTimeout(batchTimeout.current);

    batchTimeout.current = setTimeout(() => {
      updateFirebasePixels(pendingUpdates.current);
      pendingUpdates.current = {};
    }, 200);
  };

  const updateFirebasePixels = async (updates) => {
    try {
      await update(ref(db, 'canvas'), updates);
    } catch (err) {
      console.error("Firebase update failed");
    }
  };



  // Toggle color picker state
  const togglePicker = () => setIsPickerOpen(prev => !prev);

  // Handle overlay bar and background animations
  const toggleOverlay = () => {
    if (isOverlayVisible) {
      // Trigger closing animation
      setIsOverlayClosed(true);

      // Wait to unmount until after the animation ends
      setTimeout(() => {
        setIsOverlayVisible(false);
      }, 500); // Match CSS transition delay (0.5s)
    } else {
      // Remount and trigger open animation
      setIsOverlayVisible(true);

      setTimeout(() => {
        setIsOverlayClosed(false);
      }, 10); // One frame delay to allow .closed to be applied
    }
  }

  // Handles the user selecting a color
  const handleColorChange = (color) => setSelectedColor(color.hex);



  // Helper to get mouse position
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const BORDER_WIDTH = 15;

    return {
      x: Math.floor(e.clientX - rect.left - BORDER_WIDTH),
      y: Math.floor(e.clientY - rect.top - BORDER_WIDTH)
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

      if ( batchTimeout.current) {
        clearTimeout(batchTimeout.current);
        updateFirebasePixels(pendingUpdates.current);
        pendingUpdates.current = {};
      }
    }
  };



  // Handler for starting drawing process
  const startDrawing = (e) => {
    setIsDrawing(true);

    // Set up interpolation for smoother drawing
    const { x, y } = getMousePos(e);
    lastPos.current = { x, y };
    drawAt(x, y);
  };

  // Reset isDrawing event to false and reset lastPos
  const endDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  // Handles the user drawing on the canvas
  const draw = (e) => {
    if (!isDrawing || e.buttons !== 1) return;

    // Interpolation calcs
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

    // Calculate all pixels that need updating (brush size)
    const radius = drawSize / 2;
    const minX = Math.floor(x - radius);
    const maxX = Math.ceil(x + radius);
    const minY = Math.floor(y - radius);
    const maxY = Math.floor(y + radius);

    queuePixelUpdate(x, y, selectedColor, drawSize);
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



  return (
    <div className="App">
      {isOverlayVisible && (
        <div className={`canvas-overlay ${isOverlayClosed ? 'closed' : ''}`}>
          <div className={`overlay-bar ${overlayBarLoaded ? 'loaded' : ''}`}>
            <span>Hi, my name is <AnimatedName /></span>
            <div className="desc-text">
              <span>
                I made this website as a fun way to advertise myself<br/>
                and my skills to potential employers. If you click the<br/>
                draw button, you'll hide this bar and be shown a large<br/>
                canvas, where you can leave a little drawing to show <br/>
                you've been here. I'm still working on this project, so<br/>
                keep an eye out for changes at my GitHub repository for it.
              </span>
            </div>
            <div className="overlay-hide-button" onClick={toggleOverlay}>
              Draw
            </div>
            <div className="overlay-footer">
              <div className="overlay-footer-item">
                <img src="/github-icon.png" alt="GitHub" />
                <a
                  href="https://github.com/mSpiker1"
                  target="_blank"
                  rel="noopener noreferrer"
                >GitHub</a>
              </div>
              <div className="overlay-footer-item">
                <img src="/email-icon.png" alt="Email" />
                <span>mspiker98@outlook.com</span>
              </div>
              <div className="overlay-footer-item">
                <img src="/linkedin-icon.png" alt="LinkedIn" />
                <a
                  href="https://linkedin.com/in/matthew-spiker-4a3613179"
                  target="_blank"
                  rel="noopener noreferrer"
                >LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={`overlay-tab ${isOverlayClosed ? 'visible' : 'hidden'}`}
      onClick={toggleOverlay}
      onMouseEnter={cancelDrag}>
        ▶
      </div>
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
          <div className="refresh-button">
            <img src="/refresh.png" alt="refresh canvas"/>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
