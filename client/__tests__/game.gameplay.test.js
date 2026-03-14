import { Game } from '../scripts/game';

function createDocumentStub() {
  const elements = new Map();

  elements.set('game-container', {
    id: 'game-container',
    clientWidth: 1000,
    clientHeight: 600,
    appendChild: () => {},
    style: {}
  });

  return {
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
  return {
    location: {
      protocol: 'http:',
      hostname: 'localhost',
      port: '3000'
    },
    WebSocket: function WebSocketStub() {},
    requestAnimationFrame,
    cancelAnimationFrame,
    addEventListener: () => {},
    removeEventListener: () => {},
    io: () => ({
      id: 'socket-local',
      on: () => {},
      once: () => {},
      emit: () => {}
    })
  };
}

function createGameWithoutAutoInit() {
  const originalInitialize = Game.prototype.initialize;
  Game.prototype.initialize = async function initializeStub() {
    return null;
  };
  const game = new Game('game-container');
  Game.prototype.initialize = originalInitialize;
  return game;
}

describe('Game gameplay behavior', () => {
  beforeEach(() => {
    global.performance = {
      now: () => 100
    };
    global.requestAnimationFrame = () => 777;
    global.cancelAnimationFrame = () => {};
    global.document = createDocumentStub();
    global.window = createWindowStub();
  });

  test('collectCarrot triggers audio hook and objective check', () => {
    const game = createGameWithoutAutoInit();
    const hookSpy = jest.spyOn(game, 'playAudioHook').mockReturnValue(true);
    game.checkLevelComplete = jest.fn();
    game.showScorePopup = () => {};
    game.localPlayer = {
      x: 20,
      y: 30
    };

    game.collectCarrot('carrot-1');

    expect(game.state.carrotsCollected).toBe(1);
    expect(game.state.score).toBe(100);
    expect(hookSpy).toHaveBeenCalledWith(
      'collectible:carrot',
      expect.objectContaining({
        collectibleId: 'carrot-1',
        points: 100
      })
    );
    expect(game.checkLevelComplete).toHaveBeenCalledTimes(1);
  });

  test('handlePlayerJump triggers jump audio hook when grounded', () => {
    const game = createGameWithoutAutoInit();
    const hookSpy = jest.spyOn(game, 'playAudioHook').mockReturnValue(true);
    const emitSpy = jest.fn();

    game.playerId = 'player-local';
    game.localPlayer = {
      isGrounded: true,
      isJumping: false,
      velocityY: 0,
      jumpsUsed: 0,
      abilities: { doubleJump: false, highJump: false }
    };
    game.socket = {
      emit: emitSpy
    };

    game.handlePlayerJump();

    expect(game.localPlayer.isGrounded).toBe(false);
    expect(game.localPlayer.isJumping).toBe(true);
    expect(hookSpy).toHaveBeenCalledWith(
      'player:jump',
      expect.objectContaining({
        playerId: 'player-local',
        jumpForce: game.constants.JUMP_FORCE
      })
    );
    expect(emitSpy).toHaveBeenCalledWith('player:jump');
  });

  test('playerHit triggers damage audio hook', () => {
    jest.useFakeTimers();

    const game = createGameWithoutAutoInit();
    const hookSpy = jest.spyOn(game, 'playAudioHook').mockReturnValue(true);

    game.playerId = 'player-local';
    game.localPlayer = {
      invulnerable: false,
      direction: 'right',
      flashing: false,
      visible: true,
      velocityX: 0,
      velocityY: 0
    };
    game.socket = {
      emit: jest.fn()
    };

    game.playerHit();

    expect(game.state.playerHealth).toBe(80);
    expect(hookSpy).toHaveBeenCalledWith(
      'player:damage',
      expect.objectContaining({
        playerId: 'player-local',
        remainingHealth: 80
      })
    );

    jest.advanceTimersByTime(1600);
    jest.useRealTimers();
  });

  test('completeLevel triggers level completion audio hook', () => {
    const game = createGameWithoutAutoInit();
    const hookSpy = jest.spyOn(game, 'playAudioHook').mockReturnValue(true);

    game.state.isRunning = true;
    game.state.currentLevel = 'level-1';
    game.state.score = 800;
    game.state.carrotsCollected = 3;
    game.state.totalCarrots = 3;
    game.state.totalEnemies = 2;
    game.state.enemies = new Map();

    game.stop = () => {
      game.state.isRunning = false;
    };
    game.renderer = {
      renderLevelComplete: jest.fn()
    };
    game.socket = {
      emit: jest.fn()
    };

    game.completeLevel();

    expect(game.state.levelComplete).toBe(true);
    expect(hookSpy).toHaveBeenCalledWith(
      'level:complete',
      expect.objectContaining({
        carrotsCollected: 3,
        totalCarrots: 3,
        enemiesRemaining: 0
      })
    );
  });

  test('server collectible updates can complete level objectives', () => {
    const game = createGameWithoutAutoInit();

    game.state.isRunning = true;
    game.state.levelComplete = false;
    game.state.totalCarrots = 1;
    game.state.totalEnemies = 0;
    game.state.carrotsCollected = 0;
    game.state.enemies = new Map();
    game.state.collectibles = new Map([
      ['carrot-1', { id: 'carrot-1', type: 'carrot', collected: false }]
    ]);

    game.completeLevel = jest.fn(() => {
      game.state.levelComplete = true;
    });

    game.handleCollectibleCollected({ collectibleId: 'carrot-1', playerId: 'remote-player' });

    expect(game.state.carrotsCollected).toBe(1);
    expect(game.completeLevel).toHaveBeenCalledTimes(1);

    game.handleCollectibleCollected({ collectibleId: 'carrot-1', playerId: 'remote-player' });
    expect(game.state.carrotsCollected).toBe(1);
    expect(game.completeLevel).toHaveBeenCalledTimes(1);
  });

  test('checkLevelComplete does not complete level when enemies remain', () => {
    const game = createGameWithoutAutoInit();

    game.state.isRunning = true;
    game.state.levelComplete = false;
    game.state.totalCarrots = 1;
    game.state.carrotsCollected = 1;
    game.state.totalEnemies = 1;
    game.state.enemies = new Map([
      ['enemy-1', { id: 'enemy-1' }]
    ]);
    game.completeLevel = jest.fn();

    game.checkLevelComplete();

    expect(game.completeLevel).not.toHaveBeenCalled();
  });
});
