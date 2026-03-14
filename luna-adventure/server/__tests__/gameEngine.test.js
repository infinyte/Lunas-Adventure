import GameEngine from '../services/gameEngine.js';

describe('GameEngine', () => {
  test('emits enemy:defeated when enemy is removed', () => {
    const engine = new GameEngine();
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

    engine.collectCollectible('player-1', 'carrot-1');

    expect(player.score).toBe(100);
    expect(engine.collectibles.find((item) => item.id === 'carrot-1')?.collected).toBe(true);
  });
});
