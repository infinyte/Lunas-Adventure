# Luna's Adventure

A 2D side-scrolling platformer featuring Luna the Guinea Pig, built with Node.js and SVG graphics.

## Overview

Luna's Adventure is a platformer where you guide Luna the Guinea Pig through levels, collecting carrots, avoiding enemies, and finding your way home. The game features:

- SVG-based graphics and animations (no canvas/WebGL)
- Keyboard and mobile touch controls
- Multiple platform types: ground, standard, moving, breaking, and bouncy
- Four enemy types: basic, flying, shooter, and boss — each with distinct AI
- Projectile system: shooter enemies fire server-authoritative projectiles at players
- Collectibles: carrots, golden carrots, coins, gems, keys, and power-ups
- Power-ups: double jump, high jump, speed boost, health restore, extra life
- Level completion detection (collect all carrots + defeat all enemies)
- Real-time multiplayer via Socket.IO with server-authoritative physics
- PWA support with service worker for offline play
- Local high score tracking via SQLite

## Project Structure

```
luna-adventure/
├── server/
│   ├── index.mjs              # Entry point (Express + Socket.IO)
│   └── services/
│       ├── gameEngine.js      # Authoritative game loop, physics, AI
│       ├── assetManager.js    # Level loading
│       └── stateManager.js    # High score persistence (SQLite)
├── client/
│   ├── index.html
│   ├── scripts/
│   │   ├── game.js            # Client orchestrator
│   │   ├── renderer.js        # SVGRenderer (layered SVG)
│   │   ├── physics.js         # Client-side prediction
│   │   ├── inputHandler.js    # Keyboard + touch input
│   │   └── entities/          # Player, Enemy, Platform, Collectible classes
│   ├── assets/
│   │   └── levels/            # level-1.json (Garden Adventure)
│   └── styles/
├── graphics/                  # All SVG sprites and spritesheets
├── shared/
│   └── constants.js           # Shared constants (physics, entity sizes, events)
├── docs/                      # CLAUDE.md, INSTALL.md, milestone-board.md
├── babel.config.cjs           # Babel config for Jest
├── server/jest.config.cjs
└── client/jest.config.cjs
```

## Technology Stack

- **Backend**: Node.js (ES Modules), Express, Socket.IO
- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+)
- **Graphics**: SVG for all game assets and spritesheets
- **Database**: SQLite (via sqlite3) for high scores
- **Testing**: Jest + Babel (6 suites, 16 tests)
- **Linting**: ESLint (airbnb-base)

## Quick Start

```bash
cd luna-adventure
HUSKY=0 npm install    # HUSKY=0 needed because .git is in the parent directory
npm run dev            # Starts server (port 3000) + client dev server (port 8080)
```

Open `http://localhost:3000` to play.

See [docs/INSTALL.md](luna-adventure/docs/INSTALL.md) for full setup instructions.

## Development Roadmap

- [x] Core game engine and physics (server-authoritative, 60 FPS)
- [x] SVG rendering with layered SVG
- [x] Player controls and collision detection
- [x] Enemy AI (patrol, chase, attack) for all 4 enemy types
- [x] Projectile system (shooter enemies, server-authoritative)
- [x] Moving platforms (velocity-driven position updates)
- [x] Breaking platforms (stable → breaking → broken → stable state machine)
- [x] Bouncy platforms (velocity reflection with 1.5× multiplier)
- [x] Level completion detection (all carrots + all enemies)
- [x] Player invulnerability after taking damage (1500ms cooldown)
- [x] Test suite (Jest + Babel, 6 suites, 16 tests)
- [x] PWA support (service worker, manifest)
- [ ] Additional levels (currently only level-1)
- [ ] Sound and music system
- [ ] Online leaderboards
- [ ] CI pipeline

## License

MIT License — see [LICENSE](luna-adventure/LICENSE) for details.

## Credits

- Game concept and development: Kurt Mitchell
- Character: Luna is inspired by real guinea pigs
