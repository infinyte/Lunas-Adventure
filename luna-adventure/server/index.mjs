// server/index.js
// BEFORE (CommonJS):
/* const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const GameEngine = require('./services/gameEngine');
const AssetManager = require('./services/assetManager');
const StateManager = require('./services/stateManager'); */

// AFTER (ES Modules):
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

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);
  
  // Event-driven architecture for game events
  socket.on('player:move', (data) => {
    // Handle player movement
    gameEngine.updatePlayerPosition(socket.id, data);
    // Broadcast updated state to all clients
    io.emit('game:state', gameEngine.getGameState());
  });
  
  socket.on('player:jump', () => {
    // Handle player jump
    gameEngine.playerJump(socket.id);
    io.emit('game:state', gameEngine.getGameState());
  });
  
  socket.on('game:start', () => {
    // Start new game
    gameEngine.startGame(socket.id);
    io.emit('game:state', gameEngine.getGameState());
  });
  
  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    gameEngine.removePlayer(socket.id);
    io.emit('game:state', gameEngine.getGameState());
  });
});

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

app.get('/api/levels', (req, res) => {
  // Get available levels
  const levels = assetManager.getLevels();
  res.json(levels);
});

app.get('/api/highscores', (req, res) => {
  // Get high scores
  const highScores = stateManager.getHighScores();
  res.json(highScores);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Luna's Adventure server running on port ${PORT}`);
});

module.exports = server;
