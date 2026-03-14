import fs from 'node:fs/promises';
import path from 'node:path';

const assetsRoot = path.resolve('client', 'assets');
const requiredDirs = ['sprites', 'levels', 'sounds', 'music', 'configs'];

await fs.mkdir(assetsRoot, { recursive: true });

for (const dir of requiredDirs) {
  // eslint-disable-next-line no-await-in-loop
  await fs.mkdir(path.join(assetsRoot, dir), { recursive: true });
}

console.log('Asset directories verified under:', assetsRoot);
