import fs from 'node:fs/promises';
import path from 'node:path';

const checks = [
  'server/index.js',
  'client/index.html',
  'client/scripts/game.js',
  'client/shared/constants.js'
];

console.log('Diagnostics');
console.log('Node:', process.version);
console.log('Platform:', process.platform);
console.log('CWD:', process.cwd());

const checkExists = (item) => fs
  .access(path.resolve(item))
  .then(() => true)
  .catch(() => false);

const results = await Promise.all(
  checks.map(async (item) => ({ item, exists: await checkExists(item) }))
);
results.forEach(({ item, exists }) => console.log(`${item}: ${exists ? 'OK' : 'MISSING'}`));
