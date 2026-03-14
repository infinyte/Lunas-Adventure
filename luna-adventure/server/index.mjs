import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Server } from 'socket.io';
import GameEngine from './services/gameEngine.js';
import AssetManager from './services/assetManager.js';
import StateManager from './services/stateManager.js';

// Handle __dirname (not available in ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Initialize services
const gameEngine = new GameEngine();
const assetManager = new AssetManager();
const stateManager = new StateManager();

function broadcastState() {
  io.emit('game:state', gameEngine.getGameState());
}

// Forward authoritative engine events to clients.
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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  gameEngine.addPlayer(socket.id);
  socket.emit('game:state', gameEngine.getGameState());
  
  // Event-driven architecture for game events
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

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
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

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Luna's Adventure server running on port ${PORT}`);
});
