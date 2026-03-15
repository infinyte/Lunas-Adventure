// server/services/assetManager.js
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

const projectRoot = process.cwd();

/**
 * Asset Manager Service
 */
class AssetManager extends EventEmitter {
  constructor(options = {}) {
    super();

    // Paths for different asset types
    this.paths = {
      sprites: options.spritesPath || path.join(projectRoot, 'client/assets/sprites'),
      levels: options.levelsPath || path.join(projectRoot, 'client/assets/levels'),
      configs: options.configsPath || path.join(projectRoot, 'client/assets/configs')
    };

    // Cache for loaded assets
    this.cache = {
      sprites: new Map(),
      levels: new Map(),
      configs: new Map()
    };

    // Initialize with basic assets
    this.initialized = false;
    this.ready = this.initialize();

    console.log('Asset Manager initialized with paths:', this.paths);
  }

  async initialize() {
    try {
      await Promise.all([
        this.loadJsonAssets(this.paths.levels, this.cache.levels),
        this.loadJsonAssets(this.paths.configs, this.cache.configs)
      ]);
      this.initialized = true;
      this.emit('ready');
    } catch (error) {
      console.error('AssetManager initialization error:', error);
      this.initialized = true;
    }
  }

  async loadJsonAssets(directoryPath, cache) {
    await fs.mkdir(directoryPath, { recursive: true });
    const entries = await fs.readdir(directoryPath, { withFileTypes: true });

    const jsonEntries = entries.filter((e) => e.isFile() && e.name.endsWith('.json'));
    await Promise.all(jsonEntries.map(async (entry) => {
      const filePath = path.join(directoryPath, entry.name);
      const raw = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      const key = parsed.id || path.parse(entry.name).name;
      cache.set(key, parsed);
    }));
  }

  async getLevels() {
    await this.ready;
    return Array.from(this.cache.levels.values());
  }

  async getLevel(levelId) {
    await this.ready;

    if (this.cache.levels.has(levelId)) {
      return this.cache.levels.get(levelId);
    }

    const fallbackPath = path.join(this.paths.levels, `${levelId}.json`);
    try {
      const raw = await fs.readFile(fallbackPath, 'utf-8');
      const parsed = JSON.parse(raw);
      this.cache.levels.set(parsed.id || levelId, parsed);
      return parsed;
    } catch (error) {
      // Keep server resilient in development if a requested level does not exist.
      return {
        id: levelId,
        name: levelId,
        width: 2000,
        height: 600,
        gravity: 0.5,
        platforms: [],
        collectibles: [],
        enemies: [],
        spawnPoint: { x: 50, y: 400 }
      };
    }
  }
}

export default AssetManager;
