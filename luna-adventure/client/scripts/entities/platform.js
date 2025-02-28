// client/scripts/entities/platform.js

/**
 * Platform Entity
 * 
 * This class represents platforms and terrain elements in the game.
 * Platforms can be static or have various behaviors like moving, breaking, or bouncing.
 */
class Platform {
    /**
     * Create a new platform entity
     * @param {string} id - Unique identifier
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Platform width
     * @param {number} height - Platform height
     * @param {string} type - Platform type ('ground', 'platform', 'moving', 'breaking', 'bouncy')
     */
    constructor(id, x, y, width, height, type = 'platform') {
      // Core properties
      this.id = id;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
      this.type = type;
      
      // Physics properties
      this.velocityX = 0;
      this.velocityY = 0;
      this.solid = true;
      
      // Behavior properties
      this.behaviors = this.initBehaviors();
      
      // Visual properties
      this.style = this.initStyle();
      this.animation = {
        frame: 0,
        frameTime: 0,
        totalFrames: this.type === 'breaking' ? 4 : 1
      };
      
      console.log(`Platform (${id}) of type ${type} created at (${x}, ${y}) with size ${width}x${height}`);
    }
    
    /**
     * Initialize behavior properties based on platform type
     * @returns {Object} - Behavior configuration
     */
    initBehaviors() {
      switch (this.type) {
        case 'moving':
          return {
            // Moving platform behavior
            movingHorizontal: true,
            movingVertical: false,
            moveSpeed: 1,
            moveDistance: 100,
            startPosition: { x: this.x, y: this.y },
            moveDirection: 1, // 1 for positive, -1 for negative
            pauseTime: 0,
            pauseDuration: 0.5 // seconds to pause at endpoints
          };
          
        case 'breaking':
          return {
            // Breaking platform behavior
            breakingState: 'stable', // stable, breaking, broken
            breakingTimer: 0,
            breakingDuration: 0.5, // seconds to break after triggered
            respawnTimer: 0,
            respawnDuration: 3.0, // seconds until respawn
            triggered: false
          };
          
        case 'bouncy':
          return {
            // Bouncy platform behavior
            bounciness: 1.5, // multiplier for player's jump velocity
            compressionState: 0, // visual compression when landed on
            recoverSpeed: 5 // how quickly platform recovers from compression
          };
          
        case 'ground':
        case 'platform':
        default:
          return {
            // Standard static platform behavior
            static: true
          };
      }
    }
    
    /**
     * Initialize style properties based on platform type
     * @returns {Object} - Style configuration
     */
    initStyle() {
      switch (this.type) {
        case 'ground':
          return {
            fill: '#8B4513', // Brown
            stroke: '#654321',
            strokeWidth: 2,
            pattern: 'dirt'
          };
          
        case 'moving':
          return {
            fill: '#4682B4', // Steel blue
            stroke: '#36648B',
            strokeWidth: 2,
            pattern: 'metal'
          };
          
        case 'breaking':
          return {
            fill: '#CD853F', // Peru (wooden color)
            stroke: '#8B5A2B',
            strokeWidth: 1,
            pattern: 'wood'
          };
          
        case 'bouncy':
          return {
            fill: '#32CD32', // Lime green
            stroke: '#228B22',
            strokeWidth: 2,
            pattern: 'spring'
          };
          
        case 'platform':
        default:
          return {
            fill: '#A0522D', // Sienna (medium brown)
            stroke: '#654321',
            strokeWidth: 2,
            pattern: 'wood'
          };
      }
    }
    
    /**
     * Update platform state based on time
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
      // Update animation
      this.animation.frameTime += deltaTime;
      if (this.animation.frameTime > 0.25) { // 4 FPS for animations
        this.animation.frameTime = 0;
        if (this.type === 'breaking' && this.behaviors.breakingState === 'breaking') {
          this.animation.frame = (this.animation.frame + 1) % this.animation.totalFrames;
        }
      }
      
      // Different behavior based on platform type
      switch (this.type) {
        case 'moving':
          this.updateMovingPlatform(deltaTime);
          break;
          
        case 'breaking':
          this.updateBreakingPlatform(deltaTime);
          break;
          
        case 'bouncy':
          this.updateBouncyPlatform(deltaTime);
          break;
      }
    }
    
    /**
     * Update moving platform behavior
     * @param {number} deltaTime - Time since last update
     */
    updateMovingPlatform(deltaTime) {
      const behaviors = this.behaviors;
      
      // Check if platform is paused at an endpoint
      if (behaviors.pauseTime > 0) {
        behaviors.pauseTime -= deltaTime;
        this.velocityX = 0;
        this.velocityY = 0;
        return;
      }
      
      // Move horizontally
      if (behaviors.movingHorizontal) {
        // Calculate the distance from start position
        const distanceX = Math.abs(this.x - behaviors.startPosition.x);
        
        // Check if we've reached the movement distance
        if (distanceX >= behaviors.moveDistance) {
          // Reverse direction and pause
          behaviors.moveDirection *= -1;
          behaviors.pauseTime = behaviors.pauseDuration;
        }
        
        // Set velocity based on direction
        this.velocityX = behaviors.moveSpeed * behaviors.moveDirection;
      }
      
      // Move vertically
      if (behaviors.movingVertical) {
        // Calculate the distance from start position
        const distanceY = Math.abs(this.y - behaviors.startPosition.y);
        
        // Check if we've reached the movement distance
        if (distanceY >= behaviors.moveDistance) {
          // Reverse direction and pause
          behaviors.moveDirection *= -1;
          behaviors.pauseTime = behaviors.pauseDuration;
        }
        
        // Set velocity based on direction
        this.velocityY = behaviors.moveSpeed * behaviors.moveDirection;
      }
    }
    
    /**
     * Update breaking platform behavior
     * @param {number} deltaTime - Time since last update
     */
    updateBreakingPlatform(deltaTime) {
      const behaviors = this.behaviors;
      
      if (behaviors.breakingState === 'breaking') {
        // Increment breaking timer
        behaviors.breakingTimer += deltaTime;
        
        // Check if breaking time is complete
        if (behaviors.breakingTimer >= behaviors.breakingDuration) {
          behaviors.breakingState = 'broken';
          this.solid = false; // No longer solid, players fall through
        }
      } else if (behaviors.breakingState === 'broken') {
        // Increment respawn timer
        behaviors.respawnTimer += deltaTime;
        
        // Check if respawn time is complete
        if (behaviors.respawnTimer >= behaviors.respawnDuration) {
          // Respawn the platform
          behaviors.breakingState = 'stable';
          behaviors.breakingTimer = 0;
          behaviors.respawnTimer = 0;
          behaviors.triggered = false;
          this.solid = true;
          this.animation.frame = 0;
        }
      }
    }
    
    /**
     * Update bouncy platform behavior
     * @param {number} deltaTime - Time since last update
     */
    updateBouncyPlatform(deltaTime) {
      const behaviors = this.behaviors;
      
      // Recover from compression over time
      if (behaviors.compressionState > 0) {
        behaviors.compressionState -= behaviors.recoverSpeed * deltaTime;
        if (behaviors.compressionState < 0) {
          behaviors.compressionState = 0;
        }
      }
    }
    
    /**
     * Trigger the platform's special behavior when a player lands on it
     * @param {Object} player - Player that interacted with the platform
     * @returns {boolean} - True if behavior was triggered
     */
    triggerBehavior(player) {
      switch (this.type) {
        case 'breaking':
          // Start breaking sequence when player lands
          if (this.behaviors.breakingState === 'stable' && !this.behaviors.triggered) {
            this.behaviors.breakingState = 'breaking';
            this.behaviors.breakingTimer = 0;
            this.behaviors.triggered = true;
            this.animation.frame = 0;
            return true;
          }
          return false;
          
        case 'bouncy':
          // Apply bounce effect to player
          if (player.velocityY > 0) { // Only bounce if player is falling
            player.velocityY = -Math.abs(player.velocityY) * this.behaviors.bounciness;
            player.isJumping = true;
            player.isGrounded = false;
            
            // Visual feedback - compress the platform
            this.behaviors.compressionState = 1.0;
            return true;
          }
          return false;
          
        default:
          return false;
      }
    }
    
    /**
     * Adjust player position when riding a moving platform
     * @param {Object} player - Player riding the platform
     */
    adjustPlayerPosition(player) {
      if (this.type === 'moving') {
        // Apply platform velocity to player
        player.x += this.velocityX;
        player.y += this.velocityY;
      }
    }
    
    /**
     * Get platform bounding box for collision detection
     * @returns {Object} - Bounding box with x, y, width, height
     */
    getBoundingBox() {
      // For solid platforms, return normal bounding box
      if (this.solid) {
        return {
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height
        };
      }
      
      // For non-solid platforms (like broken platforms), return empty box
      return {
        x: this.x,
        y: this.y,
        width: 0,
        height: 0
      };
    }
    
    /**
     * Get platform visual representation information
     * @returns {Object} - Visual properties including position, size, style
     */
    getVisualInfo() {
      const info = {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        style: { ...this.style },
        animation: {
          frame: this.animation.frame,
          totalFrames: this.animation.totalFrames
        }
      };
      
      // Apply visual modifications based on platform state
      if (this.type === 'bouncy' && this.behaviors.compressionState > 0) {
        // Compress bouncy platform visually
        const compression = this.behaviors.compressionState * 0.2;
        info.height *= (1 - compression);
        info.y += this.height * compression;
      }
      
      return info;
    }
    
    /**
     * Get platform state for network transmission
     * @returns {Object} - Serialized platform state
     */
    getNetworkState() {
      return {
        id: this.id,
        type: this.type,
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        velocityX: this.velocityX,
        velocityY: this.velocityY,
        solid: this.solid,
        animation: {
          frame: this.animation.frame
        },
        state: this.type === 'breaking' ? this.behaviors.breakingState : undefined
      };
    }
  }
  
  export { Platform };
