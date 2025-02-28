// client/scripts/game.js

/**
 * Luna's Adventure - Main Game Client
 * 
 * This is the central module that coordinates all game components and manages the game loop.
 * It handles initialization, state management, asset loading, and communication with the server.
 * 
 * The game uses an event-driven architecture where components communicate through events
 * rather than direct function calls, making the system more loosely coupled and extensible.
 */

import SVGRenderer from './renderer.js';
import InputHandler from './inputHandler.js';
import Physics from './physics.js';
import { Player } from './entities/player.js';
import { Enemy } from './entities/enemy.js';
import { Platform } from './entities/platform.js';
import * as constants from '../../shared/constants.js';

class Game {
  /**
   * Initialize the game
   * @param {string} containerId - ID of the container element
   */
  constructor(containerId = 'game-container') {
    // Game state
    this.state = {
      players: new Map(),
      enemies: new Map(),
      platforms: new Map(),
      collectibles: new Map(),
      currentLevel: null,
      isRunning: false,
      isPaused: false,
      gameTime: 0,
      score: 0,
      playerLives: 3,
      playerHealth: 100,
      carrotsCollected: 0,
      totalCarrots: 0
    };

    // Game settings
    this.settings = {
      debug: false,
      sound: true,
      music: true,
      fullscreen: false
    };

    // Constants
    this.constants = constants;
    
    // Canvas dimensions
    this.width = 1000;
    this.height = 600;
    
    // Game loop variables
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.fps = 0;
    this.frameCount = 0;
    this.fpsUpdateInterval = 500; // Update FPS display every 500ms
    this.lastFpsUpdate = 0;
    
    // Component references
    this.container = document.getElementById(containerId);
    this.renderer = null;
    this.inputHandler = null;
    this.physics = null;
    this.socket = null;
    
    // Player information
    this.playerId = null;
    this.localPlayer = null;
    
    // Animation frame request ID (for cancellation)
    this.animationFrameId = null;
    
    // Bind methods to preserve 'this' context
    this.gameLoop = this.gameLoop.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    
    // Initialize game
    this.initialize();
  }
  
  /**
   * Initialize game components and event listeners
   */
  async initialize() {
    console.log('Initializing Luna\'s Adventure...');
    
    try {
      // Check if browser supports required features
      this.checkBrowserSupport();
      
      // Create loading screen
      this.showLoadingScreen();
      
      // Initialize renderer
      this.renderer = new SVGRenderer('game-container', this.width, this.height);
      
      // Initialize input handler
      this.inputHandler = new InputHandler();
      
      // Initialize physics engine
      this.physics = new Physics({
        gravity: 0.5,
        friction: 0.8,
        debug: this.settings.debug
      });
      
      // Connect to server
      await this.connectToServer();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load first level
      await this.loadLevel('level-1');
      
      // Hide loading screen and show start screen
      this.hideLoadingScreen();
      this.showStartScreen();
      
      console.log('Game initialization complete!');
      
    } catch (error) {
      console.error('Game initialization failed:', error);
      this.showErrorScreen('Failed to initialize game. Please refresh the page and try again.');
    }
  }
  
  /**
   * Check if browser supports required features
   */
  checkBrowserSupport() {
    // Check for SVG support
    if (!document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1")) {
      throw new Error('Your browser does not support SVG, which is required for this game.');
    }
    
    // Check for requestAnimationFrame
    if (!window.requestAnimationFrame) {
      throw new Error('Your browser does not support requestAnimationFrame, which is required for this game.');
    }
    
    // Check for WebSocket support
    if (!window.WebSocket) {
      throw new Error('Your browser does not support WebSockets, which are required for multiplayer functionality.');
    }
    
    console.log('Browser compatibility check passed');
  }
  
  /**
   * Connect to game server
   * @returns {Promise} Promise that resolves when connection is established
   */
  async connectToServer() {
    return new Promise((resolve, reject) => {
      try {
        // Determine server URL based on environment
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = process.env.NODE_ENV === 'production' ? window.location.port : '3000';
        const serverUrl = `${protocol}//${host}:${port}`;
        
        // Connect to socket.io server
        this.socket = io(serverUrl);
        
        // Socket connection event
        this.socket.on('connect', () => {
          console.log('Connected to server with ID:', this.socket.id);
          this.playerId = this.socket.id;
          resolve();
        });
        
        // Socket error event
        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });
        
        // Socket disconnection event
        this.socket.on('disconnect', (reason) => {
          console.log('Disconnected from server:', reason);
          this.handleDisconnect(reason);
        });
        
        // Game state update from server
        this.socket.on('game:state', (gameState) => {
          this.updateGameState(gameState);
        });
        
        // Level data from server
        this.socket.on('level:data', (levelData) => {
          this.processLevelData(levelData);
        });
        
        // Player join event
        this.socket.on('player:join', (playerData) => {
          this.addPlayer(playerData);
        });
        
        // Player leave event
        this.socket.on('player:leave', (playerId) => {
          this.removePlayer(playerId);
        });
        
        // Player damage event
        this.socket.on('player:damage', (data) => {
          this.handlePlayerDamage(data);
        });
        
        // Player respawn event
        this.socket.on('player:respawn', (data) => {
          this.handlePlayerRespawn(data);
        });
        
        // Player game over event
        this.socket.on('player:gameover', (data) => {
          this.handleGameOver(data);
        });
        
        // Collectible collected event
        this.socket.on('collectible:collected', (data) => {
          this.handleCollectibleCollected(data);
        });
        
        // Enemy defeated event
        this.socket.on('enemy:defeated', (data) => {
          this.handleEnemyDefeated(data);
        });
        
      } catch (error) {
        console.error('Failed to connect to server:', error);
        reject(error);
      }
    });
  }
  
  /**
   * Set up DOM event listeners
   */
  setupEventListeners() {
    // Window resize
    window.addEventListener('resize', this.handleResize);
    
    // Tab visibility change (pause game when tab is not active)
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    // Game restart event (from UI)
    document.addEventListener('game:restart', () => {
      this.restartGame();
    });
    
    // Input handler events
    this.inputHandler.on('move', (direction) => {
      this.handlePlayerMove(direction);
    });
    
    this.inputHandler.on('jump', () => {
      this.handlePlayerJump();
    });
    
    this.inputHandler.on('pause', () => {
      this.togglePause();
    });
    
    // Debug mode toggle
    document.addEventListener('keydown', (event) => {
      if (event.key === 'F12') {
        this.toggleDebugMode();
      }
    });
    
    console.log('Event listeners initialized');
  }
  
  /**
   * Handle window resize event
   */
  handleResize() {
    // Calculate new dimensions while maintaining aspect ratio
    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    const aspectRatio = this.width / this.height;
    
    let newWidth, newHeight;
    
    if (containerWidth / containerHeight > aspectRatio) {
      // Container is wider than needed
      newHeight = containerHeight;
      newWidth = newHeight * aspectRatio;
    } else {
      // Container is taller than needed
      newWidth = containerWidth;
      newHeight = newWidth / aspectRatio;
    }
    
    // Update game container style
    const gameElement = document.getElementById('game-svg');
    if (gameElement) {
      gameElement.style.width = `${newWidth}px`;
      gameElement.style.height = `${newHeight}px`;
    }
    
    console.log('Game resized to:', newWidth, 'x', newHeight);
  }
  
  /**
   * Handle visibility change (pause when tab is not active)
   */
  handleVisibilityChange() {
    if (document.hidden && this.state.isRunning && !this.state.isPaused) {
      this.pause();
    }
  }
  
  /**
   * Handle server disconnection
   * @param {string} reason - Disconnection reason
   */
  handleDisconnect(reason) {
    if (this.state.isRunning) {
      this.pause();
      this.showNotification('Disconnected from server. Attempting to reconnect...', 'error');
    }
    
    // Attempt to reconnect automatically
    setTimeout(() => {
      this.connectToServer()
        .then(() => {
          this.showNotification('Reconnected to server!', 'success');
          if (this.state.isPaused) {
            this.resume();
          }
        })
        .catch(() => {
          this.showErrorScreen('Lost connection to the server. Please refresh the page to reconnect.');
        });
    }, 3000);
  }
  
  /**
   * Show loading screen
   */
  showLoadingScreen() {
    // Create loading screen element if it doesn't exist
    if (!document.getElementById('loading-screen')) {
      const loadingScreen = document.createElement('div');
      loadingScreen.id = 'loading-screen';
      loadingScreen.style.position = 'absolute';
      loadingScreen.style.top = '0';
      loadingScreen.style.left = '0';
      loadingScreen.style.width = '100%';
      loadingScreen.style.height = '100%';
      loadingScreen.style.display = 'flex';
      loadingScreen.style.flexDirection = 'column';
      loadingScreen.style.alignItems = 'center';
      loadingScreen.style.justifyContent = 'center';
      loadingScreen.style.backgroundColor = '#87CEEB';
      loadingScreen.style.zIndex = '1000';
      
      // Game title
      const title = document.createElement('h1');
      title.textContent = 'Luna\'s Adventure';
      title.style.fontFamily = 'Arial, sans-serif';
      title.style.fontSize = '48px';
      title.style.color = '#8B4513';
      title.style.marginBottom = '20px';
      title.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.3)';
      loadingScreen.appendChild(title);
      
      // Loading text
      const loadingText = document.createElement('p');
      loadingText.textContent = 'Loading game assets...';
      loadingText.style.fontFamily = 'Arial, sans-serif';
      loadingText.style.fontSize = '24px';
      loadingText.style.color = '#8B4513';
      loadingText.style.marginBottom = '30px';
      loadingScreen.appendChild(loadingText);
      
      // Loading spinner
      const spinner = document.createElement('div');
      spinner.style.width = '50px';
      spinner.style.height = '50px';
      spinner.style.border = '5px solid #FFC107';
      spinner.style.borderTop = '5px solid #8B4513';
      spinner.style.borderRadius = '50%';
      spinner.style.animation = 'spin 1s linear infinite';
      loadingScreen.appendChild(spinner);
      
      // Add the keyframe animation
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styleSheet);
      
      // Add to container
      this.container.appendChild(loadingScreen);
    }
  }
  
  /**
   * Hide loading screen
   */
  hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
      // Fade out animation
      loadingScreen.style.transition = 'opacity 0.5s ease-out';
      loadingScreen.style.opacity = '0';
      
      // Remove after animation completes
      setTimeout(() => {
        loadingScreen.remove();
      }, 500);
    }
  }
  
  /**
   * Show error screen with message
   * @param {string} message - Error message to display
   */
  showErrorScreen(message) {
    // Stop the game
    this.stop();
    
    // Create error screen
    const errorScreen = document.createElement('div');
    errorScreen.id = 'error-screen';
    errorScreen.style.position = 'absolute';
    errorScreen.style.top = '0';
    errorScreen.style.left = '0';
    errorScreen.style.width = '100%';
    errorScreen.style.height = '100%';
    errorScreen.style.display = 'flex';
    errorScreen.style.flexDirection = 'column';
    errorScreen.style.alignItems = 'center';
    errorScreen.style.justifyContent = 'center';
    errorScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    errorScreen.style.zIndex = '1000';
    
    // Error title
    const title = document.createElement('h1');
    title.textContent = 'Oops! Something went wrong';
    title.style.fontFamily = 'Arial, sans-serif';
    title.style.fontSize = '32px';
    title.style.color = '#F44336';
    title.style.marginBottom = '20px';
    errorScreen.appendChild(title);
    
    // Error message
    const errorMessage = document.createElement('p');
    errorMessage.textContent = message;
    errorMessage.style.fontFamily = 'Arial, sans-serif';
    errorMessage.style.fontSize = '18px';
    errorMessage.style.color = '#FFFFFF';
    errorMessage.style.marginBottom = '30px';
    errorMessage.style.maxWidth = '600px';
    errorMessage.style.textAlign = 'center';
    errorScreen.appendChild(errorMessage);
    
    // Refresh button
    const refreshButton = document.createElement('button');
    refreshButton.textContent = 'Refresh Page';
    refreshButton.style.padding = '10px 20px';
    refreshButton.style.fontSize = '18px';
    refreshButton.style.backgroundColor = '#4CAF50';
    refreshButton.style.color = '#FFFFFF';
    refreshButton.style.border = 'none';
    refreshButton.style.borderRadius = '5px';
    refreshButton.style.cursor = 'pointer';
    refreshButton.onclick = () => window.location.reload();
    errorScreen.appendChild(refreshButton);
    
    // Add to container
    this.container.appendChild(errorScreen);
  }
  
  /**
   * Show start screen
   */
  showStartScreen() {
    // Create start screen SVG
    const svgNS = "http://www.w3.org/2000/svg";
    const startScreen = document.createElementNS(svgNS, "g");
    startScreen.setAttribute("id", "start-screen");
    
    // Background
    const background = document.createElementNS(svgNS, "rect");
    background.setAttribute("x", "0");
    background.setAttribute("y", "0");
    background.setAttribute("width", this.width);
    background.setAttribute("height", this.height);
    background.setAttribute("fill", "rgba(0, 0, 0, 0.7)");
    startScreen.appendChild(background);
    
    // Title
    const title = document.createElementNS(svgNS, "text");
    title.setAttribute("x", this.width / 2);
    title.setAttribute("y", 150);
    title.setAttribute("font-family", "Arial, sans-serif");
    title.setAttribute("font-size", "48px");
    title.setAttribute("font-weight", "bold");
    title.setAttribute("fill", "#FFC107");
    title.setAttribute("text-anchor", "middle");
    title.textContent = "Luna's Adventure";
    startScreen.appendChild(title);
    
    // Subtitle
    const subtitle = document.createElementNS(svgNS, "text");
    subtitle.setAttribute("x", this.width / 2);
    subtitle.setAttribute("y", 200);
    subtitle.setAttribute("font-family", "Arial, sans-serif");
    subtitle.setAttribute("font-size", "24px");
    subtitle.setAttribute("fill", "#FFFFFF");
    subtitle.setAttribute("text-anchor", "middle");
    subtitle.textContent = "Help Luna find her way home!";
    startScreen.appendChild(subtitle);
    
    // Start button
    const buttonGroup = document.createElementNS(svgNS, "g");
    buttonGroup.setAttribute("id", "start-button");
    buttonGroup.setAttribute("transform", `translate(${this.width / 2 - 100}, 250)`);
    buttonGroup.style.cursor = "pointer";
    
    const buttonBg = document.createElementNS(svgNS, "rect");
    buttonBg.setAttribute("width", "200");
    buttonBg.setAttribute("height", "50");
    buttonBg.setAttribute("fill", "#4CAF50");
    buttonBg.setAttribute("rx", "10");
    buttonBg.setAttribute("ry", "10");
    buttonGroup.appendChild(buttonBg);
    
    const buttonText = document.createElementNS(svgNS, "text");
    buttonText.setAttribute("x", "100");
    buttonText.setAttribute("y", "32");
    buttonText.setAttribute("font-family", "Arial, sans-serif");
    buttonText.setAttribute("font-size", "24px");
    buttonText.setAttribute("font-weight", "bold");
    buttonText.setAttribute("fill", "#FFFFFF");
    buttonText.setAttribute("text-anchor", "middle");
    buttonText.textContent = "Start Game";
    buttonGroup.appendChild(buttonText);
    
    // Add click event
    buttonGroup.addEventListener("click", () => {
      this.startGame();
    });
    
    startScreen.appendChild(buttonGroup);
    
    // Instructions
    const instructions = document.createElementNS(svgNS, "text");
    instructions.setAttribute("x", this.width / 2);
    instructions.setAttribute("y", 350);
    instructions.setAttribute("font-family", "Arial, sans-serif");
    instructions.setAttribute("font-size", "18px");
    instructions.setAttribute("fill", "#FFFFFF");
    instructions.setAttribute("text-anchor", "middle");
    instructions.textContent = "Controls: Arrow keys to move, Spacebar to jump, P to pause";
    startScreen.appendChild(instructions);
    
    // Add Luna character
    const luna = document.createElementNS(svgNS, "g");
    luna.setAttribute("transform", `translate(${this.width / 2 - 30}, 400)`);
    
    // Create Luna's body (simplified version)
    const body = document.createElementNS(svgNS, "ellipse");
    body.setAttribute("cx", "30");
    body.setAttribute("cy", "20");
    body.setAttribute("rx", "30");
    body.setAttribute("ry", "20");
    body.setAttribute("fill", "#D2B48C");
    body.setAttribute("stroke", "#8B4513");
    body.setAttribute("stroke-width", "1.5");
    luna.appendChild(body);
    
    const face = document.createElementNS(svgNS, "ellipse");
    face.setAttribute("cx", "55");
    face.setAttribute("cy", "18");
    face.setAttribute("rx", "12");
    face.setAttribute("ry", "10");
    face.setAttribute("fill", "#E5C39E");
    face.setAttribute("stroke", "#8B4513");
    face.setAttribute("stroke-width", "1.5");
    luna.appendChild(face);
    
    const leftEye = document.createElementNS(svgNS, "circle");
    leftEye.setAttribute("cx", "58");
    leftEye.setAttribute("cy", "15");
    leftEye.setAttribute("r", "2");
    leftEye.setAttribute("fill", "#000000");
    luna.appendChild(leftEye);
    
    const rightEye = document.createElementNS(svgNS, "circle");
    rightEye.setAttribute("cx", "52");
    rightEye.setAttribute("cy", "15");
    rightEye.setAttribute("r", "2");
    rightEye.setAttribute("fill", "#000000");
    luna.appendChild(rightEye);
    
    const nose = document.createElementNS(svgNS, "ellipse");
    nose.setAttribute("cx", "55");
    nose.setAttribute("cy", "20");
    nose.setAttribute("rx", "3");
    nose.setAttribute("ry", "2");
    nose.setAttribute("fill", "#FFC0CB");
    luna.appendChild(nose);
    
    startScreen.appendChild(luna);
    
    // Add bounce animation to Luna
    const animateY = document.createElementNS(svgNS, "animateTransform");
    animateY.setAttribute("attributeName", "transform");
    animateY.setAttribute("type", "translate");
    animateY.setAttribute("from", `${this.width / 2 - 30} 400`);
    animateY.setAttribute("to", `${this.width / 2 - 30} 390`);
    animateY.setAttribute("dur", "1s");
    animateY.setAttribute("repeatCount", "indefinite");
    animateY.setAttribute("additive", "replace");
    animateY.setAttribute("calcMode", "spline");
    animateY.setAttribute("keySplines", "0.4 0 0.6 1; 0.4 0 0.6 1");
    luna.appendChild(animateY);
    
    // Add start screen to UI layer
    const uiLayer = document.getElementById("layer-ui");
    if (uiLayer) {
      uiLayer.appendChild(startScreen);
    }
  }
  
  /**
   * Hide start screen
   */
  hideStartScreen() {
    const startScreen = document.getElementById('start-screen');
    if (startScreen) {
      startScreen.remove();
    }
  }
  
  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, warning, error)
   */
  showNotification(message, type = 'info') {
    if (this.renderer) {
      this.renderer.renderNotification(message, type);
    } else {
      console.log(`Notification (${type}): ${message}`);
    }
  }
  
  /**
   * Start the game
   */
  startGame() {
    if (this.state.isRunning) return;
    
    console.log('Starting game...');
    
    // Hide start screen
    this.hideStartScreen();
    
    // Create local player
    if (!this.localPlayer) {
      this.createLocalPlayer();
    }
    
    // Enable input handling
    this.inputHandler.enable();
    
    // Start game loop
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
    
    // Notify server
    if (this.socket) {
      this.socket.emit('game:start');
    }
    
    console.log('Game started!');
    this.showNotification('Game started!', 'success');
  }
  
  /**
   * Stop the game
   */
  stop() {
    if (!this.state.isRunning) return;
    
    console.log('Stopping game...');
    
    // Stop animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Disable input handling
    this.inputHandler.disable();
    
    // Update state
    this.state.isRunning = false;
    this.state.isPaused = false;
    
    console.log('Game stopped');
  }
  
  /**
   * Pause the game
   */
  pause() {
    if (!this.state.isRunning || this.state.isPaused) return;
    
    console.log('Pausing game...');
    
    // Stop animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Update state
    this.state.isPaused = true;
    
    // Show pause screen
    this.showPauseScreen();
    
    console.log('Game paused');
  }
  
  /**
   * Resume the paused game
   */
  resume() {
    if (!this.state.isRunning || !this.state.isPaused) return;
    
    console.log('Resuming game...');
    
    // Hide pause screen
    this.hidePauseScreen();
    
    // Update state
    this.state.isPaused = false;
    
    // Resume game loop
    this.lastFrameTime = performance.now();
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
    
    console.log('Game resumed');
  }
  
  /**
   * Toggle pause state
   */
  togglePause() {
    if (this.state.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }
  
  /**
   * Show pause screen
   */
  showPauseScreen() {
    const svgNS = "http://www.w3.org/2000/svg";
    const pauseScreen = document.createElementNS(svgNS, "g");
    pauseScreen.setAttribute("id", "pause-screen");
    
    // Semi-transparent background
    const background = document.createElementNS(svgNS, "rect");
    background.setAttribute("x", "0");
    background.setAttribute("y", "0");
    background.setAttribute("width", this.width);
    background.setAttribute("height", this.height);
    background.setAttribute("fill", "rgba(0, 0, 0, 0.5)");
    pauseScreen.appendChild(background);
    
    // Pause text
    const pauseText = document.createElementNS(svgNS, "text");
    pauseText.setAttribute("x", this.width / 2);
    pauseText.setAttribute("y", this.height / 2 - 50);
    pauseText.setAttribute("font-family", "Arial, sans-serif");
    pauseText.setAttribute("font-size", "48px");
    pauseText.setAttribute("font-weight", "bold");
    pauseText.setAttribute("fill", "#FFFFFF");
    pauseText.setAttribute("text-anchor", "middle");
    pauseText.textContent = "PAUSED";
    pauseScreen.appendChild(pauseText);
    
    // Resume button
    const resumeButtonGroup = document.createElementNS(svgNS, "g");
    resumeButtonGroup.setAttribute("id", "resume-button");
    resumeButtonGroup.setAttribute("transform", `translate(${this.width / 2 - 100}, ${this.height / 2})`);
    resumeButtonGroup.style.cursor = "pointer";
    
    const resumeButtonBg = document.createElementNS(svgNS, "rect");
    resumeButtonBg.setAttribute("width", "200");
    resumeButtonBg.setAttribute("height", "50");
    resumeButtonBg.setAttribute("fill", "#4CAF50");
    resumeButtonBg.setAttribute("rx", "10");
    resumeButtonBg.setAttribute("ry", "10");
    resumeButtonGroup.appendChild(resumeButtonBg);
    
    const resumeButtonText = document.createElementNS(svgNS, "text");
    resumeButtonText.setAttribute("x", "100");
    resumeButtonText.setAttribute("y", "32");
    resumeButtonText.setAttribute("font-family", "Arial, sans-serif");
    resumeButtonText.setAttribute("font-size", "24px");
    resumeButtonText.setAttribute("font-weight", "bold");
    resumeButtonText.setAttribute("fill", "#FFFFFF");
    resumeButtonText.setAttribute("text-anchor", "middle");
    resumeButtonText.textContent = "Resume";
    resumeButtonGroup.appendChild(resumeButtonText);
    
    // Add click event
    resumeButtonGroup.addEventListener("click", () => {
      this.resume();
    });
    
    pauseScreen.appendChild(resumeButtonGroup);
    
    // Menu button
    const menuButtonGroup = document.createElementNS(svgNS, "g");
    menuButtonGroup.setAttribute("id", "menu-button");
    menuButtonGroup.setAttribute("transform", `translate(${this.width / 2 - 100}, ${this.height / 2 + 70})`);
    menuButtonGroup.style.cursor = "pointer";
    
    const menuButtonBg = document.createElementNS(svgNS, "rect");
    menuButtonBg.setAttribute("width", "200");
    menuButtonBg.setAttribute("height", "50");
    menuButtonBg.setAttribute("fill", "#FFC107");
    menuButtonBg.setAttribute("rx", "10");
    menuButtonBg.setAttribute("ry", "10");
    menuButtonGroup.appendChild(menuButtonBg);
    
    const menuButtonText = document.createElementNS(svgNS, "text");
    menuButtonText.setAttribute("x", "100");
    menuButtonText.setAttribute("y", "32");
    menuButtonText.setAttribute("font-family", "Arial, sans-serif");
    menuButtonText.setAttribute("font-size", "24px");
    menuButtonText.setAttribute("font-weight", "bold");
    menuButtonText.setAttribute("fill", "#FFFFFF");
    menuButtonText.setAttribute("text-anchor", "middle");
    menuButtonText.textContent = "Main Menu";
    menuButtonGroup.appendChild(menuButtonText);
    
    // Add click event
    menuButtonGroup.addEventListener("click", () => {
      this.stop();
      this.showStartScreen();
    });
    
    pauseScreen.appendChild(menuButtonGroup);
    
    // Add to UI layer
    const uiLayer = document.getElementById("layer-ui");
    if (uiLayer) {
      uiLayer.appendChild(pauseScreen);
    }
  }
  
  /**
   * Hide pause screen
   */
  hidePauseScreen() {
    const pauseScreen = document.getElementById('pause-screen');
    if (pauseScreen) {
      pauseScreen.remove();
    }
  }
  
  /**
   * Main game loop
   * @param {number} timestamp - Current time from requestAnimationFrame
   */
  gameLoop(timestamp) {
    // Calculate delta time (time since last frame in seconds)
    this.deltaTime = (timestamp - this.lastFrameTime) / 1000;
    this.lastFrameTime = timestamp;
    
    // Prevent large jumps if the game was in background
    if (this.deltaTime > 0.1) {
      this.deltaTime = 0.1;
    }
    
    // Update game time
    this.state.gameTime += this.deltaTime;
    
    // Calculate FPS
    this.frameCount++;
    if (timestamp - this.lastFpsUpdate > this.fpsUpdateInterval) {
      this.fps = Math.round(this.frameCount / ((timestamp - this.lastFpsUpdate) / 1000));
      this.lastFpsUpdate = timestamp;
      this.frameCount = 0;
      
      // Update FPS display if in debug mode
      if (this.settings.debug) {
        console.log(`FPS: ${this.fps}`);
      }
    }
    
    // Update physics
    this.updatePhysics();
    
    // Update game entities
    this.updateEntities();
    
    // Check for collisions
    this.checkCollisions();
    
    // Render the current frame
    this.render();
    
    // Schedule the next frame
    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  }
  
  /**
   * Update physics for all entities
   */
  updatePhysics() {
    // Player physics
    if (this.localPlayer) {
      this.physics.updateEntity(this.localPlayer, this.deltaTime);
    }
    
    // Update other players' physics (for prediction)
    for (const [id, player] of this.state.players) {
      if (id !== this.playerId) {
        this.physics.updateEntity(player, this.deltaTime);
      }
    }
    
    // Enemy physics
    for (const enemy of this.state.enemies.values()) {
      this.physics.updateEntity(enemy, this.deltaTime);
    }
    
    // Collectible animations (bobbing effect)
    for (const collectible of this.state.collectibles.values()) {
      if (!collectible.collected) {
        collectible.y += Math.sin(this.state.gameTime * 5) * 0.2;
      }
    }
  }
  
  /**
   * Update game entities (AI, animations, etc.)
   */
  updateEntities() {
    // Update player
    if (this.localPlayer) {
      // Apply input movement to velocity
      if (this.inputHandler.keys.left) {
        this.localPlayer.velocityX = -this.constants.PLAYER_SPEED;
        this.localPlayer.direction = 'left';
      } else if (this.inputHandler.keys.right) {
        this.localPlayer.velocityX = this.constants.PLAYER_SPEED;
        this.localPlayer.direction = 'right';
      } else {
        // Apply friction to slow down
        this.localPlayer.velocityX *= this.physics.friction;
      }
      
      // Handle jumping
      if (this.inputHandler.keys.jump && this.localPlayer.isGrounded) {
        this.localPlayer.velocityY = -this.constants.JUMP_FORCE;
        this.localPlayer.isJumping = true;
        this.localPlayer.isGrounded = false;
        
        // Emit jump event to server
        if (this.socket) {
          this.socket.emit('player:jump');
        }
      }
      
      // Update player state
      this.localPlayer.isGrounded = false; // Will be set to true during collision detection if on ground
      
      // Send updated position to server
      if (this.socket && (Math.abs(this.localPlayer.velocityX) > 0.1 || Math.abs(this.localPlayer.velocityY) > 0.1)) {
        this.socket.emit('player:move', {
          x: this.localPlayer.x,
          y: this.localPlayer.y,
          velocityX: this.localPlayer.velocityX,
          velocityY: this.localPlayer.velocityY,
          direction: this.localPlayer.direction
        });
      }
    }
    
    // Update enemies
    for (const enemy of this.state.enemies.values()) {
      // Basic AI - move back and forth within boundaries
      if (enemy.type === 'basic') {
        if (enemy.direction === 'right') {
          enemy.velocityX = this.constants.ENEMY_SPEED;
          if (enemy.x > enemy.patrolEnd) {
            enemy.direction = 'left';
          }
        } else {
          enemy.velocityX = -this.constants.ENEMY_SPEED;
          if (enemy.x < enemy.patrolStart) {
            enemy.direction = 'right';
          }
        }
      }
      // Flying enemy AI - sine wave movement
      else if (enemy.type === 'flying') {
        if (enemy.direction === 'right') {
          enemy.velocityX = this.constants.ENEMY_SPEED * 1.5;
          if (enemy.x > enemy.patrolEnd) {
            enemy.direction = 'left';
          }
        } else {
          enemy.velocityX = -this.constants.ENEMY_SPEED * 1.5;
          if (enemy.x < enemy.patrolStart) {
            enemy.direction = 'right';
          }
        }
        // Sine wave flying pattern
        enemy.y = enemy.startY + Math.sin(this.state.gameTime * 3) * 30;
      }
    }
  }
  
  /**
   * Check for collisions between entities
   */
  checkCollisions() {
    if (!this.localPlayer) return;
    
    const player = this.localPlayer;
    
    // Check platform collisions
    let isOnGround = false;
    for (const platform of this.state.platforms.values()) {
      if (this.physics.checkCollision(player, platform)) {
        // Resolve collision
        const collisionSide = this.physics.getCollisionSide(player, platform);
        
        if (collisionSide === 'top' && player.velocityY > 0) {
          // Landing on top of platform
          player.y = platform.y - player.height;
          player.velocityY = 0;
          player.isGrounded = true;
          player.isJumping = false;
          isOnGround = true;
        } else if (collisionSide === 'bottom' && player.velocityY < 0) {
          // Hitting platform from below
          player.y = platform.y + platform.height;
          player.velocityY = 0;
        } else if (collisionSide === 'left' && player.velocityX > 0) {
          // Hitting left side of platform
          player.x = platform.x - player.width;
          player.velocityX = 0;
        } else if (collisionSide === 'right' && player.velocityX < 0) {
          // Hitting right side of platform
          player.x = platform.x + platform.width;
          player.velocityX = 0;
        }
      }
    }
    
    // Update grounded state
    player.isGrounded = isOnGround;
    
    // Check world boundaries
    if (player.x < 0) {
      player.x = 0;
      player.velocityX = 0;
    } else if (player.x + player.width > this.width) {
      player.x = this.width - player.width;
      player.velocityX = 0;
    }
    
    // Check if player fell off the world
    if (player.y > this.height) {
      this.playerDeath();
      return;
    }
    
    // Check collectible collisions
    for (const [id, collectible] of this.state.collectibles) {
      if (!collectible.collected && this.physics.checkCollision(player, collectible)) {
        collectible.collected = true;
        this.collectCarrot(id);
      }
    }
    
    // Check enemy collisions
    for (const [id, enemy] of this.state.enemies) {
      if (this.physics.checkCollision(player, enemy)) {
        // If player is falling onto enemy from above
        if (player.velocityY > 0 && player.y + player.height - player.velocityY * this.deltaTime <= enemy.y + 10) {
          this.defeatEnemy(id);
          // Bounce player up
          player.velocityY = -this.constants.JUMP_FORCE * 0.7;
        } else {
          // Player takes damage
          this.playerHit();
        }
      }
    }
  }
  
  /**
   * Render the current game state
   */
  render() {
    if (!this.renderer) return;
    
    // Render background with parallax effect
    const cameraX = this.localPlayer ? this.localPlayer.x - this.width / 2 : 0;
    this.renderer.renderBackground(cameraX);
    
    // Render platforms
    for (const platform of this.state.platforms.values()) {
      this.renderer.renderPlatform(platform);
    }
    
    // Render collectibles
    for (const collectible of this.state.collectibles.values()) {
      if (!collectible.collected) {
        this.renderer.renderCollectible(collectible);
      }
    }
    
    // Render enemies
    for (const enemy of this.state.enemies.values()) {
      this.renderer.renderEnemy(enemy);
    }
    
    // Render players
    for (const [id, player] of this.state.players) {
      this.renderer.renderPlayer(player, id === this.playerId);
    }
    
    // Render UI elements
    this.renderer.renderUI({
      score: this.state.score,
      lives: this.state.playerLives,
      health: this.state.playerHealth,
      carrotsCollected: this.state.carrotsCollected,
      totalCarrots: this.state.totalCarrots,
      time: Math.floor(this.state.gameTime)
    }, this.playerId);
    
    // Render debug information if enabled
    if (this.settings.debug) {
      this.renderDebugInfo();
    }
  }
  
  /**
   * Render debug information
   */
  renderDebugInfo() {
    // Create debug overlay if it doesn't exist
    let debugOverlay = document.getElementById('debug-overlay');
    if (!debugOverlay) {
      debugOverlay = document.createElement('div');
      debugOverlay.id = 'debug-overlay';
      debugOverlay.style.position = 'absolute';
      debugOverlay.style.top = '10px';
      debugOverlay.style.right = '10px';
      debugOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      debugOverlay.style.color = '#FFFFFF';
      debugOverlay.style.padding = '10px';
      debugOverlay.style.fontFamily = 'monospace';
      debugOverlay.style.fontSize = '12px';
      debugOverlay.style.zIndex = '1000';
      debugOverlay.style.borderRadius = '5px';
      this.container.appendChild(debugOverlay);
    }
    
    // Update debug information
    debugOverlay.innerHTML = `
      FPS: ${this.fps}<br>
      Delta: ${this.deltaTime.toFixed(4)}s<br>
      Game Time: ${this.state.gameTime.toFixed(2)}s<br>
      <br>
      Players: ${this.state.players.size}<br>
      Enemies: ${this.state.enemies.size}<br>
      Platforms: ${this.state.platforms.size}<br>
      Collectibles: ${this.state.collectibles.size}<br>
      <br>
      Player Position: ${this.localPlayer ? `(${Math.round(this.localPlayer.x)}, ${Math.round(this.localPlayer.y)})` : 'N/A'}<br>
      Player Velocity: ${this.localPlayer ? `(${this.localPlayer.velocityX.toFixed(2)}, ${this.localPlayer.velocityY.toFixed(2)})` : 'N/A'}<br>
      Player Grounded: ${this.localPlayer ? this.localPlayer.isGrounded : 'N/A'}<br>
      <br>
      Memory Usage: ${Math.round(performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0)}MB
    `;
    
    // Enable debug rendering in other components
    this.renderer.setDebugMode(true);
    this.physics.setDebugMode(true);
  }
  
  /**
   * Load a level by id
   * @param {string} levelId - Level identifier
   * @returns {Promise} Promise that resolves when level is loaded
   */
  async loadLevel(levelId) {
    console.log(`Loading level: ${levelId}`);
    
    // Show loading indicator
    this.showNotification('Loading level...', 'info');
    
    try {
      // Reset game state
      this.resetGameState();
      
      // Request level data from server
      if (this.socket) {
        return new Promise((resolve, reject) => {
          this.socket.emit('level:request', { levelId });
          
          // Set up one-time listener for level data
          this.socket.once('level:data', (levelData) => {
            this.processLevelData(levelData);
            resolve(levelData);
          });
          
          // Set timeout for level loading
          setTimeout(() => {
            reject(new Error('Level loading timed out'));
          }, 10000);
        });
      } else {
        // Fallback to local level loading (for offline/development)
        const levelData = await this.loadLocalLevel(levelId);
        this.processLevelData(levelData);
        return levelData;
      }
    } catch (error) {
      console.error('Error loading level:', error);
      this.showNotification('Failed to load level', 'error');
      throw error;
    }
  }
  
  /**
   * Load a level from local storage (fallback for offline mode)
   * @param {string} levelId - Level identifier
   * @returns {Promise<Object>} Level data
   */
  async loadLocalLevel(levelId) {
    // Very simple example level data
    const levelData = {
      id: levelId,
      name: 'Level 1',
      width: 2000,
      height: 600,
      background: 'garden',
      gravity: 0.5,
      platforms: [
        { id: 'ground', x: 0, y: 500, width: 2000, height: 100, type: 'ground' },
        { id: 'platform1', x: 200, y: 400, width: 200, height: 20, type: 'platform' },
        { id: 'platform2', x: 500, y: 350, width: 200, height: 20, type: 'platform' },
        { id: 'platform3', x: 800, y: 300, width: 200, height: 20, type: 'platform' }
      ],
      collectibles: [
        { id: 'carrot1', x: 300, y: 370, width: 30, height: 30, type: 'carrot' },
        { id: 'carrot2', x: 600, y: 320, width: 30, height: 30, type: 'carrot' },
        { id: 'carrot3', x: 900, y: 270, width: 30, height: 30, type: 'carrot' }
      ],
      enemies: [
        { id: 'enemy1', x: 400, y: 470, width: 40, height: 40, type: 'basic', patrolStart: 300, patrolEnd: 500 },
        { id: 'enemy2', x: 700, y: 320, width: 40, height: 40, type: 'flying', patrolStart: 500, patrolEnd: 900, startY: 320 }
      ],
      spawnPoint: { x: 50, y: 400 }
    };
    
    return levelData;
  }
  
  /**
   * Process level data and create game entities
   * @param {Object} levelData - Level data object
   */
  processLevelData(levelData) {
    console.log('Processing level data:', levelData);
    
    // Set current level
    this.state.currentLevel = levelData.id;
    
    // Set physics properties
    if (levelData.gravity !== undefined) {
      this.physics.gravity = levelData.gravity;
    }
    
    // Clear existing entities
    this.state.platforms.clear();
    this.state.collectibles.clear();
    this.state.enemies.clear();
    
    // Create platforms
    for (const platformData of levelData.platforms) {
      const platform = new Platform(
        platformData.id,
        platformData.x,
        platformData.y,
        platformData.width,
        platformData.height,
        platformData.type
      );
      this.state.platforms.set(platform.id, platform);
    }
    
    // Create collectibles
    this.state.totalCarrots = 0;
    for (const collectibleData of levelData.collectibles) {
      const collectible = {
        id: collectibleData.id,
        x: collectibleData.x,
        y: collectibleData.y,
        width: collectibleData.width,
        height: collectibleData.height,
        type: collectibleData.type,
        collected: false
      };
      this.state.collectibles.set(collectible.id, collectible);
      
      if (collectible.type === 'carrot') {
        this.state.totalCarrots++;
      }
    }
    
    // Create enemies
    for (const enemyData of levelData.enemies) {
      const enemy = new Enemy(
        enemyData.id,
        enemyData.x,
        enemyData.y,
        enemyData.width,
        enemyData.height,
        enemyData.type
      );
      
      // Add patrol information for AI
      enemy.patrolStart = enemyData.patrolStart || enemyData.x - 100;
      enemy.patrolEnd = enemyData.patrolEnd || enemyData.x + 100;
      enemy.startY = enemyData.startY || enemyData.y;
      
      this.state.enemies.set(enemy.id, enemy);
    }
    
    // Set spawn point
    if (levelData.spawnPoint) {
      this.spawnPoint = levelData.spawnPoint;
    } else {
      this.spawnPoint = { x: 50, y: 400 };
    }
    
    // Reset player position if exists
    if (this.localPlayer) {
      this.localPlayer.x = this.spawnPoint.x;
      this.localPlayer.y = this.spawnPoint.y;
      this.localPlayer.velocityX = 0;
      this.localPlayer.velocityY = 0;
    }
    
    console.log('Level loaded successfully');
    this.showNotification(`Level ${levelData.name} loaded!`, 'success');
  }
  
  /**
   * Reset the game state
   */
  resetGameState() {
    this.state.gameTime = 0;
    this.state.carrotsCollected = 0;
    
    // Keep score and lives between levels
  }
  
  /**
   * Create the local player
   */
  createLocalPlayer() {
    this.localPlayer = new Player(
      this.playerId,
      this.spawnPoint ? this.spawnPoint.x : 50,
      this.spawnPoint ? this.spawnPoint.y : 400,
      60, // width
      40  // height
    );
    
    // Add player to the game state
    this.state.players.set(this.playerId, this.localPlayer);
    
    console.log('Local player created:', this.localPlayer);
  }
  
  /**
   * Add a new player to the game
   * @param {Object} playerData - Player data from server
   */
  addPlayer(playerData) {
    // Don't add if it's the local player
    if (playerData.id === this.playerId) return;
    
    console.log('New player joined:', playerData);
    
    const player = new Player(
      playerData.id,
      playerData.x,
      playerData.y,
      60, // width
      40  // height
    );
    
    // Add to players map
    this.state.players.set(player.id, player);
    
    // Show notification
    this.showNotification('New player joined!', 'info');
  }
  
  /**
   * Remove a player from the game
   * @param {string} playerId - Player ID to remove
   */
  removePlayer(playerId) {
    // Don't remove local player
    if (playerId === this.playerId) return;
    
    console.log('Player left:', playerId);
    
    // Remove from players map
    this.state.players.delete(playerId);
    
    // Show notification
    this.showNotification('Player left the game', 'info');
  }
  
  /**
   * Handle player move input
   * @param {string} direction - Movement direction ('left', 'right', 'stop')
   */
  handlePlayerMove(direction) {
    if (!this.localPlayer) return;
    
    // Update player direction and velocity
    if (direction === 'left') {
      this.localPlayer.direction = 'left';
    } else if (direction === 'right') {
      this.localPlayer.direction = 'right';
    }
    
    // Send move event to server
    if (this.socket) {
      this.socket.emit('player:move', { direction });
    }
  }
  
  /**
   * Handle player jump input
   */
  handlePlayerJump() {
    if (!this.localPlayer || !this.localPlayer.isGrounded) return;
    
    // Apply jump force
    this.localPlayer.velocityY = -this.constants.JUMP_FORCE;
    this.localPlayer.isJumping = true;
    this.localPlayer.isGrounded = false;
    
    // Send jump event to server
    if (this.socket) {
      this.socket.emit('player:jump');
    }
  }
  
  /**
   * Handle player taking damage
   */
  playerHit() {
    // Prevent multiple hits too quickly (invulnerability period)
    if (this.localPlayer.invulnerable) return;
    
    console.log('Player hit!');
    
    // Reduce health
    this.state.playerHealth -= 20;
    
    // Make player temporarily invulnerable
    this.localPlayer.invulnerable = true;
    setTimeout(() => {
      this.localPlayer.invulnerable = false;
    }, 1500);
    
    // Visual feedback
    this.localPlayer.flashing = true;
    const flashInterval = setInterval(() => {
      this.localPlayer.visible = !this.localPlayer.visible;
    }, 100);
    setTimeout(() => {
      clearInterval(flashInterval);
      this.localPlayer.flashing = false;
      this.localPlayer.visible = true;
    }, 1500);
    
    // Knockback effect
    this.localPlayer.velocityY = -7;
    this.localPlayer.velocityX = this.localPlayer.direction === 'right' ? -5 : 5;
    
    // Check if player is dead
    if (this.state.playerHealth <= 0) {
      this.playerDeath();
    }
    
    // Send damage event to server
    if (this.socket) {
      this.socket.emit('player:damage');
    }
  }
  
  /**
   * Handle player death
   */
  playerDeath() {
    console.log('Player died!');
    
    // Reduce lives
    this.state.playerLives--;
    
    // Check for game over
    if (this.state.playerLives <= 0) {
      this.gameOver();
      return;
    }
    
    // Reset player position and state
    this.localPlayer.x = this.spawnPoint.x;
    this.localPlayer.y = this.spawnPoint.y;
    this.localPlayer.velocityX = 0;
    this.localPlayer.velocityY = 0;
    this.state.playerHealth = 100;
    
    // Show notification
    this.showNotification(`Life lost! Lives remaining: ${this.state.playerLives}`, 'warning');
    
    // Send death event to server
    if (this.socket) {
      this.socket.emit('player:death');
    }
  }
  
  /**
   * Handle collecting a carrot
   * @param {string} carrotId - ID of the collected carrot
   */
  collectCarrot(carrotId) {
    console.log('Collected carrot:', carrotId);
    
    // Update state
    this.state.carrotsCollected++;
    this.state.score += 100;
    
    // Play sound effect
    if (this.settings.sound) {
      // TODO: Play sound
    }
    
    // Show score popup
    this.showScorePopup(100, this.localPlayer.x, this.localPlayer.y - 20);
    
    // Send collect event to server
    if (this.socket) {
      this.socket.emit('collectible:collected', { id: carrotId });
    }
    
    // Check if all carrots are collected
    if (this.state.carrotsCollected >= this.state.totalCarrots) {
      this.showNotification('All carrots collected!', 'success');
      
      // TODO: Complete level if all objectives met
    }
  }
  
  /**
   * Handle defeating an enemy
   * @param {string} enemyId - ID of the defeated enemy
   */
  defeatEnemy(enemyId) {
    console.log('Defeated enemy:', enemyId);
    
    // Remove enemy from game
    this.state.enemies.delete(enemyId);
    
    // Update score
    this.state.score += 200;
    
    // Play sound effect
    if (this.settings.sound) {
      // TODO: Play sound
    }
    
    // Show score popup
    this.showScorePopup(200, this.localPlayer.x, this.localPlayer.y - 40);
    
    // Send defeat event to server
    if (this.socket) {
      this.socket.emit('enemy:defeated', { id: enemyId });
    }
  }
  
  /**
   * Show a floating score popup
   * @param {number} points - Points to display
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  showScorePopup(points, x, y) {
    const svgNS = "http://www.w3.org/2000/svg";
    const uiLayer = document.getElementById("layer-ui");
    
    if (!uiLayer) return;
    
    // Create group for the popup
    const popup = document.createElementNS(svgNS, "g");
    popup.setAttribute("class", "score-popup");
    
    // Create text element
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("font-family", "Arial, sans-serif");
    text.setAttribute("font-size", "18px");
    text.setAttribute("font-weight", "bold");
    text.setAttribute("fill", "#FFFF00");
    text.setAttribute("stroke", "#000000");
    text.setAttribute("stroke-width", "1");
    text.setAttribute("text-anchor", "middle");
    text.textContent = `+${points}`;
    popup.appendChild(text);
    
    // Animate the popup
    const animateY = document.createElementNS(svgNS, "animate");
    animateY.setAttribute("attributeName", "y");
    animateY.setAttribute("from", y);
    animateY.setAttribute("to", y - 50);
    animateY.setAttribute("dur", "1s");
    animateY.setAttribute("fill", "freeze");
    text.appendChild(animateY);
    
    const animateOpacity = document.createElementNS(svgNS, "animate");
    animateOpacity.setAttribute("attributeName", "opacity");
    animateOpacity.setAttribute("from", "1");
    animateOpacity.setAttribute("to", "0");
    animateOpacity.setAttribute("dur", "1s");
    animateOpacity.setAttribute("fill", "freeze");
    text.appendChild(animateOpacity);
    
    uiLayer.appendChild(popup);
    
    // Remove the popup after animation completes
    setTimeout(() => {
      popup.remove();
    }, 1000);
  }
  
  /**
   * Game over sequence
   */
  gameOver() {
    console.log('Game over!');
    
    // Stop the game
    this.stop();
    
    // Show game over screen
    this.renderer.renderGameOver(this.state.score);
    
    // Send game over event to server
    if (this.socket) {
      this.socket.emit('player:gameover', { score: this.state.score });
    }
  }
  
  /**
   * Restart the game
   */
  restartGame() {
    console.log('Restarting game...');
    
    // Reset game state
    this.state.score = 0;
    this.state.playerLives = 3;
    this.state.playerHealth = 100;
    this.state.carrotsCollected = 0;
    this.state.gameTime = 0;
    
    // Reload the first level
    this.loadLevel('level-1')
      .then(() => {
        // Start game
        this.startGame();
      })
      .catch(error => {
        console.error('Error restarting game:', error);
        this.showErrorScreen('Failed to restart game. Please refresh the page.');
      });
  }
  
  /**
   * Complete the current level
   */
  completeLevel() {
    console.log('Level completed!');
    
    // Stop the game
    this.stop();
    
    // Calculate level statistics
    const levelStats = {
      score: this.state.score,
      carrotsCollected: this.state.carrotsCollected,
      totalCarrots: this.state.totalCarrots,
      enemiesDefeated: this.constants.TOTAL_ENEMIES - this.state.enemies.size,
      time: Math.floor(this.state.gameTime)
    };
    
    // Show level complete screen
    this.renderer.renderLevelComplete(levelStats, () => {
      // Continue to next level
      this.continueToNextLevel();
    });
    
    // Send level complete event to server
    if (this.socket) {
      this.socket.emit('level:complete', { 
        levelId: this.state.currentLevel,
        stats: levelStats
      });
    }
  }
  
  /**
   * Continue to the next level
   */
  continueToNextLevel() {
    console.log('Continuing to next level...');
    
    // Get next level id
    const currentLevelNum = parseInt(this.state.currentLevel.split('-')[1]);
    const nextLevelId = `level-${currentLevelNum + 1}`;
    
    // Load next level
    this.loadLevel(nextLevelId)
      .then(() => {
        // Start game again
        this.startGame();
      })
      .catch(error => {
        console.error('Error loading next level:', error);
        
        // Check if it's just because we've finished all levels
        if (error.message.includes('not found') || error.message.includes('timed out')) {
          this.showVictoryScreen();
        } else {
          this.showErrorScreen('Failed to load next level. Please try again.');
        }
      });
  }
  
  /**
   * Show victory screen (all levels completed)
   */
  showVictoryScreen() {
    console.log('Game completed!');
    
    // Create victory screen
    const svgNS = "http://www.w3.org/2000/svg";
    const victoryScreen = document.createElementNS(svgNS, "g");
    victoryScreen.setAttribute("id", "victory-screen");
    
    // Background
    const background = document.createElementNS(svgNS, "rect");
    background.setAttribute("x", "0");
    background.setAttribute("y", "0");
    background.setAttribute("width", this.width);
    background.setAttribute("height", this.height);
    background.setAttribute("fill", "rgba(0, 0, 0, 0.7)");
    victoryScreen.appendChild(background);
    
    // Victory title
    const title = document.createElementNS(svgNS, "text");
    title.setAttribute("x", this.width / 2);
    title.setAttribute("y", 150);
    title.setAttribute("font-family", "Arial, sans-serif");
    title.setAttribute("font-size", "48px");
    title.setAttribute("font-weight", "bold");
    title.setAttribute("fill", "#FFD700");
    title.setAttribute("text-anchor", "middle");
    title.textContent = "Congratulations!";
    victoryScreen.appendChild(title);
    
    // Victory message
    const message = document.createElementNS(svgNS, "text");
    message.setAttribute("x", this.width / 2);
    message.setAttribute("y", 220);
    message.setAttribute("font-family", "Arial, sans-serif");
    message.setAttribute("font-size", "24px");
    message.setAttribute("fill", "#FFFFFF");
    message.setAttribute("text-anchor", "middle");
    message.textContent = "Luna has found her way home!";
    victoryScreen.appendChild(message);
    
    // Final score
    const scoreText = document.createElementNS(svgNS, "text");
    scoreText.setAttribute("x", this.width / 2);
    scoreText.setAttribute("y", 280);
    scoreText.setAttribute("font-family", "Arial, sans-serif");
    scoreText.setAttribute("font-size", "36px");
    scoreText.setAttribute("fill", "#FFFFFF");
    scoreText.setAttribute("text-anchor", "middle");
    scoreText.textContent = `Final Score: ${this.state.score}`;
    victoryScreen.appendChild(scoreText);
    
    // Play again button
    const buttonGroup = document.createElementNS(svgNS, "g");
    buttonGroup.setAttribute("id", "play-again-button");
    buttonGroup.setAttribute("transform", `translate(${this.width / 2 - 100}, 350)`);
    buttonGroup.style.cursor = "pointer";
    
    const buttonBg = document.createElementNS(svgNS, "rect");
    buttonBg.setAttribute("width", "200");
    buttonBg.setAttribute("height", "50");
    buttonBg.setAttribute("fill", "#4CAF50");
    buttonBg.setAttribute("rx", "10");
    buttonBg.setAttribute("ry", "10");
    buttonGroup.appendChild(buttonBg);
    
    const buttonText = document.createElementNS(svgNS, "text");
    buttonText.setAttribute("x", "100");
    buttonText.setAttribute("y", "32");
    buttonText.setAttribute("font-family", "Arial, sans-serif");
    buttonText.setAttribute("font-size", "24px");
    buttonText.setAttribute("font-weight", "bold");
    buttonText.setAttribute("fill", "#FFFFFF");
    buttonText.setAttribute("text-anchor", "middle");
    buttonText.textContent = "Play Again";
    buttonGroup.appendChild(buttonText);
    
    // Add click event
    buttonGroup.addEventListener("click", () => {
      this.restartGame();
    });
    
    victoryScreen.appendChild(buttonGroup);
    
    // Add Luna character with celebration animation
    const luna = document.createElementNS(svgNS, "g");
    luna.setAttribute("transform", `translate(${this.width / 2 - 30}, 450)`);
    
    // Simple Luna character drawing
    this.renderer.createLunaSVG(luna);
    
    // Add celebration animation
    const animateY = document.createElementNS(svgNS, "animateTransform");
    animateY.setAttribute("attributeName", "transform");
    animateY.setAttribute("type", "translate");
    animateY.setAttribute("from", `${this.width / 2 - 30} 450`);
    animateY.setAttribute("to", `${this.width / 2 - 30} 430`);
    animateY.setAttribute("dur", "0.5s");
    animateY.setAttribute("repeatCount", "indefinite");
    animateY.setAttribute("additive", "replace");
    animateY.setAttribute("calcMode", "spline");
    animateY.setAttribute("keySplines", "0.4 0 0.6 1; 0.4 0 0.6 1");
    luna.appendChild(animateY);
    
    victoryScreen.appendChild(luna);
    
    // Add confetti effect
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElementNS(svgNS, "rect");
      const x = Math.random() * this.width;
      const y = Math.random() * this.height - this.height; // Start above screen
      const size = 5 + Math.random() * 10;
      const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700'];
      
      confetti.setAttribute("x", x);
      confetti.setAttribute("y", y);
      confetti.setAttribute("width", size);
      confetti.setAttribute("height", size);
      confetti.setAttribute("fill", colors[Math.floor(Math.random() * colors.length)]);
      confetti.setAttribute("transform", `rotate(${Math.random() * 360} ${x + size/2} ${y + size/2})`);
      
      // Fall animation
      const animate = document.createElementNS(svgNS, "animate");
      animate.setAttribute("attributeName", "y");
      animate.setAttribute("from", y);
      animate.setAttribute("to", this.height);
      animate.setAttribute("dur", `${3 + Math.random() * 5}s`);
      animate.setAttribute("repeatCount", "indefinite");
      confetti.appendChild(animate);
      
      // Swing animation
      const animateX = document.createElementNS(svgNS, "animate");
      animateX.setAttribute("attributeName", "x");
      animateX.setAttribute("from", x);
      animateX.setAttribute("to", `${x + (Math.random() * 100 - 50)}`);
      animateX.setAttribute("dur", `${2 + Math.random() * 3}s`);
      animateX.setAttribute("repeatCount", "indefinite");
      animateX.setAttribute("calcMode", "spline");
      animateX.setAttribute("keySplines", "0.4 0 0.6 1; 0.4 0 0.6 1");
      confetti.appendChild(animateX);
      
      victoryScreen.appendChild(confetti);
    }
    
    // Add to UI layer
    const uiLayer = document.getElementById("layer-ui");
    if (uiLayer) {
      uiLayer.appendChild(victoryScreen);
    }
  }
  
  /**
   * Update game state from server data
   * @param {Object} gameState - Game state from server
   */
  updateGameState(gameState) {
    // Update players (except local player)
    if (gameState.players) {
      for (const playerData of gameState.players) {
        if (playerData.id !== this.playerId) {
          let player = this.state.players.get(playerData.id);
          
          if (!player) {
            // New player, create and add to map
            player = new Player(
              playerData.id,
              playerData.x,
              playerData.y,
              60, // width
              40  // height
            );
            this.state.players.set(playerData.id, player);
          } else {
            // Update existing player
            player.x = playerData.x;
            player.y = playerData.y;
            player.velocityX = playerData.velocityX;
            player.velocityY = playerData.velocityY;
            player.direction = playerData.direction;
            player.isJumping = playerData.isJumping;
            player.isGrounded = playerData.isGrounded;
          }
        }
      }
    }
    
    // Update enemies
    if (gameState.enemies) {
      // Clear old enemies
      this.state.enemies.clear();
      
      // Add new enemies
      for (const enemyData of gameState.enemies) {
        const enemy = new Enemy(
          enemyData.id,
          enemyData.x,
          enemyData.y,
          enemyData.width || 40,
          enemyData.height || 40,
          enemyData.type
        );
        
        enemy.velocityX = enemyData.velocityX || 0;
        enemy.velocityY = enemyData.velocityY || 0;
        enemy.direction = enemyData.direction || 'right';
        
        // Add patrol information for AI
        enemy.patrolStart = enemyData.patrolStart || enemyData.x - 100;
        enemy.patrolEnd = enemyData.patrolEnd || enemyData.x + 100;
        enemy.startY = enemyData.startY || enemyData.y;
        
        this.state.enemies.set(enemy.id, enemy);
      }
    }
    
    // Update collectibles
    if (gameState.collectibles) {
      for (const collectibleData of gameState.collectibles) {
        const collectible = this.state.collectibles.get(collectibleData.id);
        
        if (collectible) {
          // Update existing collectible
          collectible.collected = collectibleData.collected;
        }
      }
    }
  }
  
  /**
   * Handle player damage event from server
   * @param {Object} data - Damage event data
   */
  handlePlayerDamage(data) {
    if (data.playerId === this.playerId) {
      // Update local player health
      this.state.playerHealth = data.health;
      
      // Show visual feedback (flashing)
      if (this.localPlayer) {
        this.localPlayer.flashing = true;
        const flashInterval = setInterval(() => {
          this.localPlayer.visible = !this.localPlayer.visible;
        }, 100);
        setTimeout(() => {
          clearInterval(flashInterval);
          this.localPlayer.flashing = false;
          this.localPlayer.visible = true;
        }, 1500);
      }
    }
  }
  
  /**
   * Handle player respawn event from server
   * @param {Object} data - Respawn event data
   */
  handlePlayerRespawn(data) {
    if (data.playerId === this.playerId) {
      // Update lives
      this.state.playerLives = data.lives;
      
      // Show notification
      this.showNotification(`Life lost! Lives remaining: ${data.lives}`, 'warning');
    }
  }
  
  /**
   * Handle game over event from server
   * @param {Object} data - Game over event data
   */
  handleGameOver(data) {
    if (data.playerId === this.playerId) {
      this.gameOver();
    }
  }
  
  /**
   * Handle collectible collected event from server
   * @param {Object} data - Collectible event data
   */
  handleCollectibleCollected(data) {
    const collectible = this.state.collectibles.get(data.collectibleId);
    
    if (collectible) {
      collectible.collected = true;
      
      if (data.playerId === this.playerId) {
        // Update local state
        this.state.carrotsCollected++;
        this.state.score += 100;
      }
    }
  }
  
  /**
   * Handle enemy defeated event from server
   * @param {Object} data - Enemy defeat event data
   */
  handleEnemyDefeated(data) {
    this.state.enemies.delete(data.enemyId);
    
    if (data.playerId === this.playerId) {
      // Update score
      this.state.score += 200;
    }
  }
  
  /**
   * Toggle debug mode
   */
  toggleDebugMode() {
    this.settings.debug = !this.settings.debug;
    console.log(`Debug mode: ${this.settings.debug ? 'enabled' : 'disabled'}`);
    
    // Update renderer debug mode
    if (this.renderer) {
      this.renderer.setDebugMode(this.settings.debug);
    }
    
    // Update physics debug mode
    if (this.physics) {
      this.physics.setDebugMode(this.settings.debug);
    }
    
    // Show/hide debug overlay
    const debugOverlay = document.getElementById('debug-overlay');
    if (debugOverlay) {
      debugOverlay.style.display = this.settings.debug ? 'block' : 'none';
    }
  }
}

// Create and export the game instance
const game = new Game('game-container');
export default game;