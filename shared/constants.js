// shared/constants.js

/**
 * Luna's Adventure Game Constants
 * 
 * This file contains all game constants shared between client and server
 * to ensure consistent gameplay and physics across all components.
 */

// Game world dimensions
export const GAME_WIDTH = 1000;
export const GAME_HEIGHT = 600;
export const WORLD_WIDTH = 2000;  // Level can be wider than visible area (for scrolling)
export const WORLD_HEIGHT = 600;

// Physics constants
export const GRAVITY = 0.5;
export const FRICTION = 0.8;
export const TERMINAL_VELOCITY = 12;

// Player constants
export const PLAYER_SPEED = 5;
export const JUMP_FORCE = 12;
export const DOUBLE_JUMP_FORCE = 10;
export const PLAYER_WIDTH = 60;
export const PLAYER_HEIGHT = 40;
export const PLAYER_INITIAL_LIVES = 3;
export const PLAYER_INITIAL_HEALTH = 100;
export const PLAYER_DAMAGE_INVULNERABILITY = 1500; // ms
export const PLAYER_KNOCKBACK_FORCE = 7;

// Enemy constants
export const ENEMY_SPEED = 1.5;
export const FLYING_ENEMY_SPEED = 2;
export const ENEMY_WIDTH = 40;
export const ENEMY_HEIGHT = 40;
export const ENEMY_PATROL_DISTANCE = 100;
export const ENEMY_DETECTION_RANGE = {
  BASIC: 150,
  FLYING: 200,
  SHOOTER: 350,
  BOSS: 400
};
export const ENEMY_ATTACK_RANGE = {
  BASIC: 30,
  FLYING: 20,
  SHOOTER: 300,
  BOSS: 150
};
export const ENEMY_DAMAGE = {
  BASIC: 20,
  FLYING: 10,
  SHOOTER: 15,
  BOSS: 25
};
export const ENEMY_HEALTH = {
  BASIC: 1,
  FLYING: 1,
  SHOOTER: 2,
  BOSS: 10
};

// Platform constants
export const PLATFORM_TYPES = {
  GROUND: 'ground',
  PLATFORM: 'platform',
  MOVING: 'moving',
  BREAKING: 'breaking',
  BOUNCY: 'bouncy'
};
export const BREAKING_PLATFORM_DURATION = 0.5; // seconds until breaks
export const BREAKING_PLATFORM_RESPAWN = 3.0;  // seconds until respawns
export const BOUNCY_PLATFORM_FORCE = 1.5;      // multiplier for bounce height
export const MOVING_PLATFORM_SPEED = 1;
export const MOVING_PLATFORM_PAUSE = 0.5;      // seconds to pause at endpoints

// Collectible constants
export const COLLECTIBLE_TYPES = {
  CARROT: 'carrot',
  GOLDEN_CARROT: 'goldenCarrot',
  COIN: 'coin',
  GEM: 'gem', 
  KEY: 'key',
  POWERUP: 'powerup'
};
export const COLLECTIBLE_VALUES = {
  CARROT: 100,
  GOLDEN_CARROT: 500,
  COIN: 50,
  GEM: 200,
  KEY: 0,      // Keys don't give points but unlock areas
  POWERUP: 0   // Power-ups give abilities, not points
};
export const COLLECTIBLE_WIDTH = 30;
export const COLLECTIBLE_HEIGHT = 30;
export const COLLECTIBLE_BOBBING_SPEED = 3;    // Speed of bobbing animation

// Power-up constants
export const POWERUP_TYPES = {
  SPEED_BOOST: 'speedBoost',
  HIGH_JUMP: 'highJump',
  DOUBLE_JUMP: 'doubleJump',
  INVULNERABILITY: 'invulnerability',
  HEALTH: 'health',
  EXTRA_LIFE: 'extraLife'
};
export const POWERUP_DURATIONS = {
  SPEED_BOOST: 10,     // seconds
  HIGH_JUMP: 8,        // seconds
  DOUBLE_JUMP: 15,     // seconds
  INVULNERABILITY: 5   // seconds
};
export const POWERUP_STRENGTH = {
  SPEED_BOOST: 1.5,    // multiplier
  HIGH_JUMP: 1.3,      // multiplier
  HEALTH: 25           // health points restored
};

// Game states
export const GAME_STATES = {
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
  LEVEL_COMPLETE: 'levelComplete',
  VICTORY: 'victory'
};

// Network events for multiplayer
export const NETWORK_EVENTS = {
  PLAYER_JOIN: 'player:join',
  PLAYER_LEAVE: 'player:leave',
  PLAYER_MOVE: 'player:move',
  PLAYER_JUMP: 'player:jump',
  PLAYER_DAMAGE: 'player:damage',
  PLAYER_DEATH: 'player:death',
  PLAYER_RESPAWN: 'player:respawn',
  PLAYER_COLLECT: 'player:collect',
  PLAYER_GAMEOVER: 'player:gameover',
  ENEMY_DEFEAT: 'enemy:defeat',
  GAME_START: 'game:start',
  GAME_STATE: 'game:state',
  LEVEL_REQUEST: 'level:request',
  LEVEL_DATA: 'level:data',
  LEVEL_COMPLETE: 'level:complete'
};

// Networking settings
export const NETWORK_UPDATE_RATE = 10;     // Updates per second
export const INPUT_BUFFER_SIZE = 20;       // Store last 20 inputs for reconciliation
export const CLIENT_PREDICTION = true;     // Enable client-side prediction
export const SERVER_RECONCILIATION = true; // Enable server reconciliation

// Animation constants
export const ANIMATION_FPS = 10;           // Frames per second for animations
export const PLAYER_ANIMATION_FRAMES = {
  IDLE: 4,
  RUN: 6,
  JUMP: 2,
  FALL: 2
};
export const ENEMY_ANIMATION_FRAMES = {
  IDLE: 3,
  MOVE: 4,
  ATTACK: 3,
  HIT: 2,
  DIE: 5
};

// Sound settings
export const MUSIC_VOLUME_DEFAULT = 0.7;
export const SFX_VOLUME_DEFAULT = 1.0;
export const SOUND_ENABLED_DEFAULT = true;

// Debug settings
export const DEBUG_COLLISION_BOXES = false;
export const DEBUG_PHYSICS = false;
export const DEBUG_FPS_COUNTER = false;
export const DEBUG_NETWORK = false;

// Asset paths
export const ASSET_PATHS = {
  SPRITES: 'assets/sprites/',
  SOUNDS: 'assets/sounds/',
  MUSIC: 'assets/music/',
  LEVELS: 'assets/levels/'
};

// Entity types for consistent type checking
export const ENTITY_TYPES = {
  PLAYER: 'player',
  ENEMY: 'enemy',
  PLATFORM: 'platform',
  COLLECTIBLE: 'collectible'
};

// UI constants
export const UI_NOTIFICATION_DURATION = 3000;  // ms
export const UI_SCORE_POPUP_DURATION = 1000;   // ms

// Level constants
export const TOTAL_LEVELS = 5;                 // Total number of levels in the game
export const LEVEL_TRANSITION_DURATION = 1000; // ms

// Mobile control settings
export const MOBILE_CONTROL_SIZE = 70;         // Size of mobile control buttons
export const MOBILE_JUMP_BUTTON_SIZE = 90;     // Size of jump button
export const MOBILE_CONTROL_OPACITY = 0.7;     // Opacity of mobile controls

/**
 * Helper function to get the default score value for a collectible type
 * @param {string} type - Collectible type
 * @returns {number} - Default score value
 */
export function getCollectibleValue(type) {
  return COLLECTIBLE_VALUES[type] || 10; // Default value if type not found
}

/**
 * Helper function to get the default health for an enemy type
 * @param {string} type - Enemy type
 * @returns {number} - Default health value
 */
export function getEnemyHealth(type) {
  return ENEMY_HEALTH[type.toUpperCase()] || 1; // Default to 1 if type not found
}

/**
 * Helper function to get the default damage for an enemy type
 * @param {string} type - Enemy type
 * @returns {number} - Default damage value
 */
export function getEnemyDamage(type) {
  return ENEMY_DAMAGE[type.toUpperCase()] || 20; // Default to 20 if type not found
}