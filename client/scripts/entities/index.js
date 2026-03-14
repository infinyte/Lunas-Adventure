// client/scripts/entities/index.js

/**
 * Entities Index
 * 
 * This file exports all entity classes to make imports cleaner throughout the project.
 * Import from here instead of importing individual entity files.
 */

import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Platform } from './platform.js';
import { Collectible } from './collectible.js';

export {
  Player,
  Enemy,
  Platform,
  Collectible
};