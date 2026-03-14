# Entity System

The client-side entity system provides four classes that manage visual state, animation, and client-side behavior. Server-side players and enemies are plain JS objects; these classes are used on the client only.

## Classes

### Player (`player.js`)
Represents Luna the Guinea Pig. Responsibilities:
- Stores velocity, position, grounded/jumping state, direction
- Tracks health, lives, score, carrots collected
- Manages visual effects: animation frames, damage flashing (alternating visibility), invulnerability flag
- Power-up system: `doubleJump`, `highJump`, `speedBoost` (timed via `setTimeout`); `health` (+25 HP); `extraLife`
- `takeDamage(amount)`: Sets 1500ms invulnerability window via `setTimeout`, returns `false` if dead
- `getNetworkState()`: Serializes position, velocity, direction, health, and animation state for sync
- `getBoundingBox()`: Returns a slightly smaller box than visual size for forgiving collision feel

### Enemy (`enemy.js`)
Represents adversaries. Types: `basic`, `flying`, `shooter`, `boss`. Responsibilities:
- Per-type default health, damage, attack range, and detection range
- AI: `patrol()` moves back and forth within boundaries; `reactToPlayer()` switches to aggressive behavior when player is in detection range
- `basic`: Chases directly, randomly jumps obstacles
- `flying`: Chases in both axes with easing on Y
- `shooter`: Maintains 150–250px standoff; attack logs the event (projectile creation is server-authoritative)
- `boss`: Steady approach; increases speed below 30% health
- `takeDamage()`: 200ms invulnerability to prevent multi-hit per frame; triggers `die()` at 0 HP
- `getNetworkState()`: Includes position, velocity, direction, health, animation, aggressiveness

### Platform (`platform.js`)
Represents terrain. Types: `ground`, `platform`, `moving`, `breaking`, `bouncy`. Responsibilities:
- `updateMovingPlatform()`: Computes velocity toward waypoint, reverses at boundaries, applies to `x`/`y` each call
- Breaking/bouncy behavior is enforced server-side; the client class tracks visual state

### Collectible (`collectible.js`)
Represents items. Types: `carrot`, `goldenCarrot`, `powerup`, `coin`, `key`, `gem`. Responsibilities:
- Point values by type
- Visual effects: bobbing animation, sparkle, collection animation
- Power-up collectibles trigger `player.activatePowerUp()` when collected

## Index (`index.js`)
Re-exports all four classes for a single import point:
```js
import { Player, Enemy, Platform, Collectible } from './entities/index.js';
```
