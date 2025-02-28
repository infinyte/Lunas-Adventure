// client/scripts/entities/player.js

/**
 * Player Entity - Luna the Guinea Pig
 * 
 * This class represents the player character "Luna" in the game.
 * It handles the player's state, properties, and gameplay mechanics.
 */
class Player {
    /**
     * Create a new player entity
     * @param {string} id - Unique identifier
     * @param {number} x - Initial X position
     * @param {number} y - Initial Y position
     * @param {number} width - Player width
     * @param {number} height - Player height
     */
    constructor(id, x, y, width, height) {
      // Core properties
      this.id = id;
      this.x = x;
      this.y = y;
      this.width = width || 60;
      this.height = height || 40;
      
      // Physics properties
      this.velocityX = 0;
      this.velocityY = 0;
      this.isGrounded = false;
      this.isJumping = false;
      this.direction = 'right';
      
      // Game state properties
      this.health = 100;
      this.lives = 3;
      this.score = 0;
      this.carrotsCollected = 0;
      
      // Visual state properties
      this.visible = true;
      this.flashing = false;
      this.invulnerable = false;
      this.animations = {
        current: 'idle',
        frame: 0,
        frameTime: 0
      };
      
      // Abilities and power-ups
      this.abilities = {
        doubleJump: false,
        highJump: false,
        speedBoost: false
      };
      
      console.log(`Player (${id}) created at position (${x}, ${y})`);
    }
    
    /**
     * Update player state based on time
     * @param {number} deltaTime - Time since last update
     */
    update(deltaTime) {
      // Update animation frame
      this.animations.frameTime += deltaTime;
      if (this.animations.frameTime > 0.1) { // 10 FPS animations
        this.animations.frameTime = 0;
        this.animations.frame = (this.animations.frame + 1) % 4; // 4 frames per animation
      }
      
      // Determine current animation state
      if (Math.abs(this.velocityX) > 0.5) {
        this.animations.current = 'run';
      } else if (this.isJumping) {
        this.animations.current = 'jump';
      } else if (!this.isGrounded) {
        this.animations.current = 'fall';
      } else {
        this.animations.current = 'idle';
      }
      
      // Adjust animation based on damage state
      if (this.flashing) {
        // Alternate visibility for damage flashing effect
        this.visible = !this.visible;
      }
      
      // Apply speed boost if active
      if (this.abilities.speedBoost) {
        this.velocityX *= 1.5;
      }
    }
    
    /**
     * Handle player taking damage
     * @param {number} amount - Amount of damage
     * @returns {boolean} - True if player is still alive
     */
    takeDamage(amount) {
      // If invulnerable, ignore damage
      if (this.invulnerable) return true;
      
      // Apply damage
      this.health -= amount;
      
      // Make invulnerable temporarily
      this.invulnerable = true;
      this.flashing = true;
      
      // Check if player died
      if (this.health <= 0) {
        this.die();
        return false;
      }
      
      // Player survived
      return true;
    }
    
    /**
     * Handle player death
     */
    die() {
      // Reduce lives
      this.lives--;
      
      // Reset health if lives remaining
      if (this.lives > 0) {
        this.health = 100;
      }
      
      // Reset power-ups
      this.abilities.doubleJump = false;
      this.abilities.highJump = false;
      this.abilities.speedBoost = false;
      
      console.log(`Player ${this.id} died. Lives remaining: ${this.lives}`);
    }
    
    /**
     * Activate a power-up
     * @param {string} type - Power-up type
     * @param {number} duration - Duration in seconds (0 for permanent)
     */
    activatePowerUp(type, duration = 0) {
      // Apply power-up effect
      switch (type) {
        case 'doubleJump':
          this.abilities.doubleJump = true;
          break;
          
        case 'highJump':
          this.abilities.highJump = true;
          break;
          
        case 'speedBoost':
          this.abilities.speedBoost = true;
          break;
          
        case 'health':
          this.health = Math.min(this.health + 25, 100);
          break;
          
        case 'extraLife':
          this.lives++;
          break;
      }
      
      // If temporary power-up, set timeout to remove it
      if (duration > 0 && type !== 'health' && type !== 'extraLife') {
        setTimeout(() => {
          this.abilities[type] = false;
          console.log(`Power-up ${type} expired for player ${this.id}`);
        }, duration * 1000);
      }
      
      console.log(`Player ${this.id} activated power-up: ${type}`);
    }
    
    /**
     * Get player bounding box for collision detection
     * @returns {Object} - Bounding box with x, y, width, height
     */
    getBoundingBox() {
      // Return slightly smaller collision box than visual size
      // This makes the game feel more forgiving with collisions
      return {
        x: this.x + 5,
        y: this.y + 2,
        width: this.width - 10,
        height: this.height - 4
      };
    }
    
    /**
     * Get player state for network transmission
     * @returns {Object} - Serialized player state
     */
    getNetworkState() {
      return {
        id: this.id,
        x: this.x,
        y: this.y,
        velocityX: this.velocityX,
        velocityY: this.velocityY,
        direction: this.direction,
        isGrounded: this.isGrounded,
        isJumping: this.isJumping,
        health: this.health,
        animation: this.animations.current,
        frame: this.animations.frame
      };
    }
    
    /**
     * Reset player to initial state
     * @param {number} x - Respawn X position
     * @param {number} y - Respawn Y position
     */
    reset(x, y) {
      // Position
      this.x = x;
      this.y = y;
      
      // Physics
      this.velocityX = 0;
      this.velocityY = 0;
      this.isGrounded = false;
      this.isJumping = false;
      
      // Reset visual state
      this.visible = true;
      this.flashing = false;
      this.invulnerable = false;
      
      // Reset animation
      this.animations.current = 'idle';
      this.animations.frame = 0;
      this.animations.frameTime = 0;
      
      // Keep score and collectibles count
      
      console.log(`Player ${this.id} reset to position (${x}, ${y})`);
    }
  }
  
  export { Player };
