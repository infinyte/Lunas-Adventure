// client/scripts/entities/collectible.js

/**
 * Collectible Entity
 * 
 * This class represents collectible items in the game such as carrots, 
 * power-ups, and other items that the player can interact with.
 */
class Collectible {
    /**
     * Create a new collectible entity
     * @param {string} id - Unique identifier
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Collectible width
     * @param {number} height - Collectible height
     * @param {string} type - Collectible type ('carrot', 'powerup', 'coin', 'key', etc.)
     * @param {Object} options - Additional configuration options
     */
    constructor(id, x, y, width, height, type = 'carrot', options = {}) {
      // Core properties
      this.id = id;
      this.x = x;
      this.y = y;
      this.width = width || 30;
      this.height = height || 30;
      this.type = type;
      
      // State properties
      this.collected = false;
      this.respawns = options.respawns || false;
      this.respawnTime = options.respawnTime || 10; // seconds until respawn
      this.respawnTimer = 0;
      this.value = this.getValue();
      
      // Physics properties
      this.velocityX = 0;
      this.velocityY = 0;
      this.hasGravity = options.hasGravity || false;
      this.bounces = options.bounces || false;
      
      // Visual properties
      this.animations = {
        current: 'idle',
        frame: 0,
        frameTime: 0,
        totalFrames: 4
      };
      
      // Special properties based on collectible type
      this.properties = this.initProperties(options);
      
      console.log(`Collectible (${id}) of type ${type} created at position (${x}, ${y})`);
    }
    
    /**
     * Get default value based on collectible type
     * @returns {number} - Value when collected
     */
    getValue() {
      switch (this.type) {
        case 'carrot':
          return 100;  // Base points
        case 'goldenCarrot':
          return 500;  // Rare special carrot
        case 'coin':
          return 50;   // Common collectible
        case 'gem':
          return 200;  // Rare collectible
        case 'key':
          return 0;    // Keys are valuable for unlocking, not points
        case 'powerup':
          return 0;    // Power-ups give abilities, not points
        default:
          return 10;   // Default value
      }
    }
    
    /**
     * Initialize additional properties based on collectible type
     * @param {Object} options - Additional configuration options
     * @returns {Object} - Additional properties
     */
    initProperties(options) {
      switch (this.type) {
        case 'powerup':
          return {
            // Power-up properties
            powerupType: options.powerupType || 'speedBoost',
            duration: options.duration || 10, // seconds
            strength: options.strength || 1.0 // multiplier
          };
          
        case 'key':
          return {
            // Key properties
            color: options.color || 'yellow',
            target: options.target || null // ID of the door/lock this key opens
          };
          
        case 'coin':
        case 'gem':
          return {
            // Valuable collectible properties
            color: options.color || 'gold',
            sparkles: true
          };
          
        case 'carrot':
        case 'goldenCarrot':
        default:
          return {
            // Carrot properties
            fresh: true,
            bobbing: true // Carrots bob up and down
          };
      }
    }
    
    /**
     * Update collectible state based on time
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
      // If already collected, process respawn timer if applicable
      if (this.collected && this.respawns) {
        this.respawnTimer += deltaTime;
        
        if (this.respawnTimer >= this.respawnTime) {
          this.collected = false;
          this.respawnTimer = 0;
          console.log(`Collectible ${this.id} respawned`);
        }
        
        return;
      }
      
      // Skip updates for collected items
      if (this.collected) return;
      
      // Update animation
      this.animations.frameTime += deltaTime;
      if (this.animations.frameTime > 0.25) { // 4 FPS animations
        this.animations.frameTime = 0;
        this.animations.frame = (this.animations.frame + 1) % this.animations.totalFrames;
      }
      
      // Apply gravity if enabled
      if (this.hasGravity) {
        this.velocityY += 0.5; // Gravity constant
        
        // Terminal velocity
        if (this.velocityY > 10) {
          this.velocityY = 10;
        }
        
        // Update position
        this.y += this.velocityY * deltaTime;
        this.x += this.velocityX * deltaTime;
      }
      
      // Apply bobbing animation for certain types
      if (this.properties.bobbing) {
        // Create gentle bobbing motion
        this.y += Math.sin(Date.now() * 0.003) * 0.5;
      }
      
      // Rotation animation for coins
      if (this.type === 'coin' || this.type === 'gem') {
        // Update animation based on apparent rotation
        const rotationPhase = (Date.now() * 0.002) % (Math.PI * 2);
        const apparentWidth = Math.abs(Math.sin(rotationPhase) * this.width);
        
        // When coin appears thinnest, switch animation frame to simulate rotation
        if (apparentWidth < this.width * 0.3) {
          this.animations.current = 'edge';
        } else {
          this.animations.current = 'face';
        }
      }
    }
    
    /**
     * Collect this item
     * @param {Object} player - Player who collected the item
     * @returns {Object} - Collection result including type, value, and effects
     */
    collect(player) {
      if (this.collected) return null;
      
      // Mark as collected
      this.collected = true;
      
      // Prepare result
      const result = {
        type: this.type,
        value: this.value,
        effects: []
      };
      
      // Apply special effects based on collectible type
      switch (this.type) {
        case 'carrot':
          // Standard carrot - just points
          result.effects.push({
            type: 'score',
            value: this.value
          });
          player.carrotsCollected++;
          break;
          
        case 'goldenCarrot':
          // Golden carrot - bonus points
          result.effects.push({
            type: 'score',
            value: this.value
          });
          result.effects.push({
            type: 'bonus',
            value: 'Golden Carrot Bonus!'
          });
          player.carrotsCollected++;
          break;
          
        case 'powerup':
          // Power-up - apply effect to player
          result.effects.push({
            type: 'powerup',
            powerupType: this.properties.powerupType,
            duration: this.properties.duration,
            strength: this.properties.strength
          });
          
          // Apply the power-up effect
          if (player.activatePowerUp) {
            player.activatePowerUp(
              this.properties.powerupType,
              this.properties.duration
            );
          }
          break;
          
        case 'key':
          // Key - add to player's inventory
          result.effects.push({
            type: 'key',
            color: this.properties.color,
            target: this.properties.target
          });
          break;
          
        case 'coin':
        case 'gem':
          // Valuable - just points
          result.effects.push({
            type: 'score',
            value: this.value
          });
          break;
      }
      
      console.log(`Collectible ${this.id} of type ${this.type} collected by player ${player.id}`);
      
      return result;
    }
    
    /**
     * Get collectible bounding box for collision detection
     * @returns {Object} - Bounding box with x, y, width, height
     */
    getBoundingBox() {
      // Skip collision if already collected
      if (this.collected) {
        return {
          x: this.x,
          y: this.y,
          width: 0,
          height: 0
        };
      }
      
      // Use slightly smaller collision box for better gameplay feel
      return {
        x: this.x + 5,
        y: this.y + 5,
        width: this.width - 10,
        height: this.height - 10
      };
    }
    
    /**
     * Get collectible visual information
     * @returns {Object} - Visual properties including position, size, animation
     */
    getVisualInfo() {
      // Skip visuals if collected
      if (this.collected) return null;
      
      return {
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        type: this.type,
        animation: {
          current: this.animations.current,
          frame: this.animations.frame,
          totalFrames: this.animations.totalFrames
        },
        properties: this.properties
      };
    }
    
    /**
     * Get collectible state for network transmission
     * @returns {Object} - Serialized collectible state
     */
    getNetworkState() {
      return {
        id: this.id,
        type: this.type,
        x: this.x,
        y: this.y,
        width: this.width,
        height: this.height,
        collected: this.collected,
        animation: {
          current: this.animations.current,
          frame: this.animations.frame
        }
      };
    }
  }
  
  export { Collectible };