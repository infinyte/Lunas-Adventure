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

**Environment variables** (`.env` file at project root):
```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
ENABLE_MULTIPLAYER=true
```

## Architecture

The project uses ES Modules (`"type": "module"` in package.json).

### Server (`server/`)
- **`server/index.mjs`** — Entry point. Initializes Express, Socket.IO, and three services. Handles Socket.IO events for `player:move`, `player:jump`, `game:start`, and `disconnect`, broadcasting updated game state to all clients after each event.
- **`server/services/gameEngine.js`** — Extends `EventEmitter`. Owns the authoritative game loop (60fps via `setInterval`), physics calculations, collision detection, enemy AI, and emits game events. Starts/stops automatically as players connect/disconnect.
- **`server/services/stateManager.js`** — Manages persistent state (high scores).
- **`server/services/assetManager.js`** — Handles level asset loading and serving.

### Client (`client/scripts/`)
- **`game.js`** — Central orchestrator. Initializes all subsystems, runs the client-side game loop (`requestAnimationFrame`), manages game state (players, enemies, platforms, collectibles as `Map`s), and communicates with the server via Socket.IO.
- **`renderer.js`** — `SVGRenderer` class. Creates a layered SVG (background → platforms → collectibles → enemies → players → ui). Renders all entities as SVG elements; updates positions without re-creating elements.
- **`physics.js`** — Client-side `Physics` class for client-side prediction. Applies gravity, friction, terminal velocity, and AABB collision detection.
- **`inputHandler.js`** — Captures keyboard and mobile touch input, dispatches actions to the game.
- **`entities/`** — Four entity classes: `Player`, `Enemy`, `Platform`, `Collectible`. Each has state, update logic, serialization for networking, and collision properties. All exported from `entities/index.js`.

### Shared (`shared/`)
- **`shared/constants.js`** — Single source of truth for all game constants (physics values, entity dimensions, collectible types/values, power-up durations, network event names, game states). Imported by both server and client.

### Multiplayer Model
The server runs the authoritative game loop and broadcasts `game:state` after every relevant Socket.IO event. The client implements **client-side prediction** and **server reconciliation** (controlled by `CLIENT_PREDICTION` and `SERVER_RECONCILIATION` constants). Network events are defined in `NETWORK_EVENTS` in `shared/constants.js`.

## Known Issues / Quirks

- `server/index.mjs` has a stray `module.exports = server` at the bottom (leftover from CommonJS migration) — this is a no-op in ES module context but should be removed.
- `server/services/gameEngine.js` mixes `require()` at the top with `export default` at the bottom — the file needs to be fully converted to ES modules to match the rest of the project.
- `package.json` lists `"main": "server/index.js"` but the actual entry file is `server/index.mjs`.

## Testing

Jest is configured in `package.json` with coverage thresholds: 70% statements/functions/lines, 60% branches. The `testEnvironment` is `node`. Babel is used to transpile for Jest via `babel-jest`.
