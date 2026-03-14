// client/scripts/soundManager.js

/**
 * Sound manager for music tracks and one-shot sound effects.
 * Works as a no-op in non-browser environments where Audio is unavailable.
 */
class SoundManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.musicEnabled = options.musicEnabled !== false;
    this.effectsVolume = options.effectsVolume ?? 1.0;
    this.musicVolume = options.musicVolume ?? 0.7;
    this.basePath = options.basePath || 'assets';

    this.effectPaths = new Map();
    this.musicPaths = new Map();
    this.currentMusicName = null;
    this.currentMusicAudio = null;

    this.registerDefaultAssets();
  }

  registerDefaultAssets() {
    this.registerEffect('player:jump', 'sounds/effects/jump.ogg');
    this.registerEffect('collectible:carrot', 'sounds/effects/collect_carrot.ogg');
    this.registerEffect('player:damage', 'sounds/effects/player_damage.ogg');
    this.registerEffect('enemy:defeated', 'sounds/effects/enemy_defeated.ogg');
    this.registerEffect('level:complete', 'sounds/effects/level_complete.ogg');

    this.registerMusic('menu_theme', 'music/tracks/menu_theme.ogg');
    this.registerMusic('gameplay_theme', 'music/tracks/gameplay_theme.ogg');
    this.registerMusic('victory_theme', 'music/tracks/victory_theme.ogg');
  }

  registerEffect(name, relativePath) {
    this.effectPaths.set(name, this.resolvePath(relativePath));
  }

  registerMusic(name, relativePath) {
    this.musicPaths.set(name, this.resolvePath(relativePath));
  }

  resolvePath(relativePath) {
    return `${this.basePath}/${relativePath}`;
  }

  createAudio(sourcePath, loop = false) {
    if (typeof Audio !== 'function') {
      return null;
    }

    const audio = new Audio(sourcePath);
    audio.preload = 'auto';
    audio.loop = loop;
    return audio;
  }

  safePlay(audio) {
    if (!audio || typeof audio.play !== 'function') {
      return false;
    }

    const playResult = audio.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => {
        // Playback failures can happen before user interaction and are non-fatal.
      });
    }

    return true;
  }

  playEffect(name) {
    if (!this.enabled) {
      return false;
    }

    const sourcePath = this.effectPaths.get(name);
    if (!sourcePath) {
      return false;
    }

    const audio = this.createAudio(sourcePath, false);
    if (!audio) {
      return false;
    }

    audio.volume = this.effectsVolume;
    audio.currentTime = 0;
    return this.safePlay(audio);
  }

  playMusic(name) {
    if (!this.enabled || !this.musicEnabled) {
      return false;
    }

    if (this.currentMusicName === name && this.currentMusicAudio) {
      return this.safePlay(this.currentMusicAudio);
    }

    const sourcePath = this.musicPaths.get(name);
    if (!sourcePath) {
      return false;
    }

    this.stopMusic();

    const audio = this.createAudio(sourcePath, true);
    if (!audio) {
      return false;
    }

    audio.volume = this.musicVolume;
    this.currentMusicName = name;
    this.currentMusicAudio = audio;

    return this.safePlay(audio);
  }

  pauseMusic() {
    if (!this.currentMusicAudio || typeof this.currentMusicAudio.pause !== 'function') {
      return false;
    }

    this.currentMusicAudio.pause();
    return true;
  }

  resumeMusic() {
    if (!this.currentMusicAudio) {
      return false;
    }

    return this.safePlay(this.currentMusicAudio);
  }

  stopMusic() {
    if (!this.currentMusicAudio) {
      return false;
    }

    if (typeof this.currentMusicAudio.pause === 'function') {
      this.currentMusicAudio.pause();
    }
    this.currentMusicAudio.currentTime = 0;
    this.currentMusicAudio = null;
    this.currentMusicName = null;
    return true;
  }

  setSettings(settings = {}) {
    if (typeof settings.sound === 'boolean') {
      this.enabled = settings.sound;
    }

    if (typeof settings.music === 'boolean') {
      this.musicEnabled = settings.music;
      if (!this.musicEnabled) {
        this.stopMusic();
      }
    }
  }
}

export { SoundManager };
export default SoundManager;
