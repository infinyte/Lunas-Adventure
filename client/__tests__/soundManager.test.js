import SoundManager from '../scripts/soundManager';

describe('SoundManager', () => {
  afterEach(() => {
    delete global.Audio;
  });

  test('playEffect returns false when Audio API is unavailable', () => {
    const manager = new SoundManager();

    expect(manager.playEffect('player:jump')).toBe(false);
  });

  test('playEffect creates and plays the configured sound', () => {
    const playMock = jest.fn(() => Promise.resolve());

    global.Audio = jest.fn(() => ({
      preload: 'auto',
      loop: false,
      volume: 1,
      currentTime: 0,
      play: playMock,
      pause: jest.fn()
    }));

    const manager = new SoundManager();
    const played = manager.playEffect('player:jump');

    expect(played).toBe(true);
    expect(global.Audio).toHaveBeenCalledWith('assets/sounds/effects/jump.ogg');
    expect(playMock).toHaveBeenCalledTimes(1);
  });

  test('playMusic, pauseMusic, resumeMusic and stopMusic manage current track', () => {
    const playMock = jest.fn(() => Promise.resolve());
    const pauseMock = jest.fn();

    global.Audio = jest.fn(() => ({
      preload: 'auto',
      loop: false,
      volume: 1,
      currentTime: 0,
      play: playMock,
      pause: pauseMock
    }));

    const manager = new SoundManager();

    expect(manager.playMusic('gameplay_theme')).toBe(true);
    expect(manager.pauseMusic()).toBe(true);
    expect(manager.resumeMusic()).toBe(true);
    expect(manager.stopMusic()).toBe(true);
    expect(manager.currentMusicAudio).toBe(null);
    expect(manager.currentMusicName).toBe(null);
  });
});
