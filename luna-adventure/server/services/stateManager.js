// server/services/stateManager.js
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * State Manager Service
 */
class StateManager extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Data storage path
    this.dataPath = options.dataPath || path.join(__dirname, '../../data');
    
    // In-memory cache of state data
    this.state = {
      highScores: [],
      playerProgress: new Map(),
      settings: {}
    };
    
    // Maximum entries in high scores
    this.maxHighScores = options.maxHighScores || 100;
    
    // Auto-save interval (if enabled)
    this.autoSaveInterval = null;
    this.autoSaveEnabled = options.autoSave !== false;
    this.autoSaveDelay = options.autoSaveDelay || 60000; // 1 minute default
    
    console.log('State Manager initialized with data path:', this.dataPath);
  }
  
  // Methods remain the same, just updated require/module.exports
}

export default StateManager;
