# Luna's Adventure — Project Plan & Task List

> Last updated: 2026-03-14
>
> This document tracks outstanding work, its priority, and a short description of each task.

---

## Priority Key

| Symbol | Level | Description |
|--------|-------|-------------|
| 🔴 | **Critical** | Blocks gameplay or causes data loss |
| 🟠 | **High** | Major missing feature or significant quality issue |
| 🟡 | **Medium** | Valuable improvement, no current blocker |
| 🟢 | **Low** | Nice-to-have, polish, or future milestone |

---

## 1 · Gameplay & Content

| # | Priority | Task | Summary |
|---|----------|------|---------|
| G-1 | 🟠 | **Author levels 2–4** | Only `level-1.json` (Garden Adventure) exists. Levels 2–4 are referenced in the engine and UI but the JSON files are missing. Each level should introduce a new mechanic and increase difficulty. |
| G-2 | 🟠 | **Boss level (level-4)** | The boss enemy type is fully implemented server-side but never placed in any level. Level-4 should feature the boss with multi-phase behaviour and a win condition. |
| G-3 | 🟡 | **Enemy difficulty scaling** | All enemies currently use hardcoded constants regardless of level. Implement per-level multipliers for enemy speed, health, and detection range so later levels feel harder. |
| G-4 | 🟡 | **Camera bounds enforcement** | The SVG camera can scroll past the level edges, revealing empty space. Clamp `cameraX`/`cameraY` to `[0, levelWidth - viewportWidth]` and `[0, levelHeight - viewportHeight]`. |
| G-5 | 🟡 | **Collectible respawn logic** | `Collectible.respawnTimer` is wired but the server-side `updateCollectibles()` loop is not yet implemented. Respawning collectibles would allow infinite-loop designs and recovery mechanics. |
| G-6 | 🟢 | **Power-up balancing** | Duration and strength values for speed boost, high jump, and double jump are not tuned. Playtesting is needed; expose values in `shared/constants.js`. |

---

## 2 · Multiplayer & Networking

| # | Priority | Task | Summary |
|---|----------|------|---------|
| N-1 | 🟠 | **Online leaderboard** | High scores are persisted locally via SQLite and served by `/api/highscores`, but there is no UI to display them. Add a leaderboard screen to the main menu. |
| N-2 | 🟠 | **Reconnection handling** | If a client disconnects and reconnects, the server creates a new player instead of restoring the session. Implement a session token so state is preserved across drops. |
| N-3 | 🟡 | **Client-side prediction smoothing** | Positional updates from the server can cause visible jitter when network latency is high. Add linear interpolation (lerp) between the last received position and the predicted position. |
| N-4 | 🟡 | **Player count limit** | No cap on simultaneous connections. Add a configurable `MAX_PLAYERS` constant and reject connections over the limit with a user-friendly message. |
| N-5 | 🟢 | **Spectator mode** | Allow players who join a full game to watch. This also provides a foundation for replays. |

---

## 3 · Audio

| # | Priority | Task | Summary |
|---|----------|------|---------|
| A-1 | 🟠 | **Add actual audio files** | `SoundManager` is fully implemented and tested, but `client/assets/sounds/` and `client/assets/music/` are empty. All `play*` calls silently no-op. Source and add OGG/MP3 assets for at least: jump, collect, damage, death, level-complete, and one background track. |
| A-2 | 🟡 | **Audio settings UI** | Volume sliders for music and effects are not exposed in the UI. `SoundManager` already tracks `effectsVolume` and `musicVolume`; wire them to the settings panel. |
| A-3 | 🟡 | **Spatial audio** | Enemy and collectible sounds should attenuate with distance from the player. Use the Web Audio API `PannerNode` already available via `AudioContext`. |

---

## 4 · Graphics & UI

| # | Priority | Task | Summary |
|---|----------|------|---------|
| V-1 | 🟠 | **Sprite animation for all entities** | `SVGRenderer` uses static SVG positions; frame-stepping is tracked in entity state but frame swapping is not wired up in the render loop. Implement sprite frame updates for Luna's idle/run/jump, enemy patrol/attack, and breaking platform states. |
| V-2 | 🟠 | **Mobile controls layout** | `ui_mobile_controls.svg` is defined but the on-screen D-pad / jump button events are not connected to `InputHandler`. Mobile play is currently not functional. |
| V-3 | 🟡 | **Pause menu** | `game.pause()` and `game.resume()` are implemented, but there is no rendered pause overlay. Add a pause screen with Resume, Settings, and Quit buttons. |
| V-4 | 🟡 | **Score popups** | `ui_score_popup.svg` exists but score change events do not trigger a floating "+N points" animation. Add a short-lived SVG text element that floats upward on collection. |
| V-5 | 🟡 | **Health bar polish** | `ui_healthbar.svg` is included but the health bar width is not updated reactively. Bind bar width to `localPlayer.health` each render frame. |
| V-6 | 🟢 | **Particle effects** | Hit, collect, and powerup effect SVGs (`effect_hit.svg`, `effect_collect.svg`, `effect_powerup.svg`) exist but are never instantiated. Add a lightweight particle system driven by game events. |
| V-7 | 🟢 | **Level transition screen** | Going from level complete to the next level is instant. Add a brief fade-out / fade-in transition and a "Level N Complete!" overlay. |

---

## 5 · Code Quality & Architecture

| # | Priority | Task | Summary |
|---|----------|------|---------|
| Q-1 | 🟠 | **Increase test coverage** | Current coverage is ~19% statements / ~21% branches. Critical uncovered paths include `renderer.js` (0%), `collectible.js` (0%), and `platform.js` (0%). Add unit tests for these entity classes and the renderer. |
| Q-2 | 🟠 | **`renderer.js` modularisation** | At 1 272 lines, `renderer.js` contains SVG creation, animation, camera logic, background rendering, and UI — all in a single class. Split into focused submodules (e.g. `BackgroundRenderer`, `EntityRenderer`, `UIRenderer`). |
| Q-3 | 🟡 | **`game.js` size reduction** | `game.js` is over 2 300 lines and mixes socket handling, physics calls, input processing, and game-state logic. Extract concerns into dedicated managers (e.g., `NetworkManager`, `CollisionManager`). |
| Q-4 | 🟡 | **Add ESLint to CI** | The CI workflow (`ci.yml`) runs build, test, and validate but not `npm run lint`. Add a lint step so style regressions are caught automatically. |
| Q-5 | 🟡 | **TypeScript / JSDoc types** | Public APIs have JSDoc but parameter types are not enforced. Add `@ts-check` or migrate to TypeScript to surface type errors at development time. |
| Q-6 | 🟢 | **Bundle & minify client scripts** | `client:build` copies files verbatim; there is no bundler or minifier. Add `esbuild` or `rollup` to the build pipeline to reduce load time and enable tree-shaking. |
| Q-7 | 🟢 | **Remove unused dependencies** | `jsonwebtoken`, `morgan`, `express-validator`, and `body-parser` are listed as runtime dependencies but are not currently used in `appFactory.js` or `index.js`. Audit and remove to reduce attack surface. |

---

## 6 · Security & Infrastructure

| # | Priority | Task | Summary |
|---|----------|------|---------|
| S-1 | 🟠 | **Input sanitisation on `/api/highscores`** | `playerName` is stored without length validation or HTML-encoding. Cap at 32 characters and strip control characters before persisting. |
| S-2 | 🟡 | **Rate-limit Socket.IO events** | The HTTP API is rate-limited, but Socket.IO events (`player:move`, `player:jump`) have no server-side throttle. A malicious client can flood the game loop. Apply per-socket event rate limiting. |
| S-3 | 🟡 | **`npm audit` clean-up** | `npm audit` reports 15 vulnerabilities (4 low, 2 moderate, 9 high). Resolve high-severity issues; pin versions where auto-fix would break compatibility. |
| S-4 | 🟡 | **Dockerfile — non-root user** | The `Dockerfile` does not specify a non-root user. Add `USER node` (or a dedicated `appuser`) after copying files to follow container security best practice. |
| S-5 | 🟢 | **Content Security Policy headers** | `helmet` is configured but CSP is left at defaults. Define an explicit `Content-Security-Policy` that allows only `socket.io` WebSocket connections and inline SVG, and blocks external scripts. |
| S-6 | 🟢 | **Secrets / environment validation** | The server starts without validating required env vars. Add a startup check (e.g., via `zod` or a manual guard) that fails fast with a clear error if `PORT` or `NODE_ENV` are misconfigured. |

---

## 7 · Developer Experience

| # | Priority | Task | Summary |
|---|----------|------|---------|
| D-1 | 🟡 | **Hot-reload for server** | `nodemon` restarts the server on any change, but the connected Socket.IO clients are not automatically reconnected. Add client-side reconnect logic with exponential back-off. |
| D-2 | 🟡 | **Docker Compose dev profile** | `docker-compose.yml` is production-oriented. Add a `dev` profile with volume mounts so `npm run dev` works inside a container without rebuilding on each change. |
| D-3 | 🟢 | **Storybook / component playground** | Entity SVG rendering is hard to test visually without running the full server. A static HTML fixture page (or Storybook) would let designers iterate on sprites without starting the game. |
| D-4 | 🟢 | **Contributing guide** | There is no `CONTRIBUTING.md`. Add branch naming conventions, commit style guide, and PR checklist to lower the barrier for new contributors. |

---

## 8 · PWA / Deployment

| # | Priority | Task | Summary |
|---|----------|------|---------|
| P-1 | 🟡 | **PWA icon assets** | `manifest.json` references PNG icons (`icon-192x192.png`, `maskable-icon.png`, etc.) in `client/assets/icons/` but the directory is empty. Run `npm run build:icons` (requires `sharp`) and commit the output, or generate them in CI. |
| P-2 | 🟡 | **Service worker cache versioning** | `CACHE_NAME` in `service-worker.js` is a hardcoded string. Tie it to the package version so clients automatically bust the cache on each deployment. |
| P-3 | 🟢 | **Vercel edge config** | `vercel.json` routes all requests to the Node server. Document any environment variables required for Vercel deployment, and add a health-check endpoint (`/health`) for uptime monitoring. |
