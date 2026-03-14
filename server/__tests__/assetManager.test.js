import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import AssetManager from '../services/assetManager.js';

describe('AssetManager', () => {
  test('loads levels from configured directory', async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'luna-asset-'));
    const levelsDir = path.join(tempRoot, 'levels');
    const configsDir = path.join(tempRoot, 'configs');
    const spritesDir = path.join(tempRoot, 'sprites');

    await fs.mkdir(levelsDir, { recursive: true });
    await fs.mkdir(configsDir, { recursive: true });
    await fs.mkdir(spritesDir, { recursive: true });

    const level = {
      id: 'level-test',
      name: 'Test Level',
      width: 100,
      height: 100,
      platforms: [],
      collectibles: [],
      enemies: [],
      spawnPoint: { x: 0, y: 0 }
    };

    await fs.writeFile(path.join(levelsDir, 'level-test.json'), JSON.stringify(level), 'utf-8');

    const manager = new AssetManager({
      levelsPath: levelsDir,
      configsPath: configsDir,
      spritesPath: spritesDir
    });

    const levels = await manager.getLevels();
    const fetched = await manager.getLevel('level-test');

    expect(levels).toHaveLength(1);
    expect(fetched.id).toBe('level-test');
  });
});
