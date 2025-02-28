// client/scripts/entities/enemy.js

/**
 * Enemy Entity
 * This class represents enemies in the game.
 * Different enemy types have different behaviors and characteristics.
 */
class Enemy {
/**
 * Create a new enemy entity
 * @param {string} id - Unique identifier
 * @param {number} x - Initial X position
 * @param {number} y - Initial Y position
 * @param {number} width - Enemy width
 * @param {number} height - Enemy height
 * @param {string} type - Enemy type ('basic', 'flying', 'shooter', 'boss')
 */
  constructor(id, x, y, width, height, type = 'basic') {
    // Core properties
    this.id = id;
    this.x = x;
    this.y = y;
    this.width = width || 40;
    this.height = height || 40;
    this.type = type;

    // Physics properties
    this.velocityX = 0;
    this.velocityY = 0;
    this.direction = 'right';
    this.isGrounded = false;

    // Patrol boundaries
    this.patrolStart = x - 100;
    this.patrolEnd = x + 100;
    this.startY = y;  // Starting Y position (for flying enemies)

    // Combat properties
    this.health = this.getDefaultHealth();
    this.damage = this.getDefaultDamage();
    this.isInvulnerable = false;

    // Visual properties
    this.animations = {
      current: 'idle',
      frame: 0,
      frameTime: 0
    };

    // Enemy-specific properties
    this.attackCooldown = 0;
    this.attackRange = this.getAttackRange();
    this.detectionRange = this.getDetectionRange();
    this.isAggressive = false;

    console.log(`Enemy (${id}) of type ${type} created at position (${x}, ${y})`);
  }

    /**
     * Get default health based on enemy type
     * @returns {number} - Default health value
     */
    getDefaultHealth() {
        switch (this.type) {
            case 'flying':
                return 1;  // Flying enemies are fragile
            case 'shooter':
                return 2;  // Shooter enemies have medium health
            case 'boss':
                return 10; // Bosses have high health
            case 'basic':
            default:
                return 1;  // Basic enemies have low health
        }
    }

    /**
     * Get default damage based on enemy type
     * @returns {number} - Default damage value
     */
    getDefaultDamage() {
        switch (this.type) {
            case 'flying':
                return 10;  // Flying enemies do less damage
            case 'shooter':
                return 15;  // Shooter enemies do medium damage
            case 'boss':
                return 25;  // Bosses do high damage
            case 'basic':
            default:
                return 20;  // Basic enemies do normal damage
        }
    }

    /**
     * Get attack range based on enemy type
     * @returns {number} - Attack range in pixels
     */
    getAttackRange() {
        switch (this.type) {
            case 'flying':
                return 20;   // Flying enemies need to be close
            case 'shooter':
                return 300;  // Shooter enemies have long range
            case 'boss':
                return 150;  // Bosses have medium range
            case 'basic':
            default:
                return 30;   // Basic enemies need to be close
        }
    }

    /**
     * Get detection range based on enemy type
     * @returns {number} - Detection range in pixels
     */
    getDetectionRange() {
        switch (this.type) {
            case 'flying':
                return 200;  // Flying enemies can see farther
            case 'shooter':
                return 350;  // Shooter enemies have good eyesight
            case 'boss':
                return 400;  // Bosses can detect players from far away
            case 'basic':
            default:
                return 150;  // Basic enemies have limited sight
        }
    }

    /**
     * Update enemy state based on time and player position
     * @param {number} deltaTime - Time since last update
     * @param {Object} player - Player object to react to
     */
    update(deltaTime, player = null) {
        // Update animation frame
        this.animations.frameTime += deltaTime;
        if (this.animations.frameTime > 0.2) { // 5 FPS animations
            this.animations.frameTime = 0;
            this.animations.frame = (this.animations.frame + 1) % 3; // 3 frames per animation
        }

        // Reduce attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }

        // If player is provided, react to player
        if (player) {
            this.reactToPlayer(player, deltaTime);
        } else {
            // Default patrol behavior
            this.patrol(deltaTime);
        }

        // Set animation based on movement
        if (Math.abs(this.velocityX) > 0.1) {
            this.animations.current = 'move';
        } else {
            this.animations.current = 'idle';
        }
    }

    /**
     * Default patrol behavior
     * @param {number} deltaTime - Time since last update
     */
    patrol(deltaTime) {
        // Different movement patterns based on enemy type
        switch (this.type) {
            case 'flying':
                // Flying enemies move in a sine wave pattern
                if (this.direction === 'right') {
                    this.velocityX = 2;
                    if (this.x > this.patrolEnd) {
                        this.direction = 'left';
                    }
                } else {
                    this.velocityX = -2;
                    if (this.x < this.patrolStart) {
                        this.direction = 'right';
                    }
                }
                break;

            case 'shooter':
                // Shooter enemies move less but look around
                if (this.direction === 'right') {
                    this.velocityX = 0.5;
                    if (this.x > this.patrolEnd) {
                        this.direction = 'left';
                    }
                } else {
                    this.velocityX = -0.5;
                    if (this.x < this.patrolStart) {
                        this.direction = 'right';
                    }
                }
                break;

            case 'boss':
                // Bosses move slowly but with purpose
                if (this.direction === 'right') {
                    this.velocityX = 1;
                    if (this.x > this.patrolEnd) {
                        this.direction = 'left';
                    }
                } else {
                    this.velocityX = -1;
                    if (this.x < this.patrolStart) {
                        this.direction = 'right';
                    }
                }
                break;

            case 'basic':
            default:
                // Basic enemies move back and forth
                if (this.direction === 'right') {
                    this.velocityX = 1.5;
                    if (this.x > this.patrolEnd) {
                        this.direction = 'left';
                    }
                } else {
                    this.velocityX = -1.5;
                    if (this.x < this.patrolStart) {
                        this.direction = 'right';
                    }
                }
                break;
        }
    }

    /**
     * React to player presence
     * @param {Object} player - Player to react to
     * @param {number} deltaTime - Time since last update
     */
    reactToPlayer(player, deltaTime) {
        // Calculate distance to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Set direction based on player position
        this.direction = dx > 0 ? 'right' : 'left';

        // Check if player is within detection range
        if (distance <= this.detectionRange) {
            // Become aggressive
            this.isAggressive = true;

            // Different behavior based on enemy type
            switch (this.type) {
                case 'flying':
                    // Flying enemies chase the player
                    this.velocityX = dx > 0 ? 3 : -3;
                    // Adjust height to chase player with slight easing
                    this.velocityY = (player.y - this.y) * 0.1;
                    break;

                case 'shooter':
                    // Shooter enemies keep distance and shoot
                    if (distance < 150) {
                        // Too close, back away
                        this.velocityX = dx > 0 ? -1 : 1;
                    } else if (distance > 250) {
                        // Too far, get closer
                        this.velocityX = dx > 0 ? 1 : -1;
                    } else {
                        // Good distance, stop and attack
                        this.velocityX = 0;
                        this.attack(player, deltaTime);
                    }
                    break;

                case 'boss':
                    // Bosses have complex behavior
                    if (this.health < this.getDefaultHealth() * 0.3) {
                        // Low health - more aggressive
                        this.velocityX = dx > 0 ? 2 : -2;
                        // Jump toward player
                        if (this.isGrounded && Math.random() < 0.02) {
                            this.velocityY = -12;
                        }
                    } else {
                        // Normal behavior - steady approach
                        this.velocityX = dx > 0 ? 1.5 : -1.5;
                    }

                    // Attack if in range
                    if (distance <= this.attackRange) {
                        this.attack(player, deltaTime);
                    }
                    break;

                case 'basic':
                default:
                    // Basic enemies chase directly
                    this.velocityX = dx > 0 ? 2 : -2;

                    // Simple jumping over obstacles
                    if (this.isGrounded &&
                        Math.abs(dx) < 100 &&
                        dy < -20 &&
                        Math.random() < 0.05) {
                        this.velocityY = -10;
                    }

                    // Attack if in range
                    if (distance <= this.attackRange) {
                        this.attack(player, deltaTime);
                    }
                    break;
            }
        } else {
            // Player out of range, return to patrol
            this.isAggressive = false;
            this.patrol(deltaTime);
        }
    }

    /**
     * Attack the player
     * @param {Object} player - Player to attack
     * @param {number} deltaTime - Time since last update
     * @returns {boolean} - True if attack was performed
     */
    attack(player, deltaTime) {
        // Check if attack is on cooldown
        if (this.attackCooldown > 0) {
            return false;
        }

        // Set attack animation
        this.animations.current = 'attack';
        this.animations.frame = 0;

        // Set cooldown based on enemy type
        switch (this.type) {
            case 'shooter':
                this.attackCooldown = 2.0; // Shooters attack less often
                // TODO: Create projectile here
                console.log(`${this.type} enemy shot at player`);
                break;

            case 'boss':
                this.attackCooldown = 1.5; // Bosses have moderate cooldown
                console.log(`${this.type} enemy attacked player`);
                break;

            case 'flying':
            case 'basic':
            default:
                this.attackCooldown = 1.0; // Basic enemies have normal cooldown
                console.log(`${this.type} enemy attacked player`);
                break;
        }

        return true;
    }

    /**
     * Handle enemy taking damage
     * @param {number} amount - Amount of damage
     * @returns {boolean} - True if enemy is still alive
     */
    takeDamage(amount) {
        // If invulnerable, ignore damage
        if (this.isInvulnerable) return true;

        // Apply damage
        this.health -= amount;

        // Make briefly invulnerable to prevent multiple hits
        this.isInvulnerable = true;
        setTimeout(() => {
            this.isInvulnerable = false;
        }, 200);

        // Set hit animation
        this.animations.current = 'hit';
        this.animations.frame = 0;

        // Check if enemy died
        if (this.health <= 0) {
            this.die();
            return false;
        }

        // Increase aggression when hit
        this.isAggressive = true;

        // Enemy survived
        return true;
    }

    /**
     * Handle enemy death
     */
    die() {
        // Set death animation
        this.animations.current = 'die';
        this.animations.frame = 0;

        console.log(`Enemy ${this.id} of type ${this.type} died`);
    }

    /**
     * Get enemy bounding box for collision detection
     * @returns {Object} - Bounding box with x, y, width, height
     */
    getBoundingBox() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }

    /**
     * Get enemy state for network transmission
     * @returns {Object} - Serialized enemy state
     */
  getNetworkState() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      velocityX: this.velocityX,
      velocityY: this.velocityY,
      direction: this.direction,
      health: this.health,
      animation: this.animations.current,
      frame: this.animations.frame,
      isAggressive: this.isAggressive
    };
  }
}

export default Enemy;
// client/scripts/entities/index.js
