import fs from 'node:fs/promises';
import path from 'node:path';

const dataDir = path.resolve('data');
const highScoresPath = path.join(dataDir, 'highscores.json');

await fs.mkdir(dataDir, { recursive: true });

try {
  await fs.access(highScoresPath);
  console.log('Database already initialized:', highScoresPath);
} catch {
  await fs.writeFile(highScoresPath, '[]\n', 'utf-8');
  console.log('Initialized database file:', highScoresPath);
}
