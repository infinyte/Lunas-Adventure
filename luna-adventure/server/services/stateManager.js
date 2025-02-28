// server/services/stateManager.js
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

/**
 * State Manager Service
 * 
 * Responsible for managing persistent game state including:
 * - Player progress (unlocked levels, collectibles)
 * - High scores and leaderboards
 * - Game settings and preferences
 * 
 * Uses an event-driven architecture to notify other services of state changes
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
  
  /**
   * Initialize the state manager by loading state from disk
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    try {
      // Ensure data directory exists
      await this.ensureDataDirectory();
      
      // Load all state data from disk
      await Promise.all([
        this.loadHighScores(),
        this.loadPlayerProgress(),
        this.loadSettings()
      ]);
      
      // Start auto-save if enabled
      if (this.autoSaveEnabled) {
        this.startAutoSave();
      }
      
      this.emit('ready', { service: 'StateManager' });
      console.log('State Manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize State Manager:', error);
      this.emit('error', { service: 'StateManager', error });
      throw error;
    }
  }
  
  /**
   * Ensure the data directory exists
   * @returns {Promise<void>}
   */
  async ensureDataDirectory() {
    try {
      await fs.mkdir(this.dataPath, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
  
  /**
   * Start auto-save interval
   */
  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    this.autoSaveInterval = setInterval(() => {
      this.saveAllState()
        .then(() => console.log('Auto-save completed'))
        .catch(error => console.error('Auto-save failed:', error));
    }, this.autoSaveDelay);
    
    console.log(`Auto-save enabled with ${this.autoSaveDelay}ms interval`);
  }
  
  /**
   * Stop auto-save interval
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
      console.log('Auto-save disabled');
    }
  }
  
  /**
   * Save all state data to disk
   * @returns {Promise<boolean>} Success status
   */
  async saveAllState() {
    try {
      await Promise.all([
        this.saveHighScores(),
        this.savePlayerProgress(),
        this.saveSettings()
      ]);
      
      this.emit('state:saved');
      return true;
    } catch (error) {
      console.error('Error saving all state:', error);
      this.emit('state:saveError', error);
      throw error;
    }
  }
  
  /**
   * Load high scores from disk
   * @returns {Promise<Array>} Array of high score objects
   */
  async loadHighScores() {
    try {
      const filePath = path.join(this.dataPath, 'highScores.json');
      const data = await fs.readFile(filePath, 'utf8');
      this.state.highScores = JSON.parse(data);
      
      this.emit('highScores:loaded', { count: this.state.highScores.length });
      console.log(`Loaded ${this.state.highScores.length} high scores`);
      return this.state.highScores;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, initialize with empty array
        this.state.highScores = [];
        console.log('No high scores file found, initialized with empty array');
        return this.state.highScores;
      }
      
      console.error('Error loading high scores:', error);
      this.emit('highScores:loadError', error);
      throw error;
    }
  }
  
  /**
   * Save high scores to disk
   * @returns {Promise<boolean>} Success status
   */
  async saveHighScores() {
    try {
      const filePath = path.join(this.dataPath, 'highScores.json');
      await fs.writeFile(filePath, JSON.stringify(this.state.highScores, null, 2), 'utf8');
      
      this.emit('highScores:saved');
      return true;
    } catch (error) {
      console.error('Error saving high scores:', error);
      this.emit('highScores:saveError', error);
      throw error;
    }
  }
  
  /**
   * Add a new high score
   * @param {Object} scoreData - Score data object
   * @param {string} scoreData.playerName - Player name
   * @param {number} scoreData.score - Score value
   * @param {string} scoreData.level - Level identifier
   * @returns {Object} Added score data with position
   */
  addHighScore(scoreData) {
    // Validate required fields
    if (!scoreData.playerName || typeof scoreData.score !== 'number' || !scoreData.level) {
      console.error('Invalid high score data:', scoreData);
      throw new Error('Invalid high score data');
    }
    
    // Add timestamp and generate ID
    const newScore = {
      ...scoreData,
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      date: new Date().toISOString()
    };
    
    // Add to high scores array
    this.state.highScores.push(newScore);
    
    // Sort by score (descending)
    this.state.highScores.sort((a, b) => b.score - a.score);
    
    // Trim to maximum size
    if (this.state.highScores.length > this.maxHighScores) {
      this.state.highScores = this.state.highScores.slice(0, this.maxHighScores);
    }
    
    // Save to disk
    this.saveHighScores()
      .catch(error => console.error('Error saving high scores after adding:', error));
    
    // Determine position
    const position = this.state.highScores.findIndex(item => item.id === newScore.id) + 1;
    
    // Emit event
    this.emit('highScore:added', { ...newScore, position });
    
    return { ...newScore, position };
  }
  
  /**
   * Get high scores, optionally filtered by level
   * @param {Object} options - Filter options
   * @param {string} options.level - Level identifier to filter by
   * @param {number} options.limit - Maximum number of scores to return
   * @returns {Array} Array of high score objects
   */
  getHighScores(options = {}) {
    let result = [...this.state.highScores];
    
    // Filter by level if specified
    if (options.level) {
      result = result.filter(score => score.level === options.level);
    }
    
    // Apply limit if specified
    if (options.limit && options.limit > 0) {
      result = result.slice(0, options.limit);
    }
    
    return result;
  }
  
  /**
   * Load player progress from disk
   * @returns {Promise<Map>} Map of player progress
   */
  async loadPlayerProgress() {
    try {
      const filePath = path.join(this.dataPath, 'playerProgress.json');
      const data = await fs.readFile(filePath, 'utf8');
      const progressArray = JSON.parse(data);
      
      // Convert array to Map
      this.state.playerProgress = new Map(progressArray);
      
      this.emit('playerProgress:loaded', { count: this.state.playerProgress.size });
      console.log(`Loaded progress for ${this.state.playerProgress.size} players`);
      return this.state.playerProgress;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, initialize with empty map
        this.state.playerProgress = new Map();
        console.log('No player progress file found, initialized with empty map');
        return this.state.playerProgress;
      }
      
      console.error('Error loading player progress:', error);
      this.emit('playerProgress:loadError', error);
      throw error;
    }
  }
  
  /**
   * Save player progress to disk
   * @returns {Promise<boolean>} Success status
   */
  async savePlayerProgress() {
    try {
      const filePath = path.join(this.dataPath, 'playerProgress.json');
      // Convert Map to array for JSON serialization
      const progressArray = Array.from(this.state.playerProgress.entries());
      await fs.writeFile(filePath, JSON.stringify(progressArray, null, 2), 'utf8');
      
      this.emit('playerProgress:saved');
      return true;
    } catch (error) {
      console.error('Error saving player progress:', error);
      this.emit('playerProgress:saveError', error);
      throw error;
    }
  }
  
  /**
   * Get progress for a specific player
   * @param {string} playerId - Player identifier
   * @returns {Object} Player progress object
   */
  getPlayerProgress(playerId) {
    if (!this.state.playerProgress.has(playerId)) {
      // Initialize with default progress
      const defaultProgress = {
        unlockedLevels: ['level-1'], // First level always unlocked
        collectibles: {},
        achievements: {},
        lastPlayed: null
      };
      
      this.state.playerProgress.set(playerId, defaultProgress);
    }
    
    return this.state.playerProgress.get(playerId);
  }
  
  /**
   * Update progress for a specific player
   * @param {string} playerId - Player identifier
   * @param {Object} progressData - Progress data to update
   * @returns {Object} Updated player progress
   */
  updatePlayerProgress(playerId, progressData) {
    // Get current progress
    const currentProgress = this.getPlayerProgress(playerId);
    
    // Update with new data
    const updatedProgress = {
      ...currentProgress,
      ...progressData,
      lastPlayed: new Date().toISOString()
    };
    
    // Special handling for arrays that should be merged
    if (progressData.unlockedLevels) {
      updatedProgress.unlockedLevels = [...new Set([
        ...currentProgress.unlockedLevels,
        ...progressData.unlockedLevels
      ])];
    }
    
    // Special handling for collectibles object
    if (progressData.collectibles) {
      updatedProgress.collectibles = {
        ...currentProgress.collectibles,
        ...progressData.collectibles
      };
    }
    
    // Special handling for achievements object
    if (progressData.achievements) {
      updatedProgress.achievements = {
        ...currentProgress.achievements,
        ...progressData.achievements
      };
    }
    
    // Save to memory
    this.state.playerProgress.set(playerId, updatedProgress);
    
    // Save to disk (async)
    this.savePlayerProgress()
      .catch(error => console.error('Error saving player progress after update:', error));
    
    // Emit event
    this.emit('playerProgress:updated', { playerId, progress: updatedProgress });
    
    return updatedProgress;
  }
  
  /**
   * Load game settings from disk
   * @returns {Promise<Object>} Settings object
   */
  async loadSettings() {
    try {
      const filePath = path.join(this.dataPath, 'settings.json');
      const data = await fs.readFile(filePath, 'utf8');
      this.state.settings = JSON.parse(data);
      
      this.emit('settings:loaded');
      console.log('Game settings loaded');
      return this.state.settings;
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File doesn't exist yet, initialize with default settings
        this.state.settings = this.getDefaultSettings();
        console.log('No settings file found, initialized with defaults');
        return this.state.settings;
      }
      
      console.error('Error loading settings:', error);
      this.emit('settings:loadError', error);
      throw error;
    }
  }
  
  /**
   * Save game settings to disk
   * @returns {Promise<boolean>} Success status
   */
  async saveSettings() {
    try {
      const filePath = path.join(this.dataPath, 'settings.json');
      await fs.writeFile(filePath, JSON.stringify(this.state.settings, null, 2), 'utf8');
      
      this.emit('settings:saved');
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      this.emit('settings:saveError', error);
      throw error;
    }
  }
  
  /**
   * Get default game settings
   * @returns {Object} Default settings object
   */
  getDefaultSettings() {
    return {
      sound: {
        musicVolume: 0.7,
        sfxVolume: 1.0,
        musicEnabled: true,
        sfxEnabled: true
      },
      display: {
        fullscreen: false,
        showFps: false,
        particleEffects: true
      },
      gameplay: {
        difficulty: 'normal',
        controlType: 'keyboard',
        tutorialEnabled: true
      },
      version: '1.0.0'
    };
  }
  
  /**
   * Get current game settings
   * @returns {Object} Settings object
   */
  getSettings() {
    return this.state.settings;
  }
  
  /**
   * Update game settings
   * @param {Object} newSettings - New settings object to merge
   * @returns {Object} Updated settings
   */
  updateSettings(newSettings) {
    // Deep merge settings
    this.state.settings = this.deepMerge(this.state.settings, newSettings);
    
    // Save to disk (async)
    this.saveSettings()
      .catch(error => console.error('Error saving settings after update:', error));
    
    // Emit event
    this.emit('settings:updated', this.state.settings);
    
    return this.state.settings;
  }
  
  /**
   * Helper function to deep merge objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object to merge
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }
  
  /**
   * Helper function to check if value is an object
   * @param {*} item - Item to check
   * @returns {boolean} True if object
   */
  isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
  
  /**
   * Clean up resources when shutting down
   */
  async shutdown() {
    // Save all state before shutting down
    try {
      // Stop auto-save
      this.stopAutoSave();
      
      // Final save
      await this.saveAllState();
      
      console.log('State Manager shut down successfully');
      this.emit('shutdown:complete');
      return true;
    } catch (error) {
      console.error('Error during State Manager shutdown:', error);
      this.emit('shutdown:error', error);
      throw error;
    }
  }
}

module.exports = StateManager;