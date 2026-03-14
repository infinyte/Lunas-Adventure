# Luna's Adventure — Architecture and Implementation

Luna's Adventure is a 2D side-scrolling platformer featuring Luna the Guinea Pig. It uses a server-authoritative multiplayer architecture with SVG-based rendering.

## Architecture Overview

### Server-Authoritative Model

The game server (`server/services/gameEngine.js`) runs the authoritative game loop at 60 FPS using `setInterval`. All physics, collision detection, enemy AI, damage resolution, and projectile movement happen server-side. Clients receive full game state via Socket.IO `game:state` broadcasts and render it locally.

The server entry point (`server/index.js`) is composed via `server/appFactory.js`, which wires Express middleware (helmet, CORS, compression, rate-limiting), static file serving, REST endpoints (`/api/levels`, `/api/highscores`), and Socket.IO. `server/index.js` bridges `gameEngine` EventEmitter events to Socket.IO broadcasts. Events include: `player:join`, `player:leave`, `player:damage`, `player:respawn`, `player:gameover`, `collectible:collected`, `enemy:defeated`, `projectile:fired`.

### Client Rendering

The client uses a layered SVG approach (`SVGRenderer` in `renderer.js`). Layers are stacked in z-order: background → platforms → collectibles → enemies → projectiles → players → UI. SVG elements are created once and repositioned each frame via `transform`, avoiding excessive DOM churn. Luna's sprite is built procedurally via `createLunaSVG`; the standalone sprite files (`luna_idle.svg`, `luna_run.svg`, `luna_jump.svg`) are used only by the PWA service worker cache.

The client game loop runs via `requestAnimationFrame` in `game.js`, which reads the latest state received from the server and calls the renderer.

### Entity System

Server-side players and enemies are plain JavaScript objects (not class instances). Client-side entity classes (`Player`, `Enemy`, `Platform`, `Collectible`) manage visual state, animations, and client-side prediction only. All are re-exported from `client/scripts/entities/index.js`.

### Shared Constants

`client/shared/constants.js` is the single source of truth for physics values, entity dimensions, collectible types/values, power-up durations, network event names, and game state strings. It is imported by both server and client. The `client/shared/` directory is symlinked so the same file is accessible at the URL path `/shared/constants.js` when served by light-server.

## Implemented Systems

### Platform Types
- **ground / standard**: Static, solid collision surfaces
- **moving**: Position updated each frame by velocity; reverses at patrol boundaries
- **breaking**: State machine: `stable → breaking (0.5s) → broken (3s respawn) → stable`; non-solid while broken
- **bouncy**: On player landing, reflects `velocityY` with 1.5× multiplier

### Enemy Types
All enemies patrol when idle and react when the player enters detection range:
- **basic** (detection: 150px): Chases directly, jumps to overcome obstacles
- **flying** (detection: 200px): Chases in both axes; adjusts Y with easing
- **shooter** (detection: 350px): Maintains 150–250px standoff distance; fires projectiles every 2 seconds
- **boss** (detection: 400px): Steady approach; becomes more aggressive below 30% health

### Projectile System
Shooter enemies fire server-authoritative projectiles via `fireProjectile()`. Each projectile has a velocity vector toward the target, 3-second lifetime, and is removed on player hit or boundary exit. The client syncs projectiles from game state and renders them as SVG orbs.

### Damage and Invulnerability
Server players have `invulnerableUntil` (timestamp). `playerDamage()` checks `Date.now() < player.invulnerableUntil` before dealing damage, then sets a 1500ms immunity window. A matching grace period applies on respawn.

### Level Completion
`checkLevelComplete()` in `game.js` fires after every carrot collection and enemy defeat. It checks `carrotsCollected >= totalCarrots` AND `enemies.size === 0`. A `levelComplete` flag prevents double-triggering.

### Power-Up System
Power-ups activate via `Player.activatePowerUp(type, duration)`. Supported types: `doubleJump`, `highJump`, `speedBoost` (timed), `health` (+25 HP), `extraLife`.

### Sound System
`SoundManager` (`client/scripts/soundManager.js`) wraps the Web Audio API. It registers default effect and music paths on construction and degrades gracefully to a no-op when `Audio` is unavailable (e.g., in Node test environments). Supports independent volume control for effects and music.

## File Reference

| File | Purpose |
|------|---------|
| `server/index.js` | Express + Socket.IO entry point |
| `server/appFactory.js` | Middleware, routes, and Socket.IO factory |
| `server/services/gameEngine.js` | Authoritative game loop, physics, AI, projectiles |
| `server/services/assetManager.js` | Level JSON loading |
| `server/services/stateManager.js` | SQLite high score persistence |
| `client/scripts/game.js` | Client orchestrator, socket event handling |
| `client/scripts/renderer.js` | Layered SVG renderer |
| `client/scripts/physics.js` | Client-side physics prediction |
| `client/scripts/inputHandler.js` | Keyboard and touch input |
| `client/scripts/soundManager.js` | Web Audio API wrapper (SFX + music) |
| `client/scripts/entities/player.js` | Player class (visual state, power-ups) |
| `client/scripts/entities/enemy.js` | Enemy class (AI behaviors, attack logic) |
| `client/scripts/entities/platform.js` | Platform class (moving platform logic) |
| `client/scripts/entities/collectible.js` | Collectible class (types, values) |
| `client/shared/constants.js` | All shared constants (physics, events, dimensions) |
| `graphics/` | SVG sprite source files and spritesheets |
| `client/assets/levels/` | Level JSON files (level-1 through level-4) |
| `client/assets/sprites/` | Luna sprite placeholders (idle, run, jump) |

## Graphics Assets

All SVG source assets are in `graphics/`. Built/optimized outputs go to `client/assets/sprites/` and `dist/` via `npm run build:assets`. Naming conventions:
- `luna_spritesheet.svg` — player animations
- `enemy_{type}_spritesheet.svg` — per-enemy-type animations
- `platform_{type}_spritesheet.svg` — animated platforms
- `collectible_{type}.svg` — static collectible icons
- `powerup_{type}.svg` — power-up icons
- `projectile_shooter.svg` — shooter enemy projectile
- `background_{name}.svg` — level backgrounds
- `ui_{name}.svg` — HUD elements

## Testing

10 test suites, 32 tests, run via `npm test` (Jest + Babel). Coverage is ~19% statements overall; thresholds in `package.json` are set conservatively. Key gaps: `renderer.js` (DOM-dependent, needs jsdom), `collectible.js`, `platform.js`.

CI runs on every push and pull request to `main` via `.github/workflows/ci.yml` (Node 20, ubuntu-latest): `npm ci` → `npm run build` → `npm test` → `npm run validate`.

## Known Limitations

- The client `physics.js` prediction does not fully reconcile with server state on every tick.
- Test coverage for DOM-dependent code (`renderer.js`, browser-side entity rendering) requires a jsdom environment and is not yet set up.
- High scores are local SQLite only; no online leaderboards.
