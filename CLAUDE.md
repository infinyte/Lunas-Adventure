# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> The authoritative copy of this file is at the project root (`CLAUDE.md`). This copy in `docs/` is kept for reference.

## Commands

```bash
# Development — single Express server on port 3000 (serves static client + API + Socket.IO)
npm run dev

# Alias for npm run dev (same nodemon invocation)
npm run server:dev

# Legacy: light-server on port 8080 proxying to port 3000 (no longer needed)
# npm run client:dev

# Run all tests with coverage
npm test

# Run server tests only
npm run server:test

# Run client tests only
npm run client:test

# Run a single test file
npx jest path/to/test.file.test.js

# Lint / auto-fix
npm run lint
npm run lint:fix

# Initialize local SQLite database
npm run db:init

# Rebuild optimized SVG assets
npm run build:assets

# Validate all required game files are present
npm run validate
```

**Install caveat**: Use `HUSKY=0 npm install` instead of plain `npm install`. The `.git` directory sits one level above the project root, which causes the husky `prepare` hook to fail.

**Environment variables** (`.env` at project root):
```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ENABLE_MULTIPLAYER=true
```

## Architecture

The project uses ES Modules (`"type": "module"` in `package.json`). Jest uses `babel.config.cjs` (must be CJS because the package is ESM) with `@babel/preset-env` to transpile tests.

### Server (`server/`)

- **`server/index.js`** — Entry point. Creates the Express + Socket.IO server via `appFactory.js`. Registers Socket.IO event handlers for `player:move`, `player:jump`, `player:damage`, `player:death`, `collectible:collected`, `enemy:defeated`, `game:start`, and `disconnect`. Forwards all `gameEngine` EventEmitter events to clients.
- **`server/appFactory.js`** — Factory that wires Express middleware (helmet, cors, compression, rate-limit), static file serving, REST endpoints (`/api/levels`, `/api/highscores`), and Socket.IO.
- **`server/services/gameEngine.js`** — Extends `EventEmitter`. Owns the authoritative 60 fps game loop (`setInterval(1000/60)`), physics, AABB collision detection, enemy AI, projectile system, and platform state machines. Players and enemies are plain JS objects. Auto-starts/stops as players connect/disconnect.
- **`server/services/stateManager.js`** — Persists high scores via SQLite.
- **`server/services/assetManager.js`** — Loads and serves level JSON files.

### Client (`client/scripts/`)

- **`game.js`** — Central orchestrator. Initializes all subsystems, runs the `requestAnimationFrame` loop, manages game state (`Map`s for players, enemies, platforms, collectibles, projectiles), handles Socket.IO events, and drives level completion logic.
- **`renderer.js`** — `SVGRenderer` class. Builds a layered SVG (background → platforms → collectibles → enemies → projectiles → players → ui). Updates element positions in-place rather than recreating them.
- **`physics.js`** — Client-side `Physics` class for prediction: gravity, friction, terminal velocity, AABB collision.
- **`inputHandler.js`** — Captures keyboard and mobile touch input, dispatches to the game loop.
- **`soundManager.js`** — Web Audio API wrapper for SFX and music tracks. Degrades to a no-op in non-browser environments.
- **`entities/`** — `Player`, `Enemy`, `Platform`, `Collectible` classes with state, update logic, and serialization. All re-exported from `entities/index.js`.

### Shared (`client/shared/`)

- **`client/shared/constants.js`** — Single source of truth for physics values, entity dimensions, collectible types/values, power-up durations, network event names, and game state strings. Imported by both server and client. When served by light-server the URL path is `/shared/constants.js`.

### Graphics (`graphics/`)

SVG sprites and spritesheets live here (not in `client/assets/sprites/`). Naming convention: `{entity}_{type}_spritesheet.svg` for animated sprites, flat SVGs for collectibles/UI/effects.

### Multiplayer Model

The server runs the authoritative game loop and broadcasts `game:state` after every relevant event. Clients receive full state and render from it. `gameEngine` emits named events (`player:damage`, `collectible:collected`, `enemy:defeated`, `projectile:fired`, etc.) that `server/index.js` forwards to all connected clients via Socket.IO.

### Key Game Systems (server-side)

- **Invulnerability**: `player.invulnerableUntil` timestamp; `playerDamage()` skips damage if `Date.now() < invulnerableUntil` and sets a 1500 ms window after each hit or respawn.
- **Projectiles**: `this.projectiles` array in `GameEngine`. `fireProjectile(source, targetX, targetY)` creates velocity-driven orbs; `updateProjectiles()` moves, ages, and collision-checks each tick.
- **Breaking platforms**: `stable → breaking → broken → stable` state machine in `updatePlatforms()`. The `solid` flag gates collision checks.
- **Bouncy platforms**: Detected in `checkCollisions()` by `platform.type === 'bouncy'`; reflects `velocityY = -Math.abs(velocityY) * 1.5`.
- **Moving platforms**: `updateMovingPlatform()` computes velocity and applies it to `x`/`y` each frame.
- **Level completion**: `checkLevelComplete()` in `game.js` — guarded by a `levelComplete` flag; triggers when `carrotsCollected >= totalCarrots` AND `enemies.size === 0`.

## Testing

Jest is configured in `package.json` with low coverage thresholds (8/5/8/8). Separate per-directory configs exist at `server/jest.config.cjs` and `client/jest.config.cjs`. `jest.setup.cjs` silences `console.log` globally during tests.

Test files (10 suites, 32 tests):
- `server/__tests__/gameEngine.test.js` — enemy defeat, collectible collection, platform state transitions, projectile damage
- `server/__tests__/assetManager.test.js`
- `server/__tests__/stateManager.test.js`
- `server/__tests__/server.integration.test.js`
- `client/__tests__/physics.test.js` — `updateEntity`, terminal velocity, AABB detection
- `client/__tests__/inputHandler.test.js`
- `client/__tests__/game.orchestration.test.js`
- `client/__tests__/game.gameplay.test.js` — level completion, scoring, enemy/collectible interaction
- `client/__tests__/enemy.behavior.test.js` — patrol/chase/attack state machines
- `client/__tests__/soundManager.test.js`
