// client/scripts/inputHandler.js

class SimpleEmitter {
  constructor() {
    this.listeners = new Map();
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }

    this.listeners.get(eventName).add(callback);
    return this;
  }

  off(eventName, callback) {
    const callbacks = this.listeners.get(eventName);
    if (callbacks) {
      callbacks.delete(callback);
    }
    return this;
  }

  emit(eventName, ...args) {
    const callbacks = this.listeners.get(eventName);
    if (!callbacks) {
      return false;
    }

    callbacks.forEach((callback) => callback(...args));
    return true;
  }
}

/**
 * Input Handler Class
 * Manages keyboard, gamepad, and touch input for the game
 */
class InputHandler extends SimpleEmitter {
  constructor() {
    super();

    // Track key states
    this.keys = {
      left: false,
      right: false,
      jump: false,
      action: false
    };

    // Key mappings
    this.keyMappings = {
      'ArrowLeft': 'left',
      'ArrowRight': 'right',
      'ArrowUp': 'jump',
      'Space': 'jump',
      'KeyA': 'left',
      'KeyD': 'right',
      'KeyW': 'jump',
      'KeyP': 'pause'
    };

    // Initialize input listeners
    this.enabled = false;
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    this.boundHandleKeyUp = this.handleKeyUp.bind(this);

    // Stored touch listeners for cleanup: [{ el, type, fn }, ...]
    this.touchListeners = [];
  }
  
  /**
   * Enable input handling
   */
  enable() {
    if (this.enabled) return;
    
    // Add event listeners
    window.addEventListener('keydown', this.boundHandleKeyDown);
    window.addEventListener('keyup', this.boundHandleKeyUp);
    
    // Setup touch controls if on mobile
    this.setupTouchControls();
    
    this.enabled = true;
    console.log('Input handler enabled');
  }
  
  /**
   * Disable input handling
   */
  disable() {
    if (!this.enabled) return;
    
    // Remove event listeners
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    window.removeEventListener('keyup', this.boundHandleKeyUp);
    
    // Clean up touch listeners
    this.cleanupTouchControls();
    
    this.enabled = false;
    console.log('Input handler disabled');
  }
  
  /**
   * Handle keydown events
   * @param {KeyboardEvent} event 
   */
  handleKeyDown(event) {
    const key = this.keyMappings[event.code];
    if (key && !this.keys[key]) {
      this.keys[key] = true;
      this.emit(key, true);
      
      if (key === 'pause') {
        this.emit('pause');
      }
    }
  }
  
  /**
   * Handle keyup events
   * @param {KeyboardEvent} event 
   */
  handleKeyUp(event) {
    const key = this.keyMappings[event.code];
    if (key && this.keys[key]) {
      this.keys[key] = false;
      this.emit(key, false);
    }
  }
  
  /**
   * Register a touch listener and store it for later cleanup.
   * @param {Element} el
   * @param {string} type - e.g. 'touchstart'
   * @param {Function} fn
   */
  _addTouchListener(el, type, fn) {
    el.addEventListener(type, fn, { passive: false });
    this.touchListeners.push({ el, type, fn });
  }

  /**
   * Setup touch controls for mobile devices.
   * Shows the on-screen d-pad and wires up all buttons.
   */
  setupTouchControls() {
    if (!this.isTouchDevice()) return;

    const mobileControls = document.getElementById('mobile-controls');
    if (!mobileControls) return;

    mobileControls.style.display = 'block';

    // ── Left button ──────────────────────────────────────────────
    const leftBtn = document.getElementById('btn-left');
    if (leftBtn) {
      this._addTouchListener(leftBtn, 'touchstart', (e) => {
        e.preventDefault();
        this.keys.left = true;
        this.emit('left', true);
      });
      const stopLeft = (e) => {
        e.preventDefault();
        this.keys.left = false;
        this.emit('left', false);
      };
      this._addTouchListener(leftBtn, 'touchend', stopLeft);
      this._addTouchListener(leftBtn, 'touchcancel', stopLeft);
    }

    // ── Right button ─────────────────────────────────────────────
    const rightBtn = document.getElementById('btn-right');
    if (rightBtn) {
      this._addTouchListener(rightBtn, 'touchstart', (e) => {
        e.preventDefault();
        this.keys.right = true;
        this.emit('right', true);
      });
      const stopRight = (e) => {
        e.preventDefault();
        this.keys.right = false;
        this.emit('right', false);
      };
      this._addTouchListener(rightBtn, 'touchend', stopRight);
      this._addTouchListener(rightBtn, 'touchcancel', stopRight);
    }

    // ── Jump button ──────────────────────────────────────────────
    const jumpBtn = document.getElementById('btn-jump');
    if (jumpBtn) {
      this._addTouchListener(jumpBtn, 'touchstart', (e) => {
        e.preventDefault();
        this.keys.jump = true;
        this.emit('jump');
      });
      const stopJump = (e) => {
        e.preventDefault();
        this.keys.jump = false;
      };
      this._addTouchListener(jumpBtn, 'touchend', stopJump);
      this._addTouchListener(jumpBtn, 'touchcancel', stopJump);
    }

    // ── Pause button ─────────────────────────────────────────────
    const pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
      this._addTouchListener(pauseBtn, 'touchstart', (e) => {
        e.preventDefault();
        this.emit('pause');
      });
    }
  }

  /**
   * Remove all registered touch listeners and reset touch key states.
   */
  cleanupTouchControls() {
    for (const { el, type, fn } of this.touchListeners) {
      el.removeEventListener(type, fn);
    }
    this.touchListeners = [];

    // Reset any keys that may have been held when controls were removed
    this.keys.left = false;
    this.keys.right = false;
    this.keys.jump = false;
  }
  
  /**
   * Check if device supports touch
   * @returns {boolean}
   */
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
}

export default InputHandler;
