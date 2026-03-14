import fs from 'node:fs/promises';
import path from 'node:path';

const requiredFiles = [
  'server/index.mjs',
  'server/services/gameEngine.js',
  'server/services/assetManager.js',
  'server/services/stateManager.js',
  'client/index.html',
  'client/scripts/game.js',
  'client/scripts/renderer.js',
  'client/scripts/inputHandler.js',
  'shared/constants.js'
];

const missing = [];
for (const file of requiredFiles) {
  const exists = await fs
    .access(path.resolve(file))
    .then(() => true)
    .catch(() => false);

  if (!exists) {
    missing.push(file);
  }
}

if (missing.length > 0) {
  console.error('Missing required files:');
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log(`Validation passed: ${requiredFiles.length} required files found.`);
