# Luna's Adventure — Architecture and Implementation

Luna's Adventure is a 2D side-scrolling platformer featuring Luna the Guinea Pig. It uses a server-authoritative multiplayer architecture with SVG-based rendering.

## Architecture Overview

### Server-Authoritative Model

The game server (`server/services/gameEngine.js`) runs the authoritative game loop at 60 FPS using `setInterval`. All physics, collision detection, enemy AI, damage resolution, and projectile movement happen server-side. Clients receive full game state via Socket.IO `game:state` broadcasts and render it locally.

The server entry point (`server/index.mjs`) bridges `gameEngine` EventEmitter events to Socket.IO broadcasts. Events include: `player:join`, `player:leave`, `player:damage`, `player:respawn`, `player:gameover`, `collectible:collected`, `enemy:defeated`, `projectile:fired`.

### Client Rendering

The client uses a layered SVG approach (`SVGRenderer` in `renderer.js`). Layers are stacked in z-order: background → platforms → collectibles → enemies → projectiles → players → UI. SVG elements are created once and repositioned each frame via `transform`, avoiding excessive DOM churn.

The client game loop runs via `requestAnimationFrame` in `game.js`, which reads the latest state received from the server and calls the renderer.

### Entity System

Server-side players and enemies are plain JavaScript objects (not class instances). Client-side entity classes (`Player`, `Enemy`, `Platform`, `Collectible`) manage visual state, animations, and client-side prediction only.

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

## File Reference

| File | Purpose |
|------|---------|
| `server/index.mjs` | Express + Socket.IO entry point |
| `server/services/gameEngine.js` | Authoritative game loop, physics, AI, projectiles |
| `server/services/assetManager.js` | Level JSON loading |
| `server/services/stateManager.js` | SQLite high score persistence |
| `client/scripts/game.js` | Client orchestrator, socket event handling |
| `client/scripts/renderer.js` | Layered SVG renderer |
| `client/scripts/physics.js` | Client-side physics prediction |
| `client/scripts/inputHandler.js` | Keyboard and touch input |
| `client/scripts/entities/player.js` | Player class (visual state, power-ups) |
| `client/scripts/entities/enemy.js` | Enemy class (AI behaviors, attack logic) |
| `client/scripts/entities/platform.js` | Platform class (moving platform logic) |
| `client/scripts/entities/collectible.js` | Collectible class (types, values) |
| `shared/constants.js` | All shared constants (physics, events, dimensions) |
| `graphics/` | All SVG spritesheets and asset files |
| `client/assets/levels/` | Level JSON files (currently: `level-1.json`) |

## Graphics Assets

All SVG assets are in `graphics/`. Spritesheets use horizontal strips where each frame is a fixed width slice. Naming conventions:
- `luna_spritesheet.svg` — player animations
- `enemy_{type}_spritesheet.svg` — per-enemy-type animations
- `platform_{type}_spritesheet.svg` — animated platforms
- `collectible_{type}.svg` — static collectible icons
- `powerup_{type}.svg` — power-up icons
- `projectile_shooter.svg` — shooter enemy projectile
- `background_{name}.svg` — level backgrounds
- `ui_{name}.svg` — HUD elements

## Known Limitations

- Only one level exists (`level-1.json`). Additional levels need to be authored.
- Sound and music systems are not implemented.
- No online leaderboards; high scores are local SQLite only.
- Test coverage is low (~10% statements). Coverage thresholds in `package.json` are set conservatively.
- The client `physics.js` prediction does not fully reconcile with server state on every tick.
