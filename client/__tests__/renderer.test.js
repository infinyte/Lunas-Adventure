/**
 * @jest-environment jsdom
 */

import SVGRenderer from '../scripts/renderer.js';

const LAYERS = ['background', 'platforms', 'doors', 'collectibles', 'enemies', 'projectiles', 'players', 'ui'];

function makeContainer() {
  const div = document.createElement('div');
  div.setAttribute('id', 'game-container');
  document.body.appendChild(div);
  return div;
}

function cleanupContainer() {
  const el = document.getElementById('game-container');
  if (el) el.remove();
}

describe('SVGRenderer', () => {
  let renderer;

  beforeEach(() => {
    makeContainer();
    renderer = new SVGRenderer('game-container', 1000, 600);
  });

  afterEach(() => {
    cleanupContainer();
  });

  // ── Construction ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    test('appends an SVG element to the container', () => {
      const svg = document.getElementById('game-svg');
      expect(svg).not.toBeNull();
      expect(svg.tagName.toLowerCase()).toBe('svg');
    });

    test('sets width and height on the SVG', () => {
      const svg = document.getElementById('game-svg');
      expect(svg.getAttribute('width')).toBe('1000');
      expect(svg.getAttribute('height')).toBe('600');
    });

    test('creates all required layers', () => {
      LAYERS.forEach((name) => {
        const layer = document.getElementById(`layer-${name}`);
        expect(layer).not.toBeNull();
        expect(layer.tagName.toLowerCase()).toBe('g');
      });
    });
  });

  // ── clearLayer ─────────────────────────────────────────────────────────────

  describe('clearLayer', () => {
    test('removes all children from the specified layer', () => {
      const layer = document.getElementById('layer-ui');
      const child = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      layer.appendChild(child);
      expect(layer.childElementCount).toBeGreaterThan(0);

      renderer.clearLayer('ui');
      expect(layer.childElementCount).toBe(0);
    });

    test('is a no-op for an empty layer', () => {
      expect(() => renderer.clearLayer('ui')).not.toThrow();
    });
  });

  // ── clearAllLayers ─────────────────────────────────────────────────────────

  describe('clearAllLayers', () => {
    test('empties the entities map', () => {
      // Render something to populate entities
      renderer.renderProjectile({ id: 'p1', x: 10, y: 20 });
      expect(renderer.entities.size).toBeGreaterThan(0);

      renderer.clearAllLayers();
      expect(renderer.entities.size).toBe(0);
    });

    test('removes children from all layers', () => {
      ['platforms', 'collectibles', 'enemies', 'players', 'ui'].forEach((name) => {
        const layer = document.getElementById(`layer-${name}`);
        const child = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        layer.appendChild(child);
      });

      renderer.clearAllLayers();

      ['platforms', 'collectibles', 'enemies', 'players', 'ui'].forEach((name) => {
        const layer = document.getElementById(`layer-${name}`);
        expect(layer.childElementCount).toBe(0);
      });
    });
  });

  // ── renderUI ───────────────────────────────────────────────────────────────

  describe('renderUI', () => {
    test('creates a game-ui group in the ui layer', () => {
      renderer.renderUI({
        score: 0, lives: 3, health: 100, carrotsCollected: 0, totalCarrots: 5
      });
      const ui = document.getElementById('game-ui');
      expect(ui).not.toBeNull();
    });

    test('displays the correct score', () => {
      renderer.renderUI({
        score: 450, lives: 3, health: 100, carrotsCollected: 0, totalCarrots: 5
      });
      const ui = document.getElementById('game-ui');
      const texts = Array.from(ui.querySelectorAll('text'));
      const scoreText = texts.find((t) => t.textContent.includes('Score:'));
      expect(scoreText).toBeDefined();
      expect(scoreText.textContent).toBe('Score: 450');
    });

    test('renders one heart per life', () => {
      renderer.renderUI({
        score: 0, lives: 3, health: 100, carrotsCollected: 0, totalCarrots: 0
      });
      const ui = document.getElementById('game-ui');
      const hearts = ui.querySelectorAll('path[fill="#FF0000"]');
      expect(hearts.length).toBe(3);
    });

    test('renders zero hearts when lives is 0', () => {
      renderer.renderUI({
        score: 0, lives: 0, health: 100, carrotsCollected: 0, totalCarrots: 0
      });
      const ui = document.getElementById('game-ui');
      const hearts = ui.querySelectorAll('path[fill="#FF0000"]');
      expect(hearts.length).toBe(0);
    });

    test('renders health bar with correct width', () => {
      renderer.renderUI({
        score: 0, lives: 3, health: 60, carrotsCollected: 0, totalCarrots: 0
      });
      const ui = document.getElementById('game-ui');
      // The health bar width = health * 2
      const rects = Array.from(ui.querySelectorAll('rect'));
      const healthBar = rects.find((r) => r.getAttribute('width') === '120');
      expect(healthBar).toBeDefined();
    });

    test('displays carrot counter text', () => {
      renderer.renderUI({
        score: 0, lives: 3, health: 100, carrotsCollected: 3, totalCarrots: 7
      });
      const ui = document.getElementById('game-ui');
      const texts = Array.from(ui.querySelectorAll('text'));
      const carrotText = texts.find((t) => t.textContent.includes('Carrots:'));
      expect(carrotText).toBeDefined();
      expect(carrotText.textContent).toBe('Carrots: 3 / 7');
    });

    test('clears the ui layer before each render', () => {
      renderer.renderUI({
        score: 0, lives: 3, health: 100, carrotsCollected: 0, totalCarrots: 0
      });
      renderer.renderUI({
        score: 999, lives: 1, health: 50, carrotsCollected: 2, totalCarrots: 5
      });
      // Only one game-ui element should exist
      const uis = document.querySelectorAll('#game-ui');
      expect(uis.length).toBe(1);
      // Score should reflect the second call
      const scoreText = Array.from(uis[0].querySelectorAll('text'))
        .find((t) => t.textContent.includes('Score:'));
      expect(scoreText.textContent).toBe('Score: 999');
    });
  });

  // ── renderPlatform ─────────────────────────────────────────────────────────

  describe('renderPlatform', () => {
    const groundPlatform = {
      id: 'plat-1', x: 0, y: 500, width: 800, height: 50, type: 'ground'
    };

    test('creates a platform element in the platforms layer', () => {
      renderer.renderPlatform(groundPlatform);
      const el = document.getElementById('entity-plat-1');
      expect(el).not.toBeNull();
    });

    test('sets x/y/width/height attributes on the platform rect', () => {
      renderer.renderPlatform(groundPlatform);
      const el = document.getElementById('entity-plat-1');
      expect(el.getAttribute('x')).toBe('0');
      expect(el.getAttribute('y')).toBe('500');
      expect(el.getAttribute('width')).toBe('800');
      expect(el.getAttribute('height')).toBe('50');
    });

    test('calling twice does not create a duplicate element', () => {
      renderer.renderPlatform(groundPlatform);
      renderer.renderPlatform({ ...groundPlatform, x: 100 });
      const els = document.querySelectorAll('#entity-plat-1');
      expect(els.length).toBe(1);
    });

    test('updates x/y on subsequent calls', () => {
      renderer.renderPlatform(groundPlatform);
      renderer.renderPlatform({ ...groundPlatform, x: 200, y: 300 });
      const el = document.getElementById('entity-plat-1');
      expect(el.getAttribute('x')).toBe('200');
      expect(el.getAttribute('y')).toBe('300');
    });
  });

  // ── renderCollectible ──────────────────────────────────────────────────────

  describe('renderCollectible', () => {
    const carrot = {
      id: 'carrot-1', x: 100, y: 200, width: 30, height: 30, type: 'carrot', collected: false
    };

    test('creates a collectible element for an uncollected carrot', () => {
      renderer.renderCollectible(carrot);
      const el = document.getElementById('entity-carrot-1');
      expect(el).not.toBeNull();
    });

    test('removes element when collectible is collected', () => {
      renderer.renderCollectible(carrot);
      expect(document.getElementById('entity-carrot-1')).not.toBeNull();

      renderer.renderCollectible({ ...carrot, collected: true });
      expect(document.getElementById('entity-carrot-1')).toBeNull();
    });

    test('sets transform position on the element', () => {
      renderer.renderCollectible(carrot);
      const el = document.getElementById('entity-carrot-1');
      const transform = el.getAttribute('transform');
      expect(transform).toContain('100');
      expect(transform).toContain('200');
    });
  });

  // ── renderEnemy ────────────────────────────────────────────────────────────

  describe('renderEnemy', () => {
    const basicEnemy = {
      id: 'enemy-1',
      x: 200,
      y: 400,
      width: 40,
      height: 40,
      type: 'basic',
      direction: 'right',
      velocityX: 1,
      velocityY: 0
    };

    const bossEnemy = {
      id: 'boss-1',
      x: 500,
      y: 300,
      width: 80,
      height: 80,
      type: 'boss',
      direction: 'right',
      health: 75,
      maxHealth: 100,
      velocityX: 1.5,
      velocityY: 0
    };

    test('creates a basic enemy element in the enemies layer', () => {
      renderer.renderEnemy(basicEnemy);
      const el = document.getElementById('entity-enemy-1');
      expect(el).not.toBeNull();
    });

    test('does not duplicate element on repeated renders', () => {
      renderer.renderEnemy(basicEnemy);
      renderer.renderEnemy(basicEnemy);
      const els = document.querySelectorAll('#entity-enemy-1');
      expect(els.length).toBe(1);
    });

    test('applies transform for right-facing enemy', () => {
      renderer.renderEnemy(basicEnemy);
      const el = document.getElementById('entity-enemy-1');
      const transform = el.getAttribute('transform');
      expect(transform).toContain('200');
      expect(transform).toContain('400');
      expect(transform).not.toContain('scale(-1');
    });

    test('applies mirrored transform for left-facing enemy', () => {
      renderer.renderEnemy({ ...basicEnemy, direction: 'left' });
      const el = document.getElementById('entity-enemy-1');
      const transform = el.getAttribute('transform');
      expect(transform).toContain('scale(-1');
    });

    test('creates a boss enemy element', () => {
      renderer.renderEnemy(bossEnemy);
      const el = document.getElementById('entity-boss-1');
      expect(el).not.toBeNull();
    });

    test('creates a boss health bar as a sibling element', () => {
      renderer.renderEnemy(bossEnemy);
      const hpBar = document.getElementById('boss-hp-boss-1');
      expect(hpBar).not.toBeNull();
    });

    test('boss health bar width reflects current health', () => {
      // 75 / 100 = 75% of 80px = 60px
      renderer.renderEnemy(bossEnemy);
      const hpBar = document.getElementById('boss-hp-boss-1');
      const bar = hpBar.querySelector('.boss-hp-bar');
      expect(bar).not.toBeNull();
      expect(parseFloat(bar.getAttribute('width'))).toBeCloseTo(60);
    });

    test('boss health bar width is 0 at 0 health', () => {
      renderer.renderEnemy({ ...bossEnemy, health: 0 });
      const hpBar = document.getElementById('boss-hp-boss-1');
      const bar = hpBar.querySelector('.boss-hp-bar');
      expect(parseFloat(bar.getAttribute('width'))).toBe(0);
    });
  });

  // ── renderProjectile ───────────────────────────────────────────────────────

  describe('renderProjectile', () => {
    const proj = { id: 'proj-1', x: 50, y: 100 };

    test('creates a projectile element in the projectiles layer', () => {
      renderer.renderProjectile(proj);
      const el = document.getElementById('proj-proj-1');
      expect(el).not.toBeNull();
    });

    test('positions projectile via transform', () => {
      renderer.renderProjectile(proj);
      const el = document.getElementById('proj-proj-1');
      expect(el.getAttribute('transform')).toContain('50');
      expect(el.getAttribute('transform')).toContain('100');
    });

    test('updates position on subsequent calls', () => {
      renderer.renderProjectile(proj);
      renderer.renderProjectile({ ...proj, x: 80, y: 120 });
      const el = document.getElementById('proj-proj-1');
      expect(el.getAttribute('transform')).toContain('80');
      expect(el.getAttribute('transform')).toContain('120');
    });

    test('does not create a duplicate element on repeated renders', () => {
      renderer.renderProjectile(proj);
      renderer.renderProjectile(proj);
      const els = document.querySelectorAll('#proj-proj-1');
      expect(els.length).toBe(1);
    });
  });
});
