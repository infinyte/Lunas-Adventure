import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import { Server } from 'socket.io';
import GameEngine from './services/gameEngine.js';
import AssetManager from './services/assetManager.js';
import StateManager from './services/stateManager.js';

export function createServer(options = {}) {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, options.socketOptions);

  const gameEngine = options.gameEngine || new GameEngine();
  const assetManager = options.assetManager || new AssetManager(options.assetManagerOptions);
  const stateManager = options.stateManager || new StateManager(options.stateManagerOptions);
  const clientStaticDir = options.clientStaticDir || path.join(process.cwd(), 'client');

  app.use(cors());
  app.use(express.json());
  app.use(express.static(clientStaticDir));

  function broadcastState() {
    io.emit('game:state', gameEngine.getGameState());
  }

  gameEngine.on('game:update', (gameState) => {
    io.emit('game:state', gameState);
  });

  gameEngine.on('player:join', (payload) => {
    io.emit('player:join', payload);
  });

  gameEngine.on('player:leave', (payload) => {
    io.emit('player:leave', payload.playerId);
  });

  gameEngine.on('player:damage', (payload) => {
    io.emit('player:damage', payload);
  });

  gameEngine.on('player:respawn', (payload) => {
    io.emit('player:respawn', payload);
  });

  gameEngine.on('player:gameover', (payload) => {
    io.emit('player:gameover', payload);
  });

  gameEngine.on('collectible:collected', (payload) => {
    io.emit('collectible:collected', payload);
  });

  gameEngine.on('enemy:defeated', (payload) => {
    io.emit('enemy:defeated', payload);
  });

  gameEngine.on('projectile:fired', (payload) => {
    io.emit('projectile:fired', payload);
  });

  gameEngine.on('door:unlocked', (payload) => {
    io.emit('door:unlocked', payload);
  });

  io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    gameEngine.addPlayer(socket.id);
    socket.emit('game:state', gameEngine.getGameState());

    socket.on('player:move', (data) => {
      gameEngine.updatePlayerPosition(socket.id, data);
      broadcastState();
    });

    socket.on('player:jump', () => {
      gameEngine.playerJump(socket.id);
      broadcastState();
    });

    socket.on('player:damage', () => {
      gameEngine.playerDamage(socket.id);
      broadcastState();
    });

    socket.on('player:death', () => {
      gameEngine.playerDeath(socket.id);
      broadcastState();
    });

    socket.on('collectible:collected', (data) => {
      gameEngine.collectCollectible(socket.id, data?.id);
      broadcastState();
    });

    socket.on('enemy:defeated', (data) => {
      if (data?.id) {
        gameEngine.defeatEnemy(data.id);
        broadcastState();
      }
    });

    socket.on('level:request', async (data) => {
      const levelId = data?.levelId || 'level-1';
      const level = await assetManager.getLevel(levelId);
      socket.emit('level:data', level);
    });

    socket.on('game:start', () => {
      gameEngine.startGame();
      broadcastState();
    });

    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      gameEngine.removePlayer(socket.id);
      broadcastState();
    });
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(clientStaticDir, 'index.html'));
  });

  app.get('/api/levels', async (req, res) => {
    try {
      const levels = await assetManager.getLevels();
      res.json(levels);
    } catch (error) {
      console.error('Failed to load levels:', error);
      res.status(500).json({ error: 'Failed to load levels' });
    }
  });

  app.get('/api/highscores', async (req, res) => {
    try {
      const highScores = await stateManager.getHighScores();
      res.json(highScores);
    } catch (error) {
      console.error('Failed to load high scores:', error);
      res.status(500).json({ error: 'Failed to load high scores' });
    }
  });

  app.post('/api/highscores', async (req, res) => {
    try {
      const { playerName, score, level } = req.body;
      if (typeof score !== 'number' || !Number.isFinite(score)) {
        return res.status(400).json({ error: 'score must be a finite number' });
      }
      const entry = await stateManager.addHighScore({ playerName, score, level });
      res.status(201).json(entry);
    } catch (error) {
      console.error('Failed to save high score:', error);
      res.status(500).json({ error: 'Failed to save high score' });
    }
  });

  function start(port = (process.env.PORT || 3000)) {
    return new Promise((resolve) => {
      server.listen(port, () => {
        const addressInfo = server.address();
        const resolvedPort = addressInfo && typeof addressInfo === 'object' ? addressInfo.port : port;
        console.log(`Luna's Adventure server running on port ${resolvedPort}`);
        resolve(resolvedPort);
      });
    });
  }

  function stop() {
    return new Promise((resolve, reject) => {
      if (typeof stateManager.stopAutoSave === 'function') {
        stateManager.stopAutoSave();
      }

      io.close(() => {
        server.close((error) => {
          if (error) {
            if (error.code === 'ERR_SERVER_NOT_RUNNING' || error.message === 'Server is not running.') {
              resolve();
              return;
            }
            reject(error);
            return;
          }
          resolve();
        });
      });
    });
  }

  return {
    app,
    server,
    io,
    gameEngine,
    assetManager,
    stateManager,
    start,
    stop
  };
}

export default createServer;
