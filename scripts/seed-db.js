import fs from 'node:fs/promises';
import path from 'node:path';

const highScoresPath = path.resolve('data', 'highscores.json');

await fs.mkdir(path.dirname(highScoresPath), { recursive: true });

let scores = [];
try {
  const raw = await fs.readFile(highScoresPath, 'utf-8');
  scores = JSON.parse(raw);
  if (!Array.isArray(scores)) {
    scores = [];
  }
} catch {
  scores = [];
}

if (scores.length === 0) {
  scores.push(
    {
      playerName: 'Luna',
      score: 500,
      level: 'level-1',
      createdAt: new Date().toISOString()
    },
    {
      playerName: 'Pip',
      score: 350,
      level: 'level-1',
      createdAt: new Date().toISOString()
    }
  );

  await fs.writeFile(highScoresPath, `${JSON.stringify(scores, null, 2)}\n`, 'utf-8');
  console.log('Seeded high scores:', highScoresPath);
} else {
  console.log('Seed skipped; high scores already present.');
}
