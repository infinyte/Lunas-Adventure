import fs from 'node:fs/promises';
import path from 'node:path';

const assetsRoot = path.resolve('client', 'assets');
const graphicsRoot = path.resolve('graphics');
const spritesOut = path.join(assetsRoot, 'sprites');
const requiredDirs = ['sprites', 'levels', 'sounds', 'music', 'configs', 'icons'];

await fs.mkdir(assetsRoot, { recursive: true });

for (const dir of requiredDirs) {
  // eslint-disable-next-line no-await-in-loop
  await fs.mkdir(path.join(assetsRoot, dir), { recursive: true });
}

console.log('Asset directories verified under:', assetsRoot);

// Sync SVG files from graphics/ → client/assets/sprites/
let copied = 0;
let skipped = 0;

try {
  const entries = await fs.readdir(graphicsRoot, { withFileTypes: true });
  const svgEntries = entries.filter((e) => e.isFile() && e.name.endsWith('.svg'));

  await Promise.all(svgEntries.map(async (entry) => {
    const src = path.join(graphicsRoot, entry.name);
    const dest = path.join(spritesOut, entry.name);

    // Only overwrite if source is newer
    const [srcStat, destStat] = await Promise.all([
      fs.stat(src),
      fs.stat(dest).catch(() => null)
    ]);

    if (!destStat || srcStat.mtimeMs > destStat.mtimeMs) {
      await fs.copyFile(src, dest);
      copied++;
    } else {
      skipped++;
    }
  }));

  console.log(`Sprites synced: ${copied} copied, ${skipped} up-to-date (graphics/ → client/assets/sprites/)`);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.log('No graphics/ directory found — skipping sprite sync');
  } else {
    throw err;
  }
}
