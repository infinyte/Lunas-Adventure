import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import request from 'supertest';

import { createServer } from '../appFactory.js';

describe('Server integration: API and socket flows', () => {
  let tempRoot;
  let serverContext;

  beforeAll(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'luna-server-int-'));

    const levelsDir = path.join(tempRoot, 'levels');
    const configsDir = path.join(tempRoot, 'configs');
    const spritesDir = path.join(tempRoot, 'sprites');
    const dataDir = path.join(tempRoot, 'data');

    await Promise.all([
      fs.mkdir(levelsDir, { recursive: true }),
      fs.mkdir(configsDir, { recursive: true }),
      fs.mkdir(spritesDir, { recursive: true }),
      fs.mkdir(dataDir, { recursive: true })
    ]);

    const levelPayload = {
      id: 'level-test-int',
      name: 'Integration Level',
      width: 2000,
      height: 600,
      gravity: 0.5,
      platforms: [],
      collectibles: [],
      enemies: [],
      spawnPoint: { x: 50, y: 400 }
    };

    const highScoresPayload = [
      {
        playerName: 'Luna',
        score: 1200,
        level: 'level-1',
        createdAt: '2026-03-14T00:00:00.000Z'
      },
      {
        playerName: 'Pip',
        score: 800,
        level: 'level-1',
        createdAt: '2026-03-14T00:00:00.000Z'
      }
    ];

    await fs.writeFile(path.join(levelsDir, 'level-test-int.json'), JSON.stringify(levelPayload), 'utf-8');
    await fs.writeFile(path.join(dataDir, 'highscores.json'), JSON.stringify(highScoresPayload), 'utf-8');

    serverContext = createServer({
      assetManagerOptions: {
        levelsPath: levelsDir,
        configsPath: configsDir,
        spritesPath: spritesDir
      },
      stateManagerOptions: {
        dataPath: dataDir,
        autoSave: false
      }
    });

    const assignedPort = await serverContext.start(0);
    console.log(`Test server started on port ${assignedPort}`);
  });

  afterAll(async () => {
    if (serverContext) {
      await serverContext.stop();
    }

    if (tempRoot) {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('GET /api/levels returns level data via supertest', async () => {
    const response = await request(serverContext.app)
      .get('/api/levels')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'level-test-int' })
      ])
    );
  });

  test('GET /api/highscores returns high score data via supertest', async () => {
    const response = await request(serverContext.app)
      .get('/api/highscores')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        playerName: 'Luna',
        score: 1200
      })
    );
  });

  test('socket flow emits updated game:state after player:move', async () => {
    const connectionHandler = serverContext.io.listeners('connection')[0];
    const socketHandlers = {};

    const fakeSocket = {
      id: 'socket-test-player',
      on: jest.fn((eventName, handler) => {
        socketHandlers[eventName] = handler;
      }),
      emit: jest.fn()
    };

    const ioEmitSpy = jest.spyOn(serverContext.io, 'emit');

    connectionHandler(fakeSocket);
    socketHandlers['player:move']({ direction: 'right' });

    const stateCalls = ioEmitSpy.mock.calls.filter(([eventName]) => eventName === 'game:state');
    expect(stateCalls.length).toBeGreaterThan(0);

    const latestState = stateCalls[stateCalls.length - 1][1];
    const movedPlayer = latestState.players.find((player) => player.id === 'socket-test-player');

    expect(movedPlayer).toBeDefined();
    expect(movedPlayer.direction).toBe('right');
    expect(movedPlayer.velocityX).toBe(5);

    ioEmitSpy.mockRestore();
  });
});
