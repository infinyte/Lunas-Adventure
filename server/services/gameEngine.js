
import { EventEmitter } from 'node:events';

/**
 * Game Engine Service
 * Handles core game logic, physics calculations, and state management
 */
class GameEngine extends EventEmitter {
  constructor() {
    super();
    this.players = new Map();
    this.enemies = new Map();
    this.platforms = [];
    this.collectibles = [];
    this.doors = [];
    this.gravity = 0.5;
    this.friction = 0.8;
    this.gameLoop = null;
    this.fps = 60;
    this.isRunning = false;

    // Initialize game state
    this.initializeGame();
  }

  /**
   * Initialize the game world and physics
   */
  initializeGame() {
    // Create base platforms for the first level
    this.platforms = [
      { id: 'platform-1', x: 0, y: 500, width: 800, height: 50, type: 'ground' },
      { id: 'platform-2', x: 200, y: 400, width: 200, height: 20, type: 'platform' },
      { id: 'platform-3', x: 500, y: 350, width: 200, height: 20, type: 'platform' },
      { id: 'platform-4', x: 700, y: 250, width: 200, height: 20, type: 'platform' }
    ];
    
    // Create collectibles (carrots for Luna)
    this.collectibles = [
      { id: 'carrot-1', x: 300, y: 370, width: 30, height: 30, type: 'carrot', collected: false },
      { id: 'carrot-2', x: 600, y: 320, width: 30, height: 30, type: 'carrot', collected: false },
      { id: 'carrot-3', x: 800, y: 220, width: 30, height: 30, type: 'carrot', collected: false }
    ];
    
    // Create enemies
    this.enemies = new Map();
    this.addEnemy('enemy-1', 400, 470, 'basic');
    this.addEnemy('enemy-2', 600, 320, 'flying');

    // Projectiles (created by shooter enemies)
    this.projectiles = [];
    this.projectileId = 0;
  }
  
  /**
   * Start the game loop
   */
  startGame() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    const frameTime = 1000 / this.fps;
    
    this.gameLoop = setInterval(() => {
      this.update();
      this.emit('game:update', this.getGameState());
    }, frameTime);
    
    console.log('Game loop started');
  }
  
  /**
   * Stop the game loop
   */
  stopGame() {
    if (!this.isRunning) return;
    
    clearInterval(this.gameLoop);
    this.isRunning = false;
    console.log('Game loop stopped');
  }
  
  /**
   * Update all game entities and physics
   */
  update() {
    // Update platform states (breaking timers, etc.)
    this.updatePlatforms();

    // Update all players
    for (const [id, player] of this.players.entries()) {
      this.updatePlayerPhysics(player);
      this.checkCollisions(player);
    }

    // Update all enemies
    for (const [id, enemy] of this.enemies.entries()) {
      this.updateEnemyAI(enemy);
      this.updateEnemyPhysics(enemy);
    }

    // Move projectiles and check hits
    this.updateProjectiles();
  }
  
  /**
   * Apply physics to player entity
   * @param {Object} player - Player object
   */
  updatePlayerPhysics(player) {
    // Apply gravity
    player.velocityY += this.gravity;
    
    // Apply horizontal friction
    player.velocityX *= this.friction;
    
    // Update position
    player.x += player.velocityX;
    player.y += player.velocityY;
    
    // Check world boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > 1000) player.x = 1000 - player.width;
    
    // Check if player fell off the world
    if (player.y > 600) {
      this.playerDeath(player.id);
    }
  }
  
  /**
   * Check for collisions between player and other game entities
   * @param {Object} player - Player object
   */
  checkCollisions(player) {
    // Check platform collisions
    for (const platform of this.platforms) {
      // Skip non-solid (broken) platforms
      if (platform.solid === false) continue;

      if (this.isColliding(player, platform)) {
        // Only collide from above (basic platformer physics)
        if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y) {
          player.y = platform.y - player.height;

          if (platform.type === 'bouncy') {
            // Reflect velocity upward with the bounce force multiplier (1.5x)
            player.velocityY = -Math.abs(player.velocityY) * 1.5;
            player.isJumping = true;
            player.isGrounded = false;
          } else {
            player.velocityY = 0;
            player.isJumping = false;
            player.isGrounded = true;

            // Carry player with moving platform
            if (platform.type === 'moving' && platform.velocityX) {
              player.x += platform.velocityX;
            }
          }

          // Start the crumble sequence when player first lands on a breaking platform
          if (platform.type === 'breaking' && platform.breakingState === 'stable') {
            platform.breakingState = 'breaking';
            platform.breakingTimer = 0;
          }
        }
      }
    }
    
    // Check collectible collisions
    for (const collectible of this.collectibles) {
      if (!collectible.collected && this.isColliding(player, collectible)) {
        collectible.collected = true;
        player.score += 100;
        this.emit('player:collect', { playerId: player.id, collectibleId: collectible.id });
      }
    }
    
    // Check enemy collisions
    for (const [id, enemy] of this.enemies.entries()) {
      if (this.isColliding(player, enemy)) {
        // If player is above enemy, defeat enemy
        if (player.velocityY > 0 && player.y + player.height - player.velocityY <= enemy.y) {
          this.defeatEnemy(id);
          player.velocityY = -10; // Bounce off enemy
          player.score += 200;
        } else {
          // Player takes damage
          this.playerDamage(player.id);
        }
      }
    }
  }

  /**
   * Check if two entities are colliding
   * @param {Object} entity1 - First entity
   * @param {Object} entity2 - Second entity
   * @returns {boolean} - True if entities are colliding
   */
  isColliding(entity1, entity2) {
    return (
      entity1.x < entity2.x + entity2.width &&
      entity1.x + entity1.width > entity2.x &&
      entity1.y < entity2.y + entity2.height &&
      entity1.y + entity1.height > entity2.y
    );
  }

  /**
   * Add a new player to the game
   * @param {string} id - Player ID (socket ID)
   * @returns {Object} - New player object
   */
  addPlayer(id) {
    const newPlayer = {
      id,
      x: 50,
      y: 400,
      width: 60,
      height: 40,
      velocityX: 0,
      velocityY: 0,
      isJumping: false,
      isGrounded: false,
      direction: 'right',
      lives: 3,
      score: 0,
      health: 100,
      invulnerableUntil: 0
    };

    this.players.set(id, newPlayer);
    this.emit('player:join', { playerId: id });
    return newPlayer;
  }

  /**
   * Remove a player from the game
   * @param {string} id - Player ID to remove
   */
  removePlayer(id) {
    this.players.delete(id);
    this.emit('player:leave', { playerId: id });

    // If no players left, stop the game loop
    if (this.players.size === 0) {
      this.stopGame();
    }
  }

  /**
   * Add a new enemy to the game
   * @param {string} id - Enemy ID
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {string} type - Enemy type
   * @returns {Object} - New enemy object
   */
  addEnemy(id, x, y, type) {
    const newEnemy = {
      id,
      x,
      y,
      width: 40,
      height: 40,
      velocityX: type === 'flying' ? 2 : 1,
      velocityY: 0,
      type,
      direction: 'right',
      health: 1,
      attackCooldown: 0
    };

    this.enemies.set(id, newEnemy);
    return newEnemy;
  }

  /**
   * Remove an enemy from the game
   * @param {string} id - Enemy ID to remove
   */
  defeatEnemy(id) {
    if (!this.enemies.has(id)) {
      return;
    }

    this.enemies.delete(id);
    this.emit('enemy:defeated', { enemyId: id });
  }

  /**
   * Mark a collectible as collected by a player.
   * @param {string} playerId - Player ID
   * @param {string} collectibleId - Collectible ID
   */
  collectCollectible(playerId, collectibleId) {
    const player = this.players.get(playerId);
    const collectible = this.collectibles.find((item) => item.id === collectibleId && !item.collected);

    if (!player || !collectible) {
      return;
    }

    collectible.collected = true;
    player.score += 100;

    // If a key was collected, unlock the door it targets
    if (collectible.type === 'key' && collectible.target) {
      const door = this.doors.find((d) => d.id === collectible.target);
      if (door && door.locked) {
        door.locked = false;
        this.emit('door:unlocked', { doorId: door.id, playerId });
      }
    }

    this.emit('collectible:collected', { playerId, collectibleId });
  }

  /**
   * Update enemy AI behavior
   * @param {Object} enemy - Enemy object
   */
  updateEnemyAI(enemy) {
    if (enemy.type === 'basic') {
      // Basic enemies patrol back and forth
      if (enemy.direction === 'right') {
        enemy.velocityX = 1;
        if (enemy.x > 600) enemy.direction = 'left';
      } else {
        enemy.velocityX = -1;
        if (enemy.x < 300) enemy.direction = 'right';
      }
    } else if (enemy.type === 'flying') {
      // Flying enemies move in a sine wave pattern
      enemy.y = enemy.y + Math.sin(Date.now() / 500) * 2;

      if (enemy.direction === 'right') {
        enemy.velocityX = 2;
        if (enemy.x > 800) enemy.direction = 'left';
      } else {
        enemy.velocityX = -2;
        if (enemy.x < 500) enemy.direction = 'right';
      }
    } else if (enemy.type === 'shooter') {
      // Shooter enemies find the nearest player and fire projectiles
      let nearestPlayer = null;
      let nearestDist = Infinity;
      for (const [, player] of this.players.entries()) {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestPlayer = player;
        }
      }

      if (nearestPlayer && nearestDist <= 350) {
        // Face the player
        enemy.direction = nearestPlayer.x > enemy.x ? 'right' : 'left';

        // Maintain a comfortable shooting distance
        const dx = nearestPlayer.x - enemy.x;
        if (Math.abs(dx) < 150) {
          enemy.velocityX = dx > 0 ? -0.5 : 0.5; // too close — back away
        } else if (Math.abs(dx) > 250) {
          enemy.velocityX = dx > 0 ? 0.5 : -0.5; // too far — approach
        } else {
          enemy.velocityX = 0; // good range — stand and shoot
        }

        // Fire on cooldown
        if (enemy.attackCooldown <= 0) {
          this.fireProjectile(
            enemy,
            nearestPlayer.x + nearestPlayer.width / 2,
            nearestPlayer.y + nearestPlayer.height / 2
          );
          enemy.attackCooldown = 2.0;
        } else {
          enemy.attackCooldown -= 1 / this.fps;
        }
      } else {
        // No player in range — slow patrol
        if (enemy.direction === 'right') {
          enemy.velocityX = 0.5;
          if (enemy.x > 600) enemy.direction = 'left';
        } else {
          enemy.velocityX = -0.5;
          if (enemy.x < 300) enemy.direction = 'right';
        }
      }
    }
  }

  /**
   * Apply physics to enemy entity
   * @param {Object} enemy - Enemy object
   */
  updateEnemyPhysics(enemy) {
    // Apply gravity to non-flying enemies
    if (enemy.type !== 'flying') {
      enemy.velocityY += this.gravity;
    }
    
    // Update position
    enemy.x += enemy.velocityX;
    enemy.y += enemy.velocityY;
    
    // Check platform collisions for non-flying enemies
    if (enemy.type !== 'flying') {
      for (const platform of this.platforms) {
        if (this.isColliding(enemy, platform)) {
          if (enemy.velocityY > 0) {
            enemy.y = platform.y - enemy.height;
            enemy.velocityY = 0;
          }
        }
      }
    }
  }
  
  /**
   * Update platform state machines each tick (moving + breaking).
   */
  updatePlatforms() {
    const dt = 1 / this.fps;
    for (const platform of this.platforms) {
      if (platform.type === 'moving') {
        // Lazy-init moving state
        if (platform.moveStartX === undefined) {
          platform.moveStartX = platform.x;
          platform.moveStartY = platform.y;
          platform.moveDirection = 1;
          platform.moveSpeed = platform.moveSpeed || 1;
          platform.moveDistance = platform.moveDistance || 100;
          platform.movePauseTime = 0;
          platform.movePauseDuration = 0.5;
          platform.movingHorizontal = platform.movingHorizontal !== false;
          platform.movingVertical = platform.movingVertical === true;
          platform.velocityX = 0;
          platform.velocityY = 0;
        }

        if (platform.movePauseTime > 0) {
          platform.movePauseTime -= dt;
          platform.velocityX = 0;
          platform.velocityY = 0;
        } else {
          if (platform.movingHorizontal) {
            const distX = Math.abs(platform.x - platform.moveStartX);
            if (distX >= platform.moveDistance) {
              platform.moveDirection *= -1;
              platform.movePauseTime = platform.movePauseDuration;
            }
            platform.velocityX = platform.moveSpeed * platform.moveDirection;
          }
          if (platform.movingVertical) {
            const distY = Math.abs(platform.y - platform.moveStartY);
            if (distY >= platform.moveDistance) {
              platform.moveDirection *= -1;
              platform.movePauseTime = platform.movePauseDuration;
            }
            platform.velocityY = platform.moveSpeed * platform.moveDirection;
          }
          platform.x += platform.velocityX;
          platform.y += platform.velocityY;
        }
      } else if (platform.type === 'breaking') {
        // Lazy-init state fields for platforms loaded from level JSON
        if (platform.breakingState === undefined) {
          platform.breakingState = 'stable';
          platform.breakingTimer = 0;
          platform.respawnTimer = 0;
          platform.solid = true;
        }

        if (platform.breakingState === 'breaking') {
          platform.breakingTimer += dt;
          if (platform.breakingTimer >= 0.5) { // BREAKING_PLATFORM_DURATION
            platform.breakingState = 'broken';
            platform.solid = false;
            platform.breakingTimer = 0;
          }
        } else if (platform.breakingState === 'broken') {
          platform.respawnTimer += dt;
          if (platform.respawnTimer >= 3.0) { // BREAKING_PLATFORM_RESPAWN
            platform.breakingState = 'stable';
            platform.solid = true;
            platform.respawnTimer = 0;
          }
        }
      }
    }
  }

  /**
   * Fire a projectile from a shooter enemy toward a target point.
   * @param {Object} enemy - The enemy firing the projectile
   * @param {number} targetX - Target X coordinate
   * @param {number} targetY - Target Y coordinate
   */
  fireProjectile(enemy, targetX, targetY) {
    const id = `proj-${++this.projectileId}`;
    const startX = enemy.x + enemy.width / 2 - 6;
    const startY = enemy.y + enemy.height / 2 - 6;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const speed = 5;

    const projectile = {
      id,
      x: startX,
      y: startY,
      width: 12,
      height: 12,
      velocityX: (dx / dist) * speed,
      velocityY: (dy / dist) * speed,
      ownerId: enemy.id,
      damage: 15,
      lifetime: 3.0
    };

    this.projectiles.push(projectile);
    this.emit('projectile:fired', { id: projectile.id });
  }

  /**
   * Move all active projectiles, expire old ones, and check player hits.
   */
  updateProjectiles() {
    const dt = 1 / this.fps;
    this.projectiles = this.projectiles.filter((proj) => {
      proj.x += proj.velocityX;
      proj.y += proj.velocityY;
      proj.lifetime -= dt;

      if (proj.lifetime <= 0) return false;
      if (proj.x < -50 || proj.x > 1100 || proj.y < -50 || proj.y > 700) return false;

      for (const [playerId, player] of this.players.entries()) {
        if (this.isColliding(proj, player)) {
          this.playerDamage(playerId);
          return false; // projectile consumed on hit
        }
      }

      return true;
    });
  }

  /**
   * Handle player jump event
   * @param {string} playerId - Player ID
   */
  playerJump(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    if (!player.isJumping && player.isGrounded) {
      player.velocityY = -12;
      player.isJumping = true;
      player.isGrounded = false;
      this.emit('player:jump', { playerId });
    }
  }
  
  /**
   * Update player position based on input
   * @param {string} playerId - Player ID
   * @param {Object} data - Movement data
   */
  updatePlayerPosition(playerId, data) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    if (data.direction === 'left') {
      player.velocityX = -5;
      player.direction = 'left';
    } else if (data.direction === 'right') {
      player.velocityX = 5;
      player.direction = 'right';
    }
  }
  
  /**
   * Handle player damage
   * @param {string} playerId - Player ID
   */
  playerDamage(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;

    // Invulnerability guard — prevents per-frame damage spam
    if (Date.now() < player.invulnerableUntil) return;
    player.invulnerableUntil = Date.now() + 1500;

    player.health -= 20;
    
    if (player.health <= 0) {
      this.playerDeath(playerId);
    } else {
      // Invulnerability and knockback
      player.velocityY = -8;
      player.velocityX = player.direction === 'right' ? -5 : 5;
      this.emit('player:damage', { playerId, health: player.health });
    }
  }
  
  /**
   * Handle player death
   * @param {string} playerId - Player ID
   */
  playerDeath(playerId) {
    const player = this.players.get(playerId);
    if (!player) return;
    
    player.lives -= 1;
    
    if (player.lives <= 0) {
      this.emit('player:gameover', { playerId, score: player.score });
    } else {
      // Respawn player
      player.x = 50;
      player.y = 400;
      player.velocityX = 0;
      player.velocityY = 0;
      player.health = 100;
      player.invulnerableUntil = Date.now() + 1500; // spawn grace period
      this.emit('player:respawn', { playerId, lives: player.lives });
    }
  }
  
  /**
   * Get the current game state
   * @returns {Object} - Complete game state
   */
  getGameState() {
    return {
      players: Array.from(this.players.values()),
      enemies: Array.from(this.enemies.values()),
      platforms: this.platforms,
      collectibles: this.collectibles,
      projectiles: this.projectiles,
      doors: this.doors
    };
  }
}

export default GameEngine;
