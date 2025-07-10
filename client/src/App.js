import React, { useState, useRef, useEffect} from 'react';
import { ChromePicker } from 'react-color';
import AnimatedName from './utils/AnimatedName.js';
import { db } from "./utils/firebase.js";
import './App.css';
import { ref, onChildAdded, onChildRemoved, get, remove, push } from '@firebase/database';

function App() {
  // Constants handling drawing canvas directly
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const velocity = useRef({ x: 0, y: 0 });
  const animationFrameID = useRef(null);
  const [canvasOffset, setCanvasOffset] = useState({ left: 0, top: 0 });

  // Constants handling drawing functions
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawSize, setDrawSize] = useState(3);
  const lastPos = useRef(null);

  // Constants handling colors and color changes
  const [selectedColor, setSelectedColor] = useState('#000000'); // Init with default to black
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEraserActive, setIsEraserActive] = useState(false);

  // Constants handling zoom
  const MIN_ZOOM = 0.4;
  const MAX_ZOOM = 8;
  const ZOOM_FACTOR = 1.3;
  const zoomLevel = useRef(1);

  // Constants handling drag momentum
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const scrollStart = useRef({ x: 0, y: 0 });
  const lastDrag = useRef({ time: 0, x: 0, y: 0 });

  // Constant handling text overlay
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);
  const [isOverlayClosed, setIsOverlayClosed] = useState(false);
  const [overlayBarLoaded, setOverlayBarLoaded] = useState(false);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [renderControls, setRenderControls] = useState(false);

  // Constants for firebase relatime db
  const renderTimeout = useRef(null);
  const pendingLine = useRef(null);
  const erasedLines = useRef(new Set());



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
    canvas.style.transformOrigin = 'top left';
    const context = canvas.getContext('2d');
    const strokes = [];
    const linesRef = ref(db, 'canvas/lines');

    // Handle new lines and all lines when loading the page
    const renderLines = onChildAdded(ref(db, 'canvas/lines'), (snapshot) => {
      const {
        color,
        bsize,
        lineTime,
        pixels
      } = snapshot.val();

      // Put lines into an array to sort by number
      strokes.push({ color, bsize, lineTime, pixels });

      if(!renderTimeout.current) {
        renderTimeout.current = setTimeout(() => {
          strokes.sort((a, b) => a.lineTime - b.lineTime);
          strokes.forEach(({ color, bsize, pixels }) => {
            context.fillStyle = color;
            pixels.forEach(coord => {
              const [x, y] = coord.split('_').map(Number);
              context.beginPath();
              context.arc(x, y, bsize / 2, 0, 2 * Math.PI);
              context.fill();
            });
          });
          renderTimeout.current = null;
        }, 100);
      }
    });

    // Handle lines being removed
    const removeLines = onChildRemoved(linesRef, (snapshot) => {
      const removedData = snapshot.val();

      const index = strokes.findIndex(line =>
        line.lineTime === removedData.lineTime &&
        line.color === removedData.color &&
        JSON.stringify(line.pixels) === JSON.stringify(removedData.pixels)
      );

      if (index !== -1) {
        strokes.splice(index, 1);
        redrawCanvas(context, strokes);
      }
    })

    // Center the canvas
    const wrapper = canvasContainerRef.current;
    if (wrapper) {
      wrapper.scrollLeft = ((canvasRef.current.width / zoomLevel.current) - 
      wrapper.clientWidth) / 2;
      wrapper.scrollTop = ((canvasRef.current.height / zoomLevel.current) - 
      wrapper.clientHeight) / 2;
    }

    // Handle changing zoom levels
    const handleWheel = (e) => {
      if (e.ctrlKey) return;
  
      e.preventDefault();
      const isZoomingIn = e.deltaY < 0;
      const scaleMultiplier = isZoomingIn ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, zoomLevel.current * scaleMultiplier));
      const scaleRatio = newZoom / zoomLevel.current;
  
      if (newZoom !== zoomLevel.current) {
        const wrapper = canvasContainerRef.current;

        // Pause any dragging momentum to avoid weird velocity calcs
        const wasDragging = isDragging.current;
        isDragging.current = false;
  
        // Get mouse position to preserve position when zooming
        const rect = wrapper.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check to see if the canvas is smaller than the viewport
        // This is for centering purposes when zooming out
        const offsetLeft = (canvas.width * newZoom) < wrapper.clientWidth ?
        (wrapper.clientWidth - (canvas.width * newZoom)) / 2 : 0;
        const offsetTop = (canvas.height * newZoom) < wrapper.clientHeight ?
        (wrapper.clientHeight - (canvas.height * newZoom)) / 2 : 0;
        setCanvasOffset({ left: offsetLeft, top: offsetTop });
  
        // Update actual zoom level and redraw canvas with it
        zoomLevel.current = newZoom;
        canvas.style.transform = `scale(${zoomLevel.current})`;
        redrawCanvas(context, strokes);
  
        // Adjust scroll to maintain view center
        wrapper.scrollLeft = (mouseX + wrapper.scrollLeft) * scaleRatio - mouseX;
        wrapper.scrollTop = (mouseY + wrapper.scrollTop) * scaleRatio - mouseY;

        // Re-enable dragging if it was active prior to zooming
        if (wasDragging) {
          isDragging.current = true;
          dragStart.current = { x: e.clientX, y: e.clientY };
          scrollStart.current = { x: wrapper.scrollLeft, y: wrapper.scrollTop};
          lastDrag.current = { time: performance.now(), x: e.clientX, y: e.clientY};
        }
      }
    };

    // Prevent context menu
    const preventContextMenu = (e) => e.preventDefault();
    window.addEventListener("contextmenu", preventContextMenu);
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      renderLines();
      removeLines();
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("contextmenu", preventContextMenu);
    }
  }, [isOverlayVisible, isOverlayClosed]);

  // Define custom tooltip div
  const Tooltip = ({ children, text, className = "", style = {} }) => (
    <div className={`tooltip-container ${className}`}
    style={{ position: 'relative', display: 'contents', ...style }}>
      {children}
      <div className="tooltip-text">{text}</div>
    </div>
  );



  ///////////////////////////////////////////////////
  ////            CANVAS RENDERING               ////
  ///////////////////////////////////////////////////

  // Firebase pixel updates
  const queueLinePixel = (x, y) => {
    const key = `${Math.floor(x)}_${Math.floor(y)}`;
    if(!pendingLine.current.pixels.includes(key)){
      pendingLine.current.pixels.push(key);
    }
  };

  const updateFirebaseLines = async () => {
    const linesRef = ref(db, 'canvas/lines');
    const newLine = pendingLine.current;

    try {
      await push(linesRef, newLine);
    } catch (err) {
      console.error("Failed to update line: ", err);
    }
  };

  const redrawCanvas = (context, lines) => {
    const canvas = canvasRef.current;
    context.clearRect(0, 0, canvas.width, canvas.height);
  
    lines
      .sort((a, b) => a.lineTime - b.lineTime)
      .forEach(({ color, bsize, pixels }) => {
        context.fillStyle = color;
        pixels.forEach(coord => {
          const [x, y] = coord.split('_').map(Number);
          context.beginPath();
          context.arc(x, y, bsize / 2, 0, 2 * Math.PI);
          context.fill();
        });
      });
  };



  ///////////////////////////////////////////////////
  ////                 TOGGLES                   ////
  //////////////////////////////////////////////////

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

  // Toggle eraser bahavior
  const toggleEraser = () => {
    setIsEraserActive(prev => !prev);
    if (!isEraserActive) setIsPickerOpen(true);
  }

  // Toggle controls display
  const toggleControls = () => {
    if (isControlsOpen) {
      setIsControlsOpen(false);
      setTimeout(() => setRenderControls(false), 300);
    } else {
      setRenderControls(true);
      setTimeout(() => setIsControlsOpen(true), 10);
    }
  }



  ///////////////////////////////////////////////////
  ////             MOUSE FUNCTIONS               ////
  ///////////////////////////////////////////////////

  // Helper to get mouse position
  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const z = zoomLevel.current;

    const BORDER_WIDTH = 15;

    return {
      x: Math.floor(e.clientX - rect.left - (BORDER_WIDTH * z)) / z,
      y: Math.floor(e.clientY - rect.top - (BORDER_WIDTH * z)) / z
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
    if (isDragging.current) { // Right Click
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
    } else if (e.buttons === 1) { // Left Click
      drawInterpol(e);
    }
  };

  // Stop click-and-drag events
  const handleMouseUp = (e) => {
    if (e.button === 2) { // Right click
      isDragging.current = false;

      // Employ velocity check for a minimum threshold before applying momentum
      const speed = Math.hypot(velocity.current.x, velocity.current.y);
      if (speed > 3) {
        startMomentum();
      } else {
        velocity.current = { x: 0, y: 0 };
      }
    } else if (e.button === 0) { // Left Click
      // End drawing and update firebase with current line
      endDrawing();
      updateFirebaseLines(pendingLine.current);
    }
  };



  ///////////////////////////////////////////////////
  ////            DRAWING FUNCTIONS              ////
  ///////////////////////////////////////////////////

  // Handler for starting drawing process
  const startDrawing = (e) => {
    const { x, y } = getMousePos(e);
    lastPos.current = { x, y };

    setIsDrawing(true);

    // Handle eraser case
    if (isEraserActive) {
      drawAt(x, y);
      return;
    }

    // Initialize current line
    pendingLine.current = {
      color: selectedColor,
      bsize: drawSize,
      lineTime: Date.now(),
      pixels: []
    }

    // Start drawing pixels to canvas
    drawAt(x, y);
  };

  // Reset isDrawing event to false and reset lastPos
  const endDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  // Handles drawing interpolation between pixels
  const drawInterpol = (e) => {
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

  // Handle clientside drawing
  const drawAt = (x, y) => {
    // Check if eraser is active first
    if(isEraserActive) {
      eraseAt(x, y);
      lastPos.current = { x, y };
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // More circles to fill in gaps
    context.fillStyle = selectedColor;
    context.beginPath();
    context.arc(x, y, drawSize / 2, 0, 2 * Math.PI);
    context.fill();

    queueLinePixel(x, y);
  };



  ///////////////////////////////////////////////////
  ////             ERASER FUNCTIONS              ////
  ///////////////////////////////////////////////////

  // Handle eraser mode behavior
  const eraseAt = async (x, y) => {
    const context = canvasRef.current.getContext('2d');
    const imageData = context.getImageData(x, y, 1, 1).data;
  
    // Ignore if transparent
    if (imageData[3] === 0) return;
  
    const snapshot = await get(ref(db, 'canvas/lines'));
    const lines = snapshot.val();
    if (!lines) return;
  
    const CURSOR_RADIUS = 8;
    const candidates = [];
  
    for (const [lineKey, { pixels, size }] of Object.entries(lines)) {
      if (erasedLines.current.has(lineKey)) continue;
  
      for (const coord of pixels) {
        const [px, py] = coord.split('_').map(Number);
        const dx = x - px;
        const dy = y - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
  
        if (dist <= size / 2) {
          candidates.push({ lineKey, dist, size });
          break;
        } else if (dist <= CURSOR_RADIUS) {
          candidates.push({ lineKey, dist, size });
        }
      }
    }
  
    if (candidates.length === 0) return;
  
    // Prioritize line where cursor falls within brush area
    const prioritized = candidates
      .filter(c => c.dist <= c.size / 2)
      .sort((a, b) => a.dist - b.dist)[0]
      || candidates.sort((a, b) => a.dist - b.dist)[0];
  
    if (prioritized) {
      try {
        await remove(ref(db, `canvas/lines/${prioritized.lineKey}`));
        erasedLines.current.add(prioritized.lineKey);
      } catch (err) {
        console.error('Failed to erase line:', err);
      }
    }
  };



  ///////////////////////////////////////////////////
  ////              DRAG PHYSICS                 ////
  ///////////////////////////////////////////////////

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
        <span className="tooltip-text tooltip-overlay-tab">Reopen Home</span>
      </div>
      <div ref={canvasContainerRef}
        className={`canvas-container ${isOverlayVisible ? 'disabled' : ''}`}>
        <canvas
          ref={canvasRef}
          width={4000}
          height={2250}
          style={{
            transform: `scale(${zoomLevel.current})`,
            left: `${canvasOffset.left}px`,
            top: `${canvasOffset.top}px`,
          }}
          className="drawing-canvas"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={endDrawing}
          onMouseMove={handleMouseMove}
        />
      </div>
      {!isOverlayVisible && (
        <div className="controls-help-panel" onMouseEnter={cancelDrag && endDrawing}>
        <Tooltip text="Controls Guide" className="tooltip-controls-guide">
          <div className="controls-help-tab" onClick={() => toggleControls()}>
            🖱️
          </div>
        </Tooltip>
        {renderControls && (
          <div className={`controls-help-popup ${isControlsOpen ? 'slide-up' : 'slide-down'}`}>
            <div className="controls-close" onClick={() => setIsControlsOpen(false)}>×</div>
            <img src="/controls.png" alt="Controls Guide" />
          </div>
          )}
        </div>
      )}
      {!isOverlayVisible && (
        <div className={`color-picker-panel ${isPickerOpen ? 'open' : ''}`}
        onMouseEnter={cancelDrag && endDrawing}>
          <Tooltip text="Open/Close Color Picker"
          className={isPickerOpen ? "tooltip-openpicker-adjust" : "tooltip-closedpicker-adjust"}>
            <div className="picker-tab" onClick={() => {
              if (!isEraserActive) togglePicker();
            }}>
              {isEraserActive ? '🔒' : isPickerOpen ? '▶' : '◀'}
            </div>
          </Tooltip>
          <div className="color-picker-wrapper">
            <ChromePicker
              color={selectedColor}
              onChange={handleColorChange}
              disableAlpha
            />
          </div>
          <Tooltip text="Brush Size Slider" className="tooltip-brush-slider">
            <div className="brush-slider-container"
            onMouseEnter={cancelDrag && endDrawing}>
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
          </Tooltip>
          <Tooltip text="Eraser" className="tooltip-eraser">
            <div className={`eraser-button ${isEraserActive ? 'active' : ''}`}
              onClick={toggleEraser}>
              <img src="/eraser.png" alt="Eraser"/>
            </div>
          </Tooltip>
        </div>
      )}
    </div>
  );
}

export default App;
