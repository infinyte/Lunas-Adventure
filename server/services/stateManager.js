// server/services/stateManager.js
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

const projectRoot = process.cwd();

/**
 * State Manager Service
 */
class StateManager extends EventEmitter {
  constructor(options = {}) {
    super();

    // Data storage path
    this.dataPath = options.dataPath || path.join(projectRoot, 'data');

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
    this.highScoresFile = path.join(this.dataPath, 'highscores.json');
    this.ready = this.initialize();

    console.log('State Manager initialized with data path:', this.dataPath);
  }

  async initialize() {
    await fs.mkdir(this.dataPath, { recursive: true });
    await this.loadHighScores();

    if (this.autoSaveEnabled) {
      this.startAutoSave();
    }
  }

  async loadHighScores() {
    try {
      const raw = await fs.readFile(this.highScoresFile, 'utf-8');
      const parsed = JSON.parse(raw);
      this.state.highScores = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Failed to read high scores:', error);
      }
      this.state.highScores = [];
    }
  }

  async getHighScores(limit = 10) {
    await this.ready;

    return [...this.state.highScores]
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
  }

  async addHighScore(entry = {}) {
    await this.ready;

    const scoreEntry = {
      playerName: entry.playerName || 'Anonymous',
      score: Number.isFinite(entry.score) ? entry.score : 0,
      level: entry.level || 'level-1',
      createdAt: entry.createdAt || new Date().toISOString()
    };

    this.state.highScores.push(scoreEntry);
    this.state.highScores.sort((a, b) => (b.score || 0) - (a.score || 0));
    this.state.highScores = this.state.highScores.slice(0, this.maxHighScores);

    await this.saveHighScores();
    this.emit('highscores:updated', this.state.highScores);

    return scoreEntry;
  }

  async saveHighScores() {
    const serialized = JSON.stringify(this.state.highScores, null, 2);
    await fs.writeFile(this.highScoresFile, serialized, 'utf-8');
  }

  startAutoSave() {
    if (this.autoSaveInterval) {
      return;
    }

    this.autoSaveInterval = setInterval(() => {
      this.saveHighScores().catch((error) => {
        console.error('Auto-save high scores failed:', error);
      });
    }, this.autoSaveDelay);
  }

  stopAutoSave() {
    if (!this.autoSaveInterval) {
      return;
    }

    clearInterval(this.autoSaveInterval);
    this.autoSaveInterval = null;
  }
}

export default StateManager;
