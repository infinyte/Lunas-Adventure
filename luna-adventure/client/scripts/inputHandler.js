// client/scripts/inputHandler.js
import { EventEmitter } from 'events';

/**
 * Input Handler Class
 * Manages keyboard, gamepad, and touch input for the game
 */
class InputHandler extends EventEmitter {
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
  }
  
  /**
   * Enable input handling
   */
  enable() {
    if (this.enabled) return;
    
    // Add event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
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
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    
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
   * Setup touch controls for mobile devices
   */
  setupTouchControls() {
    if (!this.isTouchDevice()) return;
    
    const mobileControls = document.getElementById('mobile-controls');
    if (mobileControls) {
      mobileControls.style.display = 'block';
      
      // Left button
      const leftBtn = document.getElementById('btn-left');
      if (leftBtn) {
        leftBtn.addEventListener('touchstart', () => {
          this.keys.left = true;
          this.emit('move', 'left');
        });
        
        leftBtn.addEventListener('touchend', () => {
          this.keys.left = false;
          this.emit('move', 'stop');
        });
      }
      
      // Right button
      const rightBtn = document.getElementById('btn-right');
      if (rightBtn) {
        rightBtn.addEventListener('touchstart', () => {
          this.keys.right = true;
          this.emit('move', 'right');
        });
        
        rightBtn.addEventListener('touchend', () => {
          this.keys.right = false;
          this.emit('move', 'stop');
        });
      }
      
      // Jump button
      const jumpBtn = document.getElementById('btn-jump');
      if (jumpBtn) {
        jumpBtn.addEventListener('touchstart', () => {
          this.keys.jump = true;
          this.emit('jump');
        });
        
        jumpBtn.addEventListener('touchend', () => {
          this.keys.jump = false;
        });
      }
      
      // Pause button
      const pauseBtn = document.getElementById('btn-pause');
      if (pauseBtn) {
        pauseBtn.addEventListener('touchstart', () => {
          this.emit('pause');
        });
      }
    }
  }
  
  /**
   * Clean up touch controls
   */
  cleanupTouchControls() {
    // Implementation for touch controls cleanup...
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
