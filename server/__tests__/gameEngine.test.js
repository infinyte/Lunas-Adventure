import GameEngine from '../services/gameEngine.js';

describe('GameEngine', () => {
  test('emits enemy:defeated when enemy is removed', () => {
    const engine = new GameEngine();
    engine.addEnemy('enemy-1', 400, 470, 'basic');
    const emitted = [];

    engine.on('enemy:defeated', (payload) => {
      emitted.push(payload);
    });

    engine.defeatEnemy('enemy-1');

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toEqual({ enemyId: 'enemy-1' });
  });

  test('collectCollectible marks item and increments score', () => {
    const engine = new GameEngine();
    const player = engine.addPlayer('player-1');
    engine.collectibles.push({
      id: 'carrot-1', x: 300, y: 370, width: 30, height: 30, type: 'carrot', collected: false
    });

    engine.collectCollectible('player-1', 'carrot-1');

    expect(player.score).toBe(100);
    expect(engine.collectibles.find((item) => item.id === 'carrot-1')?.collected).toBe(true);
  });

  test('breaking platform transitions from breaking to broken to stable', () => {
    const engine = new GameEngine();

    engine.fps = 10;
    engine.platforms = [
      {
        id: 'breaking-1',
        x: 0,
        y: 0,
        width: 100,
        height: 20,
        type: 'breaking',
        breakingState: 'breaking',
        breakingTimer: 0.45,
        respawnTimer: 0,
        solid: true
      }
    ];

    engine.updatePlatforms();

    expect(engine.platforms[0].breakingState).toBe('broken');
    expect(engine.platforms[0].solid).toBe(false);

    engine.platforms[0].respawnTimer = 2.95;
    engine.updatePlatforms();

    expect(engine.platforms[0].breakingState).toBe('stable');
    expect(engine.platforms[0].solid).toBe(true);
    expect(engine.platforms[0].respawnTimer).toBe(0);
  });

  test('projectile update damages colliding player and consumes projectile', () => {
    const engine = new GameEngine();
    const player = engine.addPlayer('player-1');
    const emitted = [];

    engine.on('projectile:fired', (payload) => {
      emitted.push(payload);
    });

    engine.fireProjectile(
      {
        id: 'enemy-shooter', x: 20, y: 20, width: 40, height: 40
      },
      player.x,
      player.y
    );

    expect(emitted).toHaveLength(1);
    expect(engine.projectiles).toHaveLength(1);

    engine.projectiles[0].x = player.x + 5;
    engine.projectiles[0].y = player.y + 5;
    engine.projectiles[0].velocityX = 0;
    engine.projectiles[0].velocityY = 0;

    engine.updateProjectiles();

    expect(player.health).toBe(80);
    expect(engine.projectiles).toHaveLength(0);
  });
});
