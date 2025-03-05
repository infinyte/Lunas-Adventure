// client/scripts/physics.js
import { GRAVITY, FRICTION, TERMINAL_VELOCITY } from '../../shared/constants.js';

/**
 * Physics Engine Class
 * Handles physics calculations for game entities
 */
class Physics {
  /**
   * Create the physics engine
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.gravity = options.gravity !== undefined ? options.gravity : GRAVITY;
    this.friction = options.friction !== undefined ? options.friction : FRICTION;
    this.terminalVelocity = options.terminalVelocity || TERMINAL_VELOCITY;
    this.debug = options.debug || false;
  }
  
  /**
   * Set debug mode
   * @param {boolean} enabled - Whether debug mode is enabled
   */
  setDebugMode(enabled) {
    this.debug = enabled;
  }
  
  /**
   * Update entity physics
   * @param {Object} entity - Entity to update
   * @param {number} deltaTime - Time since last update
   */
  updateEntity(entity, deltaTime) {
    // Skip if entity doesn't have physics properties
    if (!entity) return;
    
    // Apply gravity
    entity.velocityY += this.gravity;
    
    // Apply terminal velocity
    if (entity.velocityY > this.terminalVelocity) {
      entity.velocityY = this.terminalVelocity;
    }
    
    // Update position
    entity.x += entity.velocityX;
    entity.y += entity.velocityY;
  }
  
  /**
   * Check for collision between two entities
   * @param {Object} entity1 - First entity
   * @param {Object} entity2 - Second entity
   * @returns {boolean} - Whether the entities are colliding
   */
  checkCollision(entity1, entity2) {
    return (
      entity1.x < entity2.x + entity2.width &&
      entity1.x + entity1.width > entity2.x &&
      entity1.y < entity2.y + entity2.height &&
      entity1.y + entity1.height > entity2.y
    );
  }
  
  /**
   * Get collision side between two entities
   * @param {Object} entity1 - First entity
   * @param {Object} entity2 - Second entity
   * @returns {string} - Collision side ('top', 'bottom', 'left', 'right')
   */
  getCollisionSide(entity1, entity2) {
    // Calculate the overlap on each axis
    const overlapX = Math.min(
      entity1.x + entity1.width - entity2.x,
      entity2.x + entity2.width - entity1.x
    );
    
    const overlapY = Math.min(
      entity1.y + entity1.height - entity2.y,
      entity2.y + entity2.height - entity1.y
    );
    
    // Determine collision side based on the smallest overlap
    if (overlapX < overlapY) {
      return entity1.x < entity2.x ? 'right' : 'left';
    } else {
      return entity1.y < entity2.y ? 'bottom' : 'top';
    }
  }
}

export default Physics;
