// server/services/assetManager.js
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Asset Manager Service
 * 
 * Responsible for loading, caching, and managing game assets such as:
 * - SVG sprite definitions
 * - Level layouts
 * - Game configurations
 * 
 * Uses an event-driven approach to notify other services when assets are ready
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
    
    // Log configuration
    console.log('Asset Manager initialized with paths:', this.paths);
  }
  
  /**
   * Initialize the asset manager by loading essential assets
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Load essential game assets in parallel
      await Promise.all([
        this.loadSprites(),
        this.loadLevels(),
        this.loadConfigs()
      ]);
      
      this.initialized = true;
      this.emit('ready', { service: 'AssetManager' });
      console.log('Asset Manager initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Asset Manager:', error);
      this.emit('error', { service: 'AssetManager', error });
      throw error;
    }
  }
  
  /**
   * Load all SVG sprite definitions
   * @returns {Promise<Map>} Map of loaded sprites
   */
  async loadSprites() {
    try {
      const spriteFiles = await fs.readdir(this.paths.sprites);
      const svgFiles = spriteFiles.filter(file => file.endsWith('.svg'));
      
      for (const file of svgFiles) {
        const spriteName = path.basename(file, '.svg');
        const filePath = path.join(this.paths.sprites, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        this.cache.sprites.set(spriteName, content);
        console.log(`Loaded sprite: ${spriteName}`);
      }
      
      this.emit('sprites:loaded', { count: this.cache.sprites.size });
      return this.cache.sprites;
    } catch (error) {
      console.error('Error loading sprites:', error);
      this.emit('sprites:error', error);
      throw error;
    }
  }
  
  /**
   * Load all level definitions
   * @returns {Promise<Map>} Map of loaded levels
   */
  async loadLevels() {
    try {
      const levelFiles = await fs.readdir(this.paths.levels);
      const jsonFiles = levelFiles.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const levelName = path.basename(file, '.json');
        const filePath = path.join(this.paths.levels, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        try {
          const levelData = JSON.parse(content);
          this.cache.levels.set(levelName, levelData);
          console.log(`Loaded level: ${levelName}`);
        } catch (jsonError) {
          console.error(`Error parsing level JSON for ${levelName}:`, jsonError);
          this.emit('level:error', { level: levelName, error: jsonError });
        }
      }
      
      this.emit('levels:loaded', { count: this.cache.levels.size });
      return this.cache.levels;
    } catch (error) {
      console.error('Error loading levels:', error);
      this.emit('levels:error', error);
      throw error;
    }
  }
  
  /**
   * Load all game configuration files
   * @returns {Promise<Map>} Map of loaded configurations
   */
  async loadConfigs() {
    try {
      const configFiles = await fs.readdir(this.paths.configs);
      const jsonFiles = configFiles.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const configName = path.basename(file, '.json');
        const filePath = path.join(this.paths.configs, file);
        const content = await fs.readFile(filePath, 'utf8');
        
        try {
          const configData = JSON.parse(content);
          this.cache.configs.set(configName, configData);
          console.log(`Loaded config: ${configName}`);
        } catch (jsonError) {
          console.error(`Error parsing config JSON for ${configName}:`, jsonError);
          this.emit('config:error', { config: configName, error: jsonError });
        }
      }
      
      this.emit('configs:loaded', { count: this.cache.configs.size });
      return this.cache.configs;
    } catch (error) {
      console.error('Error loading configs:', error);
      this.emit('configs:error', error);
      throw error;
    }
  }
  
  /**
   * Get a specific sprite by name
   * @param {string} spriteName - Name of the sprite
   * @returns {string|null} SVG content or null if not found
   */
  getSprite(spriteName) {
    if (!this.cache.sprites.has(spriteName)) {
      console.warn(`Sprite not found: ${spriteName}`);
      return null;
    }
    
    return this.cache.sprites.get(spriteName);
  }
  
  /**
   * Get a specific level by name
   * @param {string} levelName - Name of the level
   * @returns {Object|null} Level data or null if not found
   */
  getLevel(levelName) {
    if (!this.cache.levels.has(levelName)) {
      console.warn(`Level not found: ${levelName}`);
      return null;
    }
    
    return this.cache.levels.get(levelName);
  }
  
  /**
   * Get all available levels
   * @returns {Array} Array of level objects with name and metadata
   */
  getLevels() {
    const levels = [];
    
    for (const [name, data] of this.cache.levels.entries()) {
      levels.push({
        name,
        title: data.title || name,
        difficulty: data.difficulty || 'normal',
        order: data.order || 0,
        unlocked: data.unlocked !== false // Default to true if not specified
      });
    }
    
    // Sort levels by their order property
    return levels.sort((a, b) => a.order - b.order);
  }
  
  /**
   * Get a specific configuration by name
   * @param {string} configName - Name of the configuration
   * @returns {Object|null} Configuration data or null if not found
   */
  getConfig(configName) {
    if (!this.cache.configs.has(configName)) {
      console.warn(`Config not found: ${configName}`);
      return null;
    }
    
    return this.cache.configs.get(configName);
  }
  
  /**
   * Create a new level or update an existing one
   * @param {string} levelName - Name of the level
   * @param {Object} levelData - Level definition data
   * @returns {Promise<boolean>} Success status
   */
  async saveLevel(levelName, levelData) {
    try {
      const filePath = path.join(this.paths.levels, `${levelName}.json`);
      const jsonData = JSON.stringify(levelData, null, 2);
      
      await fs.writeFile(filePath, jsonData, 'utf8');
      
      // Update cache
      this.cache.levels.set(levelName, levelData);
      
      this.emit('level:saved', { level: levelName });
      console.log(`Saved level: ${levelName}`);
      return true;
    } catch (error) {
      console.error(`Error saving level ${levelName}:`, error);
      this.emit('level:saveError', { level: levelName, error });
      throw error;
    }
  }
  
  /**
   * Create a new sprite or update an existing one
   * @param {string} spriteName - Name of the sprite
   * @param {string} svgContent - SVG content
   * @returns {Promise<boolean>} Success status
   */
  async saveSprite(spriteName, svgContent) {
    try {
      const filePath = path.join(this.paths.sprites, `${spriteName}.svg`);
      
      await fs.writeFile(filePath, svgContent, 'utf8');
      
      // Update cache
      this.cache.sprites.set(spriteName, svgContent);
      
      this.emit('sprite:saved', { sprite: spriteName });
      console.log(`Saved sprite: ${spriteName}`);
      return true;
    } catch (error) {
      console.error(`Error saving sprite ${spriteName}:`, error);
      this.emit('sprite:saveError', { sprite: spriteName, error });
      throw error;
    }
  }
}

module.exports = AssetManager;
