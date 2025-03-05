// server/services/assetManager.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Asset Manager Service
 */
class AssetManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Paths for different asset types
    this.paths = {
      sprites: options.spritesPath || path.join(__dirname, '../../client/assets/sprites'),
      levels: options.levelsPath || path.join(__dirname, '../../client/assets/levels'),
      configs: options.configsPath || path.join(__dirname, '../../client/assets/configs')
    };
    
    // Cache for loaded assets
    this.cache = {
      sprites: new Map(),
      levels: new Map(),
      configs: new Map()
    };
    
    // Initialize with basic assets
    this.initialized = false;
    
    console.log('Asset Manager initialized with paths:', this.paths);
  }
  
  // Methods remain the same, just updated require/module.exports
}

export default AssetManager;
