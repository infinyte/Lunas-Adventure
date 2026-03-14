import fs from 'node:fs/promises';
import path from 'node:path';

const highScoresPath = path.resolve('data', 'highscores.json');
await fs.mkdir(path.dirname(highScoresPath), { recursive: true });
await fs.writeFile(highScoresPath, '[]\n', 'utf-8');
console.log('Cleared high scores:', highScoresPath);
