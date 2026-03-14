# Milestone Board

This checklist tracks implementation progress in actionable phases.

## Completed

### [x] Lock stable baseline build and test gate
- [x] Build exits with code 0
- [x] Test suite passes
- [x] Validate reports required files found

### [x] Add core game orchestration tests
- [x] `client/__tests__/game.orchestration.test.js` — start/pause/resume/socket state tests
- [x] `server/__tests__/gameEngine.test.js`
- [x] `server/__tests__/assetManager.test.js`
- [x] `server/__tests__/stateManager.test.js`
- [x] `client/__tests__/inputHandler.test.js`
- [x] `client/__tests__/physics.test.js`
- [x] 6 suites, 16 tests passing

### [x] Fix moving platform positions never updating
- [x] `platform.js` `updateMovingPlatform()` now applies velocity to `x`/`y`

### [x] Fix bouncy platforms not bouncing
- [x] Server `checkCollisions()` reflects `velocityY` with 1.5× multiplier for `bouncy` type

### [x] Fix breaking platforms not progressing on server
- [x] `updatePlatforms()` implements `stable → breaking → broken → stable` state machine
- [x] `solid === false` guard skips collision while broken

### [x] Implement shooter enemy projectile system end-to-end
- [x] Server `fireProjectile()`, `updateProjectiles()` methods
- [x] `projectile:fired` event forwarded via Socket.IO
- [x] Client renders projectiles from game state as SVG orbs
- [x] Projectile hits deal damage via `playerDamage()`

### [x] Fix player invulnerability never resetting
- [x] Client `Player.takeDamage()` sets 1500ms `setTimeout` to clear flags
- [x] Server `playerDamage()` checks/sets `invulnerableUntil` timestamp
- [x] Respawn grace period (1500ms) added in `playerDeath()`

### [x] Fix level completion detection
- [x] `checkLevelComplete()` checks all carrots + all enemies defeated
- [x] `levelComplete` flag prevents double-trigger
- [x] `carrotsCollected` resets on level load

### [x] Fix enemy melee attack dealing no effective damage
- [x] Server `playerDamage()` invulnerability cooldown prevents per-frame spam

### [x] Graphics remediation
- [x] `projectile_shooter.svg` created
- [x] `enemy_flying_spritesheet.svg` trimmed to correct dimensions
- [x] Duplicate `SPRITE_REQUIREMENTS.md` removed

## Now

### [x] Raise coverage thresholds
- [x] Update `package.json` coverage thresholds: statements 8, branches 5, functions 8, lines 8
- [x] Add targeted tests to cover new gameplay logic (projectiles, platform states, level completion)

## Next

### [x] Add server integration tests for API and socket flows
- [x] `GET /api/levels` and `GET /api/highscores` via supertest
- [x] At least one socket flow test (`player:move` → `game:state`)

### [x] Author additional levels
- [x] level-2.json (Forest)
- [x] level-3.json (Cave)
- [x] level-4.json (Final)

### [x] Implement sound and music system
- [x] `SoundManager` class for effects and music
- [x] Hook into game events (jump, collect, damage, level complete)

## Later

### [ ] Add CI pipeline
- [ ] `npm ci` → `npm run build` → `npm test` → `npm run validate`

### [ ] Container deployment readiness
- [ ] Finalize `Dockerfile` and `docker-compose.yml`
- [ ] Verify socket connectivity in containerized environment

### [ ] Online leaderboards
- [ ] Replace SQLite-only high scores with server-side API
