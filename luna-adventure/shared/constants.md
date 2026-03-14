# shared/constants.js

This file is the single source of truth for all game constants, shared between the server and client.

## Why a shared constants file?

- **Consistency**: Both server (authoritative physics) and client (prediction/rendering) use identical values, preventing drift.
- **Maintainability**: Tuning a value (e.g., jump force) requires changing one line instead of hunting through the codebase.
- **Readability**: Named constants (`JUMP_FORCE`, `GRAVITY`) are self-documenting compared to magic numbers.
- **Balancing**: Game designers can adjust feel by editing this file without touching implementation code.

## Key Sections

- **Game dimensions**: Viewport size for rendering
- **Physics constants**: Gravity, friction, terminal velocity, jump force
- **Player constants**: Speed, health, lives, damage invulnerability duration
- **Enemy constants**: Per-type speeds, health, damage, detection and attack ranges
- **Platform constants**: Timing for breaking platforms, bounce multiplier
- **Collectible constants**: Point values per type, respawn timing
- **Power-up constants**: Duration of timed power-ups (double jump, speed boost, etc.)
- **Game states**: Enum for `MENU`, `PLAYING`, `PAUSED`, `GAME_OVER`, `LEVEL_COMPLETE`
- **Network events**: String constants for all Socket.IO event names (avoids typos)
- **Item types**: Enums for collectible and power-up type strings
- **Animation constants**: Frame counts and asset paths

## Usage

```js
// Server (ES Module)
import { GRAVITY, JUMP_FORCE, PLAYER_SPEED } from '../../shared/constants.js';

// Client (ES Module)
import { PLAYER_HEALTH, ENEMY_TYPES, ITEM_TYPES } from '../../shared/constants.js';
```

Constants are used directly in `gameEngine.js` (server physics), `physics.js` (client prediction), and entity classes.
