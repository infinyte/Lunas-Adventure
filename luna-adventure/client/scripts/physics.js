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
      entity.physics.isGrounded = false;
      entity.physics.collidingWith = [];
    });
    
    // Second pass: Detect and resolve collisions
    entities.forEach(entity => {
      // Skip non-physical or static entities
      if (!entity.physics || entity.physics.isStatic) return;
      
      // Get potential collision candidates from spatial hash
      const candidates = this.getPotentialCollisions(entity);
      
      // Check for actual collisions
      candidates.forEach(other => {
        // Skip self-collision
        if (entity.id === other.id) return;
        
        // Skip if other entity doesn't have physics
        if (!other.physics) return;
        
        // Check for collision
        const collision = this.checkCollision(entity, other);
        
        if (collision) {
          // Resolve collision
          this.resolveCollision(entity, other, collision);
          
          // Update collision flags
          entity.physics.isColliding = true;
          entity.physics.collidingWith.push({
            id: other.id,
            type: other.type,
            side: collision.side
          });
          
          // Set grounded flag if colliding from above
          if (collision.side === 'bottom') {
            entity.physics.isGrounded = true;
          }
          
          // Emit collision event
          this.emit('collision', {
            entity1: entity,
            entity2: other,
            collision
          });
        }
      });
      
      // Check world boundaries
      this.checkWorldBoundaries(entity);
    });
    
    return entities;
  }
  
  /**
   * Reset the spatial hash for collision detection
   */
  resetSpatialHash() {
    this.spatialHash.clear();
  }
  
  /**
   * Add an entity to the spatial hash for efficient collision detection
   * @param {Object} entity - Entity to add
   */
  addToSpatialHash(entity) {
    // Calculate which cells this entity overlaps
    const minCellX = Math.floor(entity.x / this.spatialHashCellSize);
    const maxCellX = Math.floor((entity.x + entity.width) / this.spatialHashCellSize);
    const minCellY = Math.floor(entity.y / this.spatialHashCellSize);
    const maxCellY = Math.floor((entity.y + entity.height) / this.spatialHashCellSize);
    
    // Add to all overlapping cells
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        const cellKey = `${x},${y}`;
        
        if (!this.spatialHash.has(cellKey)) {
          this.spatialHash.set(cellKey, []);
        }
        
        this.spatialHash.get(cellKey).push(entity);
      }
    }
  }
  
  /**
   * Get potential collision candidates for an entity
   * @param {Object} entity - Entity to check
   * @returns {Array} Array of potential collision candidates
   */
  getPotentialCollisions(entity) {
    const candidates = new Set();
    
    // Calculate which cells this entity overlaps
    const minCellX = Math.floor(entity.x / this.spatialHashCellSize);
    const maxCellX = Math.floor((entity.x + entity.width) / this.spatialHashCellSize);
    const minCellY = Math.floor(entity.y / this.spatialHashCellSize);
    const maxCellY = Math.floor((entity.y + entity.height) / this.spatialHashCellSize);
    
    // Collect entities from all overlapping cells
    for (let x = minCellX; x <= maxCellX; x++) {
      for (let y = minCellY; y <= maxCellY; y++) {
        const cellKey = `${x},${y}`;
        
        if (this.spatialHash.has(cellKey)) {
          this.spatialHash.get(cellKey).forEach(other => {
            candidates.add(other);
          });
        }
      }
    }
    
    // Convert Set to Array
    return Array.from(candidates);
  }
  
  /**
   * Check if two entities are colliding
   * @param {Object} entity1 - First entity
   * @param {Object} entity2 - Second entity
   * @returns {Object|null} Collision data or null if no collision
   */
  checkCollision(entity1, entity2) {
    // Basic AABB collision detection
    const isColliding = (
      entity1.x < entity2.x + entity2.width &&
      entity1.x + entity1.width > entity2.x &&
      entity1.y < entity2.y + entity2.height &&
      entity1.y + entity1.height > entity2.y
    );
    
    if (!isColliding) return null;
    
    // Calculate overlap on each axis
    const overlapX = Math.min(
      entity1.x + entity1.width - entity2.x,
      entity2.x + entity2.width - entity1.x
    );
    
    const overlapY = Math.min(
      entity1.y + entity1.height - entity2.y,
      entity2.y + entity2.height - entity1.y
    );
    
    // Determine collision side based on velocities and overlap
    let side;
    if (overlapX < overlapY) {
      side = entity1.physics.velocityX > 0 ? 'right' : 'left';
    } else {
      side = entity1.physics.velocityY > 0 ? 'bottom' : 'top';
    }
    
    // For more accurate side detection, check previous position
    if (entity1.physics.previousX !== undefined && entity1.physics.previousY !== undefined) {
      // If entity was previously above the other entity, it's a bottom collision
      if (entity1.physics.previousY + entity1.height <= entity2.y) {
        side = 'bottom';
      }
      // If entity was previously below the other entity, it's a top collision
      else if (entity1.physics.previousY >= entity2.y + entity2.height) {
        side = 'top';
      }
      // If entity was previously to the left of the other entity, it's a right collision
      else if (entity1.physics.previousX + entity1.width <= entity2.x) {
        side = 'right';
      }
      // If entity was previously to the right of the other entity, it's a left collision
      else if (entity1.physics.previousX >= entity2.x + entity2.width) {
        side = 'left';
      }
    }
    
    return {
      entity1Id: entity1.id,
      entity2Id: entity2.id,
      overlapX,
      overlapY,
      side
    };
  }
  
  /**
   * Resolve a collision between two entities
   * @param {Object} entity1 - First entity (will be moved)
   * @param {Object} entity2 - Second entity (static or dynamic)
   * @param {Object} collision - Collision data
   */
  resolveCollision(entity1, entity2, collision) {
    // Skip if the first entity is static (shouldn't happen, but just in case)
    if (entity1.physics.isStatic) return;
    
    // Default collision response: position correction and velocity adjustment
    switch (collision.side) {
      case 'bottom':
        // Position correction
        entity1.y = entity2.y - entity1.height;
        
        // Velocity adjustment
        entity1.physics.velocityY = 0;
        
        // Apply bounce if bouncy
        if (entity1.physics.bounciness > 0) {
          entity1.physics.velocityY = -entity1.physics.velocityY * entity1.physics.bounciness;
        }
        break;
        
      case 'top':
        // Position correction
        entity1.y = entity2.y + entity2.height;
        
        // Velocity adjustment
        entity1.physics.velocityY = 0;
        
        // Apply bounce if bouncy
        if (entity1.physics.bounciness > 0) {
          entity1.physics.velocityY = -entity1.physics.velocityY * entity1.physics.bounciness;
        }
        break;
        
      case 'right':
        // Position correction
        entity1.x = entity2.x - entity1.width;
        
        // Velocity adjustment
        entity1.physics.velocityX = 0;
        
        // Apply bounce if bouncy
        if (entity1.physics.bounciness > 0) {
          entity1.physics.velocityX = -entity1.physics.velocityX * entity1.physics.bounciness;
        }
        break;
        
      case 'left':
        // Position correction
        entity1.x = entity2.x + entity2.width;
        
        // Velocity adjustment
        entity1.physics.velocityX = 0;
        
        // Apply bounce if bouncy
        if (entity1.physics.bounciness > 0) {
          entity1.physics.velocityX = -entity1.physics.velocityX * entity1.physics.bounciness;
        }
        break;
    }
    
    // Handle special collision types (platforms, triggers, etc.)
    if (entity2.type === 'platform' && entity2.properties?.oneWay) {
      // Only collide when coming from above
      if (collision.side !== 'bottom' || entity1.physics.velocityY < 0) {
        // Undo collision response
        entity1.x = entity1.physics.previousX;
        entity1.y = entity1.physics.previousY;
        entity1.physics.collidingWith.pop();
        entity1.physics.isColliding = entity1.physics.collidingWith.length > 0;
        entity1.physics.isGrounded = false;
      }
    }
    
    // If both entities are dynamic, apply forces to the second entity too
    if (!entity2.physics.isStatic) {
      // Apply equal and opposite force
      const massRatio1 = entity1.physics.mass / (entity1.physics.mass + entity2.physics.mass);
      const massRatio2 = entity2.physics.mass / (entity1.physics.mass + entity2.physics.mass);
      
      if (collision.side === 'bottom' || collision.side === 'top') {
        // Exchange some vertical momentum
        const totalVelocityY = entity1.physics.velocityY + entity2.physics.velocityY;
        entity2.physics.velocityY = totalVelocityY * massRatio1;
      } else {
        // Exchange some horizontal momentum
        const totalVelocityX = entity1.physics.velocityX + entity2.physics.velocityX;
        entity2.physics.velocityX = totalVelocityX * massRatio1;
      }
    }
  }
  
  /**
   * Check and resolve world boundaries
   * @param {Object} entity - Entity to check
   */
  checkWorldBoundaries(entity) {
    // Skip if no world boundaries defined or entity is static
    if (!entity.physics || entity.physics.isStatic || !entity.physics.worldBounds) return;
    
    const { minX, maxX, minY, maxY } = entity.physics.worldBounds;
    
    // Check horizontal boundaries
    if (minX !== undefined && entity.x < minX) {
      entity.x = minX;
      entity.physics.velocityX = 0;
    } else if (maxX !== undefined && entity.x + entity.width > maxX) {
      entity.x = maxX - entity.width;
      entity.physics.velocityX = 0;
    }
    
    // Check vertical boundaries
    if (minY !== undefined && entity.y < minY) {
      entity.y = minY;
      entity.physics.velocityY = 0;
    } else if (maxY !== undefined && entity.y + entity.height > maxY) {
      entity.y = maxY - entity.height;
      entity.physics.velocityY = 0;
      entity.physics.isGrounded = true;
      
      // Emit 'fell off world' event if entity is below a large threshold
      if (maxY > 1000 && entity.y + entity.height >= maxY) {
        this.emit('fellOffWorld', { entity });
      }
    }
  }
  
  /**
   * Apply a jump force to an entity
   * @param {Object} entity - Entity to jump
   * @param {number} force - Custom jump force (optional)
   * @returns {boolean} Whether the jump was successful
   */
  applyJump(entity, force = null) {
    // Can only jump if on the ground
    if (!entity.physics || !entity.physics.isGrounded) {
      return false;
    }
    
    // Apply jump force
    entity.physics.velocityY = force !== null ? force : this.jumpForce;
    entity.physics.isGrounded = false;
    
    // Emit jump event
    this.emit('jump', { entity });
    
    return true;
  }
  
  /**
   * Apply a force to an entity
   * @param {Object} entity - Entity to apply force to
   * @param {number} forceX - Horizontal force component
   * @param {number} forceY - Vertical force component
   */
  applyForce(entity, forceX, forceY) {
    if (!entity.physics) return;
    
    // Apply force based on entity mass
    const mass = entity.physics.mass || 1;
    entity.physics.velocityX += forceX / mass;
    entity.physics.velocityY += forceY / mass;
    
    // Emit force applied event
    this.emit('forceApplied', { entity, forceX, forceY });
  }
  
  /**
   * Apply an impulse to an entity (immediate velocity change)
   * @param {Object} entity - Entity to apply impulse to
   * @param {number} velocityX - Horizontal velocity
   * @param {number} velocityY - Vertical velocity
   */
  applyImpulse(entity, velocityX, velocityY) {
    if (!entity.physics) return;
    
    // Set velocities directly
    entity.physics.velocityX = velocityX;
    entity.physics.velocityY = velocityY;
    
    // Emit impulse applied event
    this.emit('impulseApplied', { entity, velocityX, velocityY });
  }
  
  /**
   * Create physics properties for an entity
   * @param {Object} entityConfig - Entity configuration
   * @returns {Object} Physics properties object
   */
  createPhysicsComponent(entityConfig) {
    return {
      velocityX: 0,
      velocityY: 0,
      previousX: entityConfig.x,
      previousY: entityConfig.y,
      isStatic: entityConfig.isStatic || false,
      hasGravity: entityConfig.hasGravity !== false,
      hasFriction: entityConfig.hasFriction !== false,
      mass: entityConfig.mass || 1,
      bounciness: entityConfig.bounciness || 0,
      isGrounded: false,
      isColliding: false,
      collidingWith: [],
      worldBounds: entityConfig.worldBounds || null
    };
  }
}

module.exports = PhysicsEngine;