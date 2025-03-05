
// server/services/gameEngine.js
const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

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
      if (this.isColliding(player, platform)) {
        // Only collide from above (basic platformer physics)
        if (player.velocityY > 0 && player.y + player.height - player.velocityY <= platform.y) {
          player.y = platform.y - player.height;
          player.velocityY = 0;
          player.isJumping = false;
          player.isGrounded = true;
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
      health: 100
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
      health: 1
    };

    this.enemies.set(id, newEnemy);
    return newEnemy;
  }

  /**
   * Remove an enemy from the game
   * @param {string} id - Enemy ID to remove
   */
  defeatEnemy(id) {
    this.enemies.delete(id);
    this.emit('enemy:defeat', { enemyId: id });
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
      collectibles: this.collectibles
    };
  }
}

export default GameEngine;
