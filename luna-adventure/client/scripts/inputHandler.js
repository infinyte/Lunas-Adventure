// server/services/inputHandler.js
const { EventEmitter } = require('events');

/**
 * Input Handler Service
 * 
 * Responsible for processing player input commands and mapping them to game actions.
 * Provides an abstraction layer between raw input events and game commands.
 * 
 * Uses an event-driven architecture to notify the game engine of input events.
 */
class InputHandler extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Input mappings (configurable)
    this.keyMappings = options.keyMappings || this.getDefaultKeyMappings();
    this.gamepadMappings = options.gamepadMappings || this.getDefaultGamepadMappings();
    
    // Currently active inputs
    this.activeInputs = new Set();
    
    // Input states
    this.keyboard = {
      keysDown: new Set()
    };
    
    this.gamepad = {
      connected: false,
      buttons: [],
      axes: [0, 0, 0, 0]
    };
    
    this.touch = {
      active: false,
      position: { x: 0, y: 0 },
      virtualButtons: {}
    };
    
    // Gamepad polling interval
    this.gamepadPollInterval = null;
    
    // Debug mode
    this.debug = options.debug || false;
    
    console.log('Input Handler initialized');
  }
  
  /**
   * Initialize the input handler
   */
  initialize() {
    // Start gamepad polling if supported
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      this.startGamepadPolling();
    }
    
    this.emit('ready', { service: 'InputHandler' });
    return true;
  }
  
  /**
   * Get default keyboard mappings
   * @returns {Object} Default key mappings
   */
  getDefaultKeyMappings() {
    return {
      'ArrowUp': 'jump',
      'KeyW': 'jump',
      'Space': 'jump',
      'ArrowLeft': 'moveLeft',
      'KeyA': 'moveLeft',
      'ArrowRight': 'moveRight',
      'KeyD': 'moveRight',
      'ArrowDown': 'duck',
      'KeyS': 'duck',
      'KeyE': 'action',
      'Enter': 'action',
      'Escape': 'pause',
      'KeyP': 'pause'
    };
  }
  
  /**
   * Get default gamepad mappings
   * @returns {Object} Default gamepad mappings
   */
  getDefaultGamepadMappings() {
    return {
      buttons: {
        0: 'jump',      // A button (Xbox) / X button (PlayStation)
        1: 'action',    // B button (Xbox) / Circle button (PlayStation)
        2: 'cancel',    // X button (Xbox) / Square button (PlayStation)
        3: 'menu',      // Y button (Xbox) / Triangle button (PlayStation)
        9: 'pause'      // Start button
      },
      axes: {
        // Left stick
        0: {            // Horizontal axis (left stick)
          '-1': 'moveLeft',
          '1': 'moveRight'
        },
        1: {            // Vertical axis (left stick)
          '-1': 'jump',
          '1': 'duck'
        }
      }
    };
  }
  
  /**
   * Start polling for gamepad input
   */
  startGamepadPolling() {
    if (this.gamepadPollInterval) {
      clearInterval(this.gamepadPollInterval);
    }
    
    this.gamepadPollInterval = setInterval(() => {
      this.pollGamepads();
    }, 16); // ~60 times per second
    
    console.log('Gamepad polling started');
  }
  
  /**
   * Stop polling for gamepad input
   */
  stopGamepadPolling() {
    if (this.gamepadPollInterval) {
      clearInterval(this.gamepadPollInterval);
      this.gamepadPollInterval = null;
      console.log('Gamepad polling stopped');
    }
  }
  
  /**
   * Poll for gamepad input
   */
  pollGamepads() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return;
    
    const gamepads = navigator.getGamepads();
    
    // Find the first connected gamepad
    let activeGamepad = null;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i] && gamepads[i].connected) {
        activeGamepad = gamepads[i];
        break;
      }
    }
    
    if (!activeGamepad) {
      if (this.gamepad.connected) {
        this.gamepad.connected = false;
        this.emit('gamepad:disconnected');
      }
      return;
    }
    
    // Update gamepad state
    if (!this.gamepad.connected) {
      this.gamepad.connected = true;
      this.emit('gamepad:connected', { gamepad: activeGamepad });
    }
    
    // Process buttons
    for (let i = 0; i < activeGamepad.buttons.length; i++) {
      const button = activeGamepad.buttons[i];
      const wasPressed = this.gamepad.buttons[i];
      
      if (button.pressed && !wasPressed) {
        // Button pressed
        this.handleGamepadButtonPress(i);
      } else if (!button.pressed && wasPressed) {
        // Button released
        this.handleGamepadButtonRelease(i);
      }
      
      this.gamepad.buttons[i] = button.pressed;
    }
    
    // Process axes
    for (let i = 0; i < activeGamepad.axes.length; i++) {
      const axis = activeGamepad.axes[i];
      const deadzone = 0.2; // Ignore small movements
      
      // Apply deadzone
      let axisValue = 0;
      if (Math.abs(axis) > deadzone) {
        axisValue = Math.sign(axis);
      }
      
      // Check if changed
      if (axisValue !== this.gamepad.axes[i]) {
        this.handleGamepadAxisChange(i, axisValue);
        this.gamepad.axes[i] = axisValue;
      }
    }
  }
  
  /**
   * Handle keyboard key down event
   * @param {string} keyCode - Key code
   */
  handleKeyDown(keyCode) {
    // Skip if already down
    if (this.keyboard.keysDown.has(keyCode)) return;
    
    // Add to keys down set
    this.keyboard.keysDown.add(keyCode);
    
    // Map to game action
    if (this.keyMappings[keyCode]) {
      const action = this.keyMappings[keyCode];
      
      // Add to active inputs
      this.activeInputs.add(action);
      
      // Emit input event
      this.emit('input', {
        action,
        source: 'keyboard',
        type: 'press',
        key: keyCode
      });
      
      if (this.debug) {
        console.log(`Input: ${action} (Key: ${keyCode})`);
      }
    }
  }
  
  /**
   * Handle keyboard key up event
   * @param {string} keyCode - Key code
   */
  handleKeyUp(keyCode) {
    // Remove from keys down set
    this.keyboard.keysDown.delete(keyCode);
    
    // Map to game action
    if (this.keyMappings[keyCode]) {
      const action = this.keyMappings[keyCode];
      
      // Remove from active inputs
      this.activeInputs.delete(action);
      
      // Emit input release event
      this.emit('input', {
        action,
        source: 'keyboard',
        type: 'release',
        key: keyCode
      });
      
      if (this.debug) {
        console.log(`Input Released: ${action} (Key: ${keyCode})`);
      }
    }
  }
  
  /**
   * Handle gamepad button press
   * @param {number} buttonIndex - Button index
   */
  handleGamepadButtonPress(buttonIndex) {
    // Map to game action
    if (this.gamepadMappings.buttons[buttonIndex]) {
      const action = this.gamepadMappings.buttons[buttonIndex];
      
      // Add to active inputs
      this.activeInputs.add(action);
      
      // Emit input event
      this.emit('input', {
        action,
        source: 'gamepad',
        type: 'press',
        button: buttonIndex
      });
      
      if (this.debug) {
        console.log(`Input: ${action} (Gamepad button: ${buttonIndex})`);
      }
    }
  }
  
  /**
   * Handle gamepad button release
   * @param {number} buttonIndex - Button index
   */
  handleGamepadButtonRelease(buttonIndex) {
    // Map to game action
    if (this.gamepadMappings.buttons[buttonIndex]) {
      const action = this.gamepadMappings.buttons[buttonIndex];
      
      // Remove from active inputs
      this.activeInputs.delete(action);
      
      // Emit input release event
      this.emit('input', {
        action,
        source: 'gamepad',
        type: 'release',
        button: buttonIndex
      });
      
      if (this.debug) {
        console.log(`Input Released: ${action} (Gamepad button: ${buttonIndex})`);
      }
    }
  }
  
  /**
   * Handle gamepad axis change
   * @param {number} axisIndex - Axis index
   * @param {number} value - Axis value (-1, 0, or 1 after deadzone)
   */
  handleGamepadAxisChange(axisIndex, value) {
    // Skip if axis not mapped
    if (!this.gamepadMappings.axes[axisIndex]) return;
    
    // Previous value
    const prevValue = this.gamepad.axes[axisIndex];
    
    // Remove old action if present
    if (prevValue !== 0 && this.gamepadMappings.axes[axisIndex][prevValue.toString()]) {
      const prevAction = this.gamepadMappings.axes[axisIndex][prevValue.toString()];
      this.activeInputs.delete(prevAction);
      
      // Emit input release event
      this.emit('input', {
        action: prevAction,
        source: 'gamepad',
        type: 'release',
        axis: axisIndex,
        value: prevValue
      });
    }
    
    // Add new action if non-zero
    if (value !== 0 && this.gamepadMappings.axes[axisIndex][value.toString()]) {
      const action = this.gamepadMappings.axes[axisIndex][value.toString()];
      this.activeInputs.add(action);
      
      // Emit input event
      this.emit('input', {
        action,
        source: 'gamepad',
        type: 'press',
        axis: axisIndex,
        value
      });
      
      if (this.debug) {
        console.log(`Input: ${action} (Gamepad axis: ${axisIndex}, value: ${value})`);
      }
    }
  }
  
  /**
   * Handle touch input start
   * @param {number} x - Touch X coordinate
   * @param {number} y - Touch Y coordinate
   * @param {string} button - Virtual button identifier (e.g., 'left', 'right', 'jump')
   */
  handleTouchStart(x, y, button) {
    this.touch.active = true;
    this.touch.position = { x, y };
    
    if (button) {
      this.touch.virtualButtons[button] = true;
      
      // Map touch to action
      let action;
      switch (button) {
        case 'left':
          action = 'moveLeft';
          break;
        case 'right':
          action = 'moveRight';
          break;
        case 'jump':
          action = 'jump';
          break;
        case 'action':
          action = 'action';
          break;
        default:
          action = button;
      }
      
      // Add to active inputs
      this.activeInputs.add(action);
      
      // Emit input event
      this.emit('input', {
        action,
        source: 'touch',
        type: 'press',
        position: { x, y }
      });
      
      if (this.debug) {
        console.log(`Input: ${action} (Touch button: ${button})`);
      }
    }
  }
  
  /**
   * Handle touch input end
   * @param {string} button - Virtual button identifier (e.g., 'left', 'right', 'jump')
   */
  handleTouchEnd(button) {
    if (button && this.touch.virtualButtons[button]) {
      this.touch.virtualButtons[button] = false;
      
      // Map touch to action
      let action;
      switch (button) {
        case 'left':
          action = 'moveLeft';
          break;
        case 'right':
          action = 'moveRight';
          break;
        case 'jump':
          action = 'jump';
          break;
        case 'action':
          action = 'action';
          break;
        default:
          action = button;
      }
      
      // Remove from active inputs
      this.activeInputs.delete(action);
      
      // Emit input release event
      this.emit('input', {
        action,
        source: 'touch',
        type: 'release',
        button
      });
      
      if (this.debug) {
        console.log(`Input Released: ${action} (Touch button: ${button})`);
      }
    }
    
    // Check if all touch inputs are released
    const activeTouchButtons = Object.values(this.touch.virtualButtons).some(isActive => isActive);
    if (!activeTouchButtons) {
      this.touch.active = false;
    }
  }
  
  /**
   * Check if an action is currently active
   * @param {string} action - Game action
   * @returns {boolean} True if action is active
   */
  isActionActive(action) {
    return this.activeInputs.has(action);
  }
  
  /**
   * Get all currently active actions
   * @returns {Array} Array of active actions
   */
  getActiveActions() {
    return Array.from(this.activeInputs);
  }
  
  /**
   * Update key mappings
   * @param {Object} newMappings - New key mappings
   */
  updateKeyMappings(newMappings) {
    this.keyMappings = { ...this.keyMappings, ...newMappings };
    this.emit('mappings:updated', { type: 'keyboard', mappings: this.keyMappings });
  }
  
  /**
   * Update gamepad mappings
   * @param {Object} newMappings - New gamepad mappings
   */
  updateGamepadMappings(newMappings) {
    // Deep merge for nested objects
    this.gamepadMappings = this.deepMerge(this.gamepadMappings, newMappings);
    this.emit('mappings:updated', { type: 'gamepad', mappings: this.gamepadMappings });
  }
  
  /**
   * Reset all inputs to inactive state
   */
  resetInputs() {
    // Clear active inputs
    this.activeInputs.clear();
    
    // Reset keyboard state
    this.keyboard.keysDown.clear();
    
    // Reset gamepad state
    this.gamepad.buttons = [];
    this.gamepad.axes = [0, 0, 0, 0];
    
    // Reset touch state
    this.touch.active = false;
    this.touch.virtualButtons = {};
    
    this.emit('inputs:reset');
    console.log('All inputs reset');
  }
  
  /**
   * Clean up resources when shutting down
   */
  shutdown() {
    // Stop gamepad polling
    this.stopGamepadPolling();
    
    // Reset inputs
    this.resetInputs();
    
    this.emit('shutdown:complete');
    console.log('Input Handler shut down successfully');
    
    return true;
  }
  
  /**
   * Helper function to deep merge objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object to merge
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (typeof target === 'object' && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }
}

module.exports = InputHandler;
