import fs from 'node:fs/promises';
import path from 'node:path';

const requiredFiles = [
  'server/index.js',
  'server/services/gameEngine.js',
  'server/services/assetManager.js',
  'server/services/stateManager.js',
  'client/index.html',
  'client/scripts/game.js',
  'client/scripts/renderer.js',
  'client/scripts/inputHandler.js',
  'client/shared/constants.js'
];

const checkExists = (f) => fs.access(path.resolve(f)).then(() => true).catch(() => false);
const existsResults = await Promise.all(requiredFiles.map(checkExists));
const missing = requiredFiles.filter((_, i) => !existsResults[i]);

if (missing.length > 0) {
  console.error('Missing required files:');
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log(`Validation passed: ${requiredFiles.length} required files found.`);
