import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import StateManager from '../services/stateManager.js';

describe('StateManager', () => {
  test('adds and returns high scores sorted descending', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'luna-state-'));
    const manager = new StateManager({
      dataPath: tempDir,
      autoSave: false
    });

    await manager.addHighScore({ playerName: 'A', score: 100, level: 'level-1' });
    await manager.addHighScore({ playerName: 'B', score: 200, level: 'level-1' });

    const scores = await manager.getHighScores();

    expect(scores).toHaveLength(2);
    expect(scores[0].playerName).toBe('B');
    expect(scores[0].score).toBe(200);
  });
});
