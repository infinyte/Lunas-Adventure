import { Game } from '../scripts/game';

function createDocumentStub() {
  const elements = new Map();

  const container = {
    id: 'game-container',
    clientWidth: 1000,
    clientHeight: 600,
    appendChild: () => {},
    style: {}
  };
  elements.set('game-container', container);

  return {
    fullscreenElement: null,
    documentElement: {
      requestFullscreen: jest.fn(() => Promise.resolve())
    },
    implementation: {
      hasFeature: () => true
    },
    hidden: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: (id) => elements.get(id) || null,
    createElement: () => ({
      style: {},
      appendChild: () => {},
      remove: () => {},
      setAttribute: () => {},
      addEventListener: () => {}
    }),
    createElementNS: () => ({
      style: {},
      appendChild: () => {},
      remove: () => {},
      setAttribute: () => {},
      addEventListener: () => {},
      classList: {
        add: () => {},
        remove: () => {}
      }
    })
  };
}

function createWindowStub() {
  const handlers = {};
  const storage = new Map();

  const socket = {
    id: 'socket-local',
    on: (eventName, callback) => {
      handlers[eventName] = callback;
      if (eventName === 'connect') {
        callback();
      }
    },
    once: (eventName, callback) => {
      if (eventName === 'level:data') {
        callback({
          id: 'level-1',
          gravity: 0.5,
          platforms: [],
          collectibles: [],
          enemies: []
        });
      }
    },
    emit: () => {}
  };

  return {
    location: {
      protocol: 'http:',
      hostname: 'localhost',
      port: '3000'
    },
    localStorage: {
      getItem: (key) => (storage.has(key) ? storage.get(key) : null),
      setItem: (key, value) => {
        storage.set(key, value);
      },
      removeItem: (key) => {
        storage.delete(key);
      }
    },
    WebSocket: function WebSocketStub() {},
    requestAnimationFrame,
    cancelAnimationFrame,
    addEventListener: () => {},
    removeEventListener: () => {},
    io: () => socket
  };
}

describe('Game orchestration', () => {
  beforeEach(() => {
    global.performance = {
      now: () => 100
    };

    global.requestAnimationFrame = () => 777;
    global.cancelAnimationFrame = () => {};
    global.document = createDocumentStub();
    global.window = createWindowStub();
  });

  function createGameWithoutAutoInit() {
    const originalInitialize = Game.prototype.initialize;
    Game.prototype.initialize = async function initializeStub() {
      return null;
    };
    const game = new Game('game-container');
    Game.prototype.initialize = originalInitialize;
    return game;
  }

  test('startGame enables input, starts loop, and emits game:start', () => {
    const game = createGameWithoutAutoInit();
    const emittedEvents = [];

    game.hideStartScreen = () => {};
    game.showNotification = () => {};
    game.createLocalPlayer = () => {
      game.localPlayer = {
        id: 'local-player',
        x: 0,
        y: 0,
        velocityX: 0,
        velocityY: 0,
        direction: 'right',
        isGrounded: true
      };
    };

    game.inputHandler = {
      enable: () => {
        game.inputEnabled = true;
      },
      disable: () => {}
    };

    game.socket = {
      emit: (eventName) => {
        emittedEvents.push(eventName);
      }
    };

    game.startGame();

    expect(game.state.isRunning).toBe(true);
    expect(game.state.isPaused).toBe(false);
    expect(game.animationFrameId).toBe(777);
    expect(game.inputEnabled).toBe(true);
    expect(emittedEvents).toContain('game:start');
  });

  test('pause transitions state and stops active frame', () => {
    const game = createGameWithoutAutoInit();
    let cancelledFrameId = null;

    global.cancelAnimationFrame = (id) => {
      cancelledFrameId = id;
    };

    game.showPauseScreen = () => {
      game.pauseScreenShown = true;
    };

    game.state.isRunning = true;
    game.state.isPaused = false;
    game.animationFrameId = 321;

    game.pause();

    expect(cancelledFrameId).toBe(321);
    expect(game.animationFrameId).toBe(null);
    expect(game.state.isPaused).toBe(true);
    expect(game.pauseScreenShown).toBe(true);
  });

  test('resume clears pause and requests new animation frame', () => {
    const game = createGameWithoutAutoInit();

    global.requestAnimationFrame = () => 999;

    game.hidePauseScreen = () => {
      game.pauseScreenHidden = true;
    };

    game.state.isRunning = true;
    game.state.isPaused = true;

    game.resume();

    expect(game.state.isPaused).toBe(false);
    expect(game.animationFrameId).toBe(999);
    expect(game.pauseScreenHidden).toBe(true);
  });

  test('updateGameState syncs remote player and enemy collections', () => {
    const game = createGameWithoutAutoInit();

    game.playerId = 'local-id';
    game.state.players = new Map();
    game.state.enemies = new Map();
    game.state.collectibles = new Map();

    game.updateGameState({
      players: [
        {
          id: 'remote-id',
          x: 10,
          y: 20,
          velocityX: 1,
          velocityY: 2,
          direction: 'left',
          isJumping: false,
          isGrounded: true
        }
      ],
      enemies: [
        {
          id: 'enemy-remote',
          x: 100,
          y: 120,
          width: 40,
          height: 40,
          type: 'basic',
          velocityX: 1,
          velocityY: 0,
          direction: 'right'
        }
      ],
      collectibles: []
    });

    const remotePlayer = game.state.players.get('remote-id');
    const remoteEnemy = game.state.enemies.get('enemy-remote');

    expect(game.state.players.size).toBe(1);
    expect(remotePlayer.x).toBe(10);
    expect(remotePlayer.direction).toBe('left');
    expect(game.state.enemies.size).toBe(1);
    expect(remoteEnemy.type).toBe('basic');
  });

  test('loads persisted settings during construction', () => {
    window.localStorage.setItem('lunas-adventure:settings', JSON.stringify({
      debug: true,
      sound: false,
      music: false,
      fullscreen: true
    }));

    const game = createGameWithoutAutoInit();

    expect(game.settings.debug).toBe(true);
    expect(game.settings.sound).toBe(false);
    expect(game.settings.music).toBe(false);
    expect(game.settings.fullscreen).toBe(true);
  });

  test('updateSettings persists values and applies them to subsystems', () => {
    const game = createGameWithoutAutoInit();

    game.soundManager = {
      setSettings: jest.fn()
    };
    game.renderer = {
      setDebugMode: jest.fn()
    };
    game.physics = {
      setDebugMode: jest.fn()
    };

    game.updateSettings({
      debug: true,
      sound: false,
      music: false
    });

    expect(game.soundManager.setSettings).toHaveBeenCalledWith(expect.objectContaining({
      debug: true,
      sound: false,
      music: false,
      fullscreen: false
    }));
    expect(game.renderer.setDebugMode).toHaveBeenCalledWith(true);
    expect(game.physics.setDebugMode).toHaveBeenCalledWith(true);

    const persistedSettings = JSON.parse(window.localStorage.getItem('lunas-adventure:settings'));
    expect(persistedSettings).toMatchObject({
      debug: true,
      sound: false,
      music: false,
      fullscreen: false
    });
  });
});
