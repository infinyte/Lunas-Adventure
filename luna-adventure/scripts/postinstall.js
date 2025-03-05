#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name from the URL of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

/**
 * Luna's Adventure Postinstall Script
 * 
 * This script runs after npm install and ensures the project 
 * structure is properly set up with all necessary directories and files.
 */

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// Log with colors and formatting
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'success':
      console.log(`${prefix} ${colors.green}✓${colors.reset} ${message}`);
      break;
    case 'warning':
      console.log(`${prefix} ${colors.yellow}⚠${colors.reset} ${message}`);
      break;
    case 'error':
      console.log(`${prefix} ${colors.red}✗${colors.reset} ${message}`);
      break;
    case 'info':
    default:
      console.log(`${prefix} ${colors.blue}ℹ${colors.reset} ${message}`);
      break;
  }
}

// Create directory if it doesn't exist
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    log(`Created directory: ${path.relative(rootDir, dirPath)}`, 'success');
  } catch (error) {
    if (error.code !== 'EEXIST') {
      log(`Failed to create directory: ${path.relative(rootDir, dirPath)} - ${error.message}`, 'error');
      throw error;
    }
  }
}

// Check if a file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Create file with content if it doesn't exist
async function ensureFile(filePath, content = '') {
  if (await fileExists(filePath)) {
    log(`File already exists: ${path.relative(rootDir, filePath)}`, 'info');
    return;
  }

  try {
    await fs.writeFile(filePath, content);
    log(`Created file: ${path.relative(rootDir, filePath)}`, 'success');
  } catch (error) {
    log(`Failed to create file: ${path.relative(rootDir, filePath)} - ${error.message}`, 'error');
    throw error;
  }
}

// Main function to set up the project
async function setupProject() {
  log(`${colors.bright}Starting Luna's Adventure postinstall setup...${colors.reset}`, 'info');

  try {
    // Ensure core directories exist
    const directories = [
      // Client directories
      path.join(rootDir, 'client/assets/sprites'),
      path.join(rootDir, 'client/assets/levels'),
      path.join(rootDir, 'client/assets/sounds'),
      path.join(rootDir, 'client/assets/music'),
      path.join(rootDir, 'client/assets/configs'),
      path.join(rootDir, 'client/scripts/entities'),
      path.join(rootDir, 'client/styles'),
      
      // Server directories
      path.join(rootDir, 'server/services'),
      path.join(rootDir, 'server/controllers'),
      path.join(rootDir, 'server/routes'),
      path.join(rootDir, 'server/config'),
      
      // Other directories
      path.join(rootDir, 'shared'),
      path.join(rootDir, 'data'),      // For saved game data
      path.join(rootDir, 'docs'),      // For documentation
      path.join(rootDir, 'scripts')    // For utility scripts
    ];

    for (const dir of directories) {
      await ensureDir(dir);
    }

    // Create shared/constants.js if it doesn't exist
    const constantsPath = path.join(rootDir, 'shared/constants.js');
    if (!(await fileExists(constantsPath))) {
      // Create a basic constants file (can be expanded later)
      const constantsContent = `// shared/constants.js

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
export const PLAYER_WIDTH = 60;
export const PLAYER_HEIGHT = 40;
export const PLAYER_INITIAL_LIVES = 3;
export const PLAYER_INITIAL_HEALTH = 100;

// Enemy constants
export const ENEMY_SPEED = 1.5;
export const FLYING_ENEMY_SPEED = 2;
export const ENEMY_WIDTH = 40;
export const ENEMY_HEIGHT = 40;

// Game states
export const GAME_STATES = {
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'gameOver',
  LEVEL_COMPLETE: 'levelComplete'
};

// Entity types
export const ENTITY_TYPES = {
  PLAYER: 'player',
  ENEMY: {
    BASIC: 'basic',
    FLYING: 'flying',
    SHOOTER: 'shooter',
    BOSS: 'boss'
  },
  PLATFORM: {
    GROUND: 'ground',
    PLATFORM: 'platform',
    MOVING: 'moving',
    BREAKING: 'breaking',
    BOUNCY: 'bouncy'
  },
  COLLECTIBLE: {
    CARROT: 'carrot',
    GOLDEN_CARROT: 'goldenCarrot',
    POWERUP: 'powerup',
    KEY: 'key',
    COIN: 'coin',
    GEM: 'gem'
  }
};

// Additional constants can be added as needed
`;
      await ensureFile(constantsPath, constantsContent);
    }

    // Create a sample level file
    const levelPath = path.join(rootDir, 'client/assets/levels/level-1.json');
    if (!(await fileExists(levelPath))) {
      const levelContent = JSON.stringify({
        id: "level-1",
        name: "Garden Adventure",
        width: 2000,
        height: 600,
        gravity: 0.5,
        platforms: [
          {
            id: "ground-1",
            x: 0,
            y: 500,
            width: 800,
            height: 100,
            type: "ground"
          },
          {
            id: "platform-1", 
            x: 200,
            y: 400,
            width: 200,
            height: 20,
            type: "platform"
          }
        ],
        collectibles: [
          {
            id: "carrot-1",
            x: 300,
            y: 370,
            width: 30,
            height: 30,
            type: "carrot"
          }
        ],
        enemies: [
          {
            id: "enemy-1",
            x: 400,
            y: 470,
            width: 40,
            height: 40,
            type: "basic",
            patrolStart: 300,
            patrolEnd: 500
          }
        ],
        spawnPoint: {
          x: 50,
          y: 400
        }
      }, null, 2);
      
      await ensureFile(levelPath, levelContent);
    }

    // Create a basic docker-compose.yml if it doesn't exist
    const dockerPath = path.join(rootDir, 'docker-compose.yml');
    if (!(await fileExists(dockerPath))) {
      const dockerContent = `version: '3'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    volumes:
      - ./:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - PORT=3000
    command: npm run dev
`;
      await ensureFile(dockerPath, dockerContent);
    }

    // Create a basic Dockerfile if it doesn't exist
    const dockerfilePath = path.join(rootDir, 'Dockerfile');
    if (!(await fileExists(dockerfilePath))) {
      const dockerfileContent = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
`;
      await ensureFile(dockerfilePath, dockerfileContent);
    }

    // Create a .env file if it doesn't exist
    const envPath = path.join(rootDir, '.env');
    if (!(await fileExists(envPath))) {
      const envContent = `# Environment Variables
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ENABLE_MULTIPLAYER=true
`;
      await ensureFile(envPath, envContent);
    }
    
    // Create data directory for saved games
    const dataDir = path.join(rootDir, 'data');
    await ensureDir(dataDir);

    // Check if we need to create a .gitkeep file to ensure empty directories are tracked
    const gitkeepPaths = [
      path.join(rootDir, 'data/.gitkeep'),
      path.join(rootDir, 'client/assets/sprites/.gitkeep'),
      path.join(rootDir, 'client/assets/sounds/.gitkeep'),
      path.join(rootDir, 'client/assets/music/.gitkeep')
    ];

    for (const gitkeepPath of gitkeepPaths) {
      await ensureFile(gitkeepPath, '# This file exists to ensure Git tracks this empty directory');
    }

    log(`${colors.bright}Luna's Adventure setup completed successfully!${colors.reset}`, 'success');
    
    // Provide a hint about next steps
    log('\nYou can now start development by running:', 'info');
    log(`${colors.yellow}npm run dev${colors.reset}`, 'info');
  } catch (error) {
    log(`Setup failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Execute setup
setupProject().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error');
  process.exit(1);
});