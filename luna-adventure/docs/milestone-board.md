# Milestone Board

This checklist tracks implementation progress in actionable phases.

## Now

### [x] Lock stable baseline build and test gate
- [x] Run `Set-Location c:/work/Lunas-Adventure/luna-adventure`
- [x] Run `npm run build`
- [x] Run `npm run test`
- [x] Run `npm run validate`

Acceptance criteria:
- [x] Build exits with code 0.
- [x] Test exits with code 0 with 5 suites and 12 tests passing.
- [x] No duplicated `dist` test suites are discovered.
- [x] Validate reports required files found.

### [x] Add core game orchestration tests to improve practical coverage
- [x] Create `client/__tests__/game.orchestration.test.js`
- [x] Add at least 4 tests for start/pause/resume/socket-driven state updates
- [x] Run `npm run client:test`
- [x] Run `npm run test`

Acceptance criteria:
- [x] New orchestration tests pass.
- [x] Full suite remains green.

### [ ] Raise thresholds one step after additional tests land
- [ ] Update `package.json` coverage thresholds to:
- [ ] `statements: 8`
- [ ] `branches: 5`
- [ ] `functions: 8`
- [ ] `lines: 8`
- [ ] Run `npm run test`

Acceptance criteria:
- [ ] Thresholds pass without rollback.

## Next

### [ ] Implement remaining gameplay TODOs with tests
- [ ] Implement audio hook points and level completion logic in `client/scripts/game.js`
- [ ] Implement shooter projectile behavior in `client/scripts/entities/enemy.js`
- [ ] Add focused tests for each behavior in `client/__tests__/`
- [ ] Run `npm run test`

Acceptance criteria:
- [ ] Previously flagged gameplay TODO behavior is implemented.
- [ ] New behavior-specific tests pass.

### [ ] Add server integration tests for API and socket flows
- [ ] Add tests for `GET /api/levels` and `GET /api/highscores` using `supertest`
- [ ] Add at least one socket flow test (`player:move` -> `game:state`)
- [ ] Run `npm run server:test`
- [ ] Run `npm run test`

Acceptance criteria:
- [ ] API endpoint tests pass for core success path.
- [ ] Socket flow test verifies event propagation.
- [ ] Full suite remains green.

### [ ] Tighten quality bar after integration tests
- [ ] Update `package.json` coverage thresholds to:
- [ ] `statements: 12`
- [ ] `branches: 8`
- [ ] `functions: 12`
- [ ] `lines: 12`
- [ ] Run `npm run test`

Acceptance criteria:
- [ ] Increased thresholds pass with no skipped suites.

## Later

### [ ] Add CI pipeline for repeatable checks
- [ ] Configure CI command sequence:
- [ ] `npm ci`
- [ ] `npm run build`
- [ ] `npm run test`
- [ ] `npm run validate`

Acceptance criteria:
- [ ] CI reproduces local pass/fail outcomes on clean install.
- [ ] Pull requests fail fast on build or test regressions.

### [ ] Complete deployment readiness and container parity
- [ ] Finalize `Dockerfile` and `docker-compose.yml`
- [ ] Run `docker compose up --build`
- [ ] Verify app endpoint and socket connectivity

Acceptance criteria:
- [ ] Containerized app starts reliably.
- [ ] Runtime behavior matches documented setup.

### [ ] Align docs with current scripts and workflow
- [ ] Reconcile command examples in `README.md`, `INSTALL.md`, and `ProjectStructure.txt`
- [ ] Verify commands by running `npm run build` and `npm run test`

Acceptance criteria:
- [ ] Documentation commands work exactly as written.
- [ ] No stale script/path references remain.
