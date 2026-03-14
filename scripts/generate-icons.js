// scripts/generate-icons.js
// Generates all PWA icon PNG assets from client/assets/favicon.svg using sharp.
// Run via: npm run build:icons

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const svgPath = path.join(rootDir, 'client', 'assets', 'favicon.svg');
const outDir = path.join(rootDir, 'client', 'assets', 'icons');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Maskable icon: icon occupies the inner 72% (safe zone), background fills padding
const MASKABLE_SIZE = 196;
const MASKABLE_INNER = Math.round(MASKABLE_SIZE * 0.72);
const MASKABLE_PAD = Math.round((MASKABLE_SIZE - MASKABLE_INNER) / 2);
// Background colour matches the favicon's outer rect fill (#8B4513)
const MASKABLE_BG = { r: 139, g: 69, b: 19, alpha: 1 };

async function generateIcons() {
  fs.mkdirSync(outDir, { recursive: true });

  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of SIZES) {
    const dest = path.join(outDir, `icon-${size}x${size}.png`);
    await sharp(svgBuffer).resize(size, size).png().toFile(dest);
    console.log(`  icon-${size}x${size}.png`);
  }

  // Maskable icon with safe-zone padding
  const maskableDest = path.join(outDir, 'maskable-icon.png');
  await sharp(svgBuffer)
    .resize(MASKABLE_INNER, MASKABLE_INNER)
    .extend({
      top: MASKABLE_PAD,
      bottom: MASKABLE_PAD,
      left: MASKABLE_PAD,
      right: MASKABLE_PAD,
      background: MASKABLE_BG
    })
    .png()
    .toFile(maskableDest);
  console.log(`  maskable-icon.png (${MASKABLE_SIZE}x${MASKABLE_SIZE})`);

  console.log(`\nAll icons written to ${path.relative(rootDir, outDir)}`);
}

generateIcons().catch((err) => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
