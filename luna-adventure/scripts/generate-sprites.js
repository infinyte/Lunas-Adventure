import fs from 'node:fs/promises';
import path from 'node:path';

const generatedDir = path.resolve('client', 'assets', 'sprites', 'generated');
await fs.mkdir(generatedDir, { recursive: true });

const markerFile = path.join(generatedDir, 'README.txt');
await fs.writeFile(
  markerFile,
  'Generated sprites output directory. Replace with atlas generation pipeline output.\n',
  'utf-8'
);

console.log('Sprite generation placeholder completed:', generatedDir);
