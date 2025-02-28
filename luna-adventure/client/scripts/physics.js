// server/services/physicsEngine.js
const { EventEmitter } = require('events');

/**
 * Physics Engine Service
 * 
 * Responsible for handling physics calculations including:
 * - Gravity and jumping physics
 * - Collision detection and resolution
 * - Movement and velocity calculations
 * 
 * Uses an event-driven architecture to notify the game engine of physics events
 */
class PhysicsEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Physics constants
    this.gravity = options.gravity !== undefined ? options.gravity : 0.5;
    this.friction = options.friction !== undefined ? options.friction : 0.8;
    this.terminalVelocity = options.terminalVelocity || 12;
    this.jumpForce = options.jumpForce || -11;
    
    // Collision detection settings
    this.spatialHash = new Map(); // For efficient collision detection
    this.spatialHashCellSize = options.spatialHashCellSize || 100;
    
    // Debug mode
    this.debug = options.debug || false;
    
    console.log('Physics Engine initialized with settings:', {
      gravity: this.gravity,
      friction: this.friction,
      terminalVelocity: this.terminalVelocity,
      jumpForce: this.jumpForce
    });
  }
  
  /**
   * Update physics for all entities
   * @param {Array} entities - Array of game entities to update
   * @param {number} deltaTime - Time since last update (in ms)
   * @returns {Array} Updated entities
   */
  update(entities, deltaTime) {
    // Time scaling factor (for consistent physics regardless of frame rate)
    const timeScale = deltaTime / (1000 / 60); // Normalize to 60 FPS
    
    // Reset spatial hash for collision detection
    this.resetSpatialHash();
    
    // First pass: Update positions and velocities, add to spatial hash
    entities.forEach(entity => {
      // Skip non-physical entities
      if (!entity.physics) return;
      
      // Apply gravity to entities affected by it
      if (entity.physics.hasGravity) {
        entity.physics.velocityY += this.gravity * timeScale;
        
        // Apply terminal velocity
        if (entity.physics.velocityY > this.terminalVelocity) {
          entity.physics.velocityY = this.terminalVelocity;
        }
      }
      
      // Apply friction to horizontal movement
      if (entity.physics.hasFriction) {
        entity.physics.velocityX *= (this.friction ** timeScale);
        
        // Stop very small movements
        if (Math.abs(entity.physics.velocityX) < 0.01) {
          entity.physics.velocityX = 0;
        }
      }
      
      // Store previous position for collision resolution
      entity.physics.previousX = entity.x;
      entity.physics.previousY = entity.y;
      
      // Update position based on velocity
      entity.x += entity.physics.velocityX * timeScale;
      entity.y += entity.physics.velocityY * timeScale;
      
      // Add to spatial hash for collision detection
      this.addToSpatialHash(entity);
      
      // Reset collision flags
      entity.physics.isColliding = false;
      entity.physics
