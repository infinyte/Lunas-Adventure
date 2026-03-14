# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Luna's Adventure is a 2D side-scrolling platformer featuring Luna the Guinea Pig, built with Node.js + Express + Socket.IO on the server and vanilla JavaScript with SVG rendering on the client. It supports multiplayer via WebSockets and is a Progressive Web App (PWA) with offline support.

## Commands

```bash
# Development (runs server + client with hot-reload concurrently)
npm run dev

# Server only (with nodemon)
npm run server:dev

# Client only (light-server on port 8080)
npm run client:dev

# Run all tests with coverage
npm test

# Run server tests only
npm run server:test

# Run client tests only
npm run client:test

# Lint
npm run lint
npm run lint:fix

# Initialize local SQLite database
npm run db:init

# Rebuild SVG assets
npm run build:assets

# Validate all game files are present
npm run validate
```

**Important**: Run `HUSKY=0 npm install` instead of plain `npm install`. The `.git` directory is one level above `luna-adventure/` (at `C:\work\Lunas-Adventure\`), which causes the husky `prepare` hook to fail.

**Environment variables** (`.env` file at project root):
```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ENABLE_MULTIPLAYER=true
```

## Architecture

The project uses ES Modules (`"type": "module"` in package.json). Jest uses `babel.config.cjs` (CJS required because the package is ESM) with `@babel/preset-env` to transpile for tests.

### Server (`server/`)
- **`server/index.mjs`** — Entry point. Initializes Express, Socket.IO, and three services. Handles Socket.IO events for `player:move`, `player:jump`, `player:damage`, `player:death`, `collectible:collected`, `enemy:defeated`, `game:start`, and `disconnect`. Forwards all `gameEngine` EventEmitter events to clients.
- **`server/services/gameEngine.js`** — Extends `EventEmitter`. Owns the authoritative game loop (60fps via `setInterval`), physics calculations, collision detection, enemy AI, projectile system, platform state machines, and emits game events. Starts/stops automatically as players connect/disconnect. Players and enemies are plain JS objects (not class instances).
- **`server/services/stateManager.js`** — Manages persistent state (high scores) via SQLite.
- **`server/services/assetManager.js`** — Handles level JSON loading and serving.

### Client (`client/scripts/`)
- **`game.js`** — Central orchestrator. Initializes all subsystems, runs the client-side game loop (`requestAnimationFrame`), manages game state (players, enemies, platforms, collectibles, projectiles as `Map`s), handles Socket.IO events, and drives level completion logic.
- **`renderer.js`** — `SVGRenderer` class. Creates a layered SVG (background → platforms → collectibles → enemies → projectiles → players → ui). Renders all entities as SVG elements; updates positions without re-creating elements where possible.
- **`physics.js`** — Client-side `Physics` class for client-side prediction. Applies gravity, friction, terminal velocity, and AABB collision detection.
- **`inputHandler.js`** — Captures keyboard and mobile touch input, dispatches actions to the game.
- **`entities/`** — Four entity classes: `Player`, `Enemy`, `Platform`, `Collectible`. Each has state, update logic, serialization for networking, and collision properties. All exported from `entities/index.js`.

### Shared (`shared/`)
- **`shared/constants.js`** — Single source of truth for all game constants (physics values, entity dimensions, collectible types/values, power-up durations, network event names, game states). Imported by both server and client.

### Graphics (`graphics/`)
All SVG sprites and spritesheets live here (not in `client/assets/sprites/`). Naming convention: `{entity}_{type}_spritesheet.svg` for animated sprites, flat SVGs for collectibles/UI/effects.

### Multiplayer Model
The server runs the authoritative game loop and broadcasts `game:state` after every relevant Socket.IO event. Clients receive full state and render from it. The `gameEngine` emits named events (`player:damage`, `collectible:collected`, `enemy:defeated`, `projectile:fired`, etc.) that `server/index.mjs` forwards to all clients via Socket.IO.

### Key Game Systems (Server-side)
- **Invulnerability**: Players have `invulnerableUntil: 0` (timestamp). `playerDamage()` checks `Date.now() < player.invulnerableUntil` before dealing damage; sets a 1500ms window after each hit and after respawn.
- **Projectiles**: `this.projectiles` array in `GameEngine`. `fireProjectile()` creates orbs with velocity toward target; `updateProjectiles()` moves, ages, and collision-checks each tick. Rendered by client from game state.
- **Breaking platforms**: `stable → breaking → broken → stable` state machine in `updatePlatforms()`. `solid` flag controls whether collision is checked.
- **Bouncy platforms**: Detected in `checkCollisions()` by `platform.type === 'bouncy'`; applies `velocityY = -Math.abs(velocityY) * 1.5`.
- **Moving platforms**: `platform.js` `updateMovingPlatform()` computes velocity and applies it to `x`/`y` each frame.
- **Level completion**: `checkLevelComplete()` in `game.js` — guarded by `levelComplete` flag; triggers when `carrotsCollected >= totalCarrots` AND `enemies.size === 0`.

## Testing

Jest is configured in `package.json` with coverage thresholds. Separate configs exist for server (`server/jest.config.cjs`) and client (`client/jest.config.cjs`). Currently: **6 test suites, 16 tests**.

Test files:
- `server/__tests__/gameEngine.test.js`
- `server/__tests__/assetManager.test.js`
- `server/__tests__/stateManager.test.js`
- `client/__tests__/game.orchestration.test.js`
- `client/__tests__/inputHandler.test.js`
- `client/__tests__/physics.test.js`
