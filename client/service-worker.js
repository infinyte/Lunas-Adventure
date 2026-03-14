// client/service-worker.js

/**
 * Luna's Adventure Service Worker
 * 
 * Provides offline functionality by caching assets and serving them
 * when the user is offline or the server is unavailable.
 */

// Cache name with version (increment to force update)
const CACHE_NAME = 'lunas-adventure-v1';

// Resources to cache immediately when service worker is installed
const PRECACHE_RESOURCES = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/scripts/game.js',
  '/scripts/renderer.js',
  '/scripts/inputHandler.js',
  '/scripts/physics.js',
  '/scripts/entities/player.js',
  '/scripts/entities/enemy.js',
  '/scripts/entities/platform.js',
  '/scripts/entities/collectible.js',
  '/shared/constants.js',
  '/assets/sprites/luna_idle.svg',
  '/assets/sprites/luna_run.svg',
  '/assets/sprites/luna_jump.svg',
  '/assets/sounds/jump.mp3',
  '/assets/sounds/collect.mp3',
  '/assets/sounds/hurt.mp3',
  '/assets/music/gameplay.mp3',
  '/assets/favicon.ico'
];

// Install event - Precache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  // Wait until precaching is complete
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(PRECACHE_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker: Precaching complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('Service Worker: Precaching failed:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  // Wait until cleanup is complete
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cache => {
            // Delete any old caches that don't match current version
            if (cache !== CACHE_NAME) {
              console.log('Service Worker: Clearing old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Now active');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - Serve from cache, falling back to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests and socket.io connections
  if (event.request.method !== 'GET' || 
      event.request.url.includes('/socket.io/')) {
    return;
  }
  
  // For game assets and code, use cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Return cached response if available
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise, fetch from network
        return fetch(event.request)
          .then(response => {
            // Skip caching if response is invalid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response - one to return, one to cache
            const responseToCache = response.clone();
            
            // Add the resource to the cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('Service Worker: Fetch failed:', error);
            
            // For HTML navigation requests, fallback to offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            // Could return a fallback image or JSON here for other types
            return new Response('Network error', { 
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', event => {
  // Handle cache update requests
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Background sync for high scores and saved games
self.addEventListener('sync', event => {
  if (event.tag === 'sync-highscores') {
    event.waitUntil(syncHighScores());
  } else if (event.tag === 'sync-savedgame') {
    event.waitUntil(syncSavedGame());
  }
});

/**
 * Sync high scores to server when online
 * @returns {Promise} - Promise that resolves when sync completes
 */
async function syncHighScores() {
  try {
    // Open IndexedDB
    const db = await openDatabase();
    
    // Get unsynchronized high scores
    const highScores = await getUnsyncedHighScores(db);
    
    if (highScores.length === 0) {
      return;
    }
    
    // Send to server
    const response = await fetch('/api/highscores', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ scores: highScores })
    });
    
    if (response.ok) {
      // Mark as synced in IndexedDB
      await markHighScoresAsSynced(db, highScores);
      console.log('Service Worker: High scores synced successfully');
    } else {
      throw new Error('Failed to sync high scores');
    }
  } catch (error) {
    console.error('Service Worker: High score sync failed:', error);
    throw error; // Rethrow to keep sync registration active
  }
}

/**
 * Sync saved game to server when online
 * @returns {Promise} - Promise that resolves when sync completes
 */
async function syncSavedGame() {
  try {
    // Open IndexedDB
    const db = await openDatabase();
    
    // Get unsynchronized saved game
    const savedGame = await getUnsyncedSavedGame(db);
    
    if (!savedGame) {
      return;
    }
    
    // Send to server
    const response = await fetch('/api/savegame', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(savedGame)
    });
    
    if (response.ok) {
      // Mark as synced in IndexedDB
      await markSavedGameAsSynced(db, savedGame.id);
      console.log('Service Worker: Saved game synced successfully');
    } else {
      throw new Error('Failed to sync saved game');
    }
  } catch (error) {
    console.error('Service Worker: Saved game sync failed:', error);
    throw error; // Rethrow to keep sync registration active
  }
}

/**
 * Open the IndexedDB database
 * @returns {Promise<IDBDatabase>} - Promise with database object
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LunasAdventureDB', 1);
    
    request.onupgradeneeded = event => {
      const db = event.target.result;
      
      // Create stores if they don't exist
      if (!db.objectStoreNames.contains('highScores')) {
        const highScoresStore = db.createObjectStore('highScores', { keyPath: 'id' });
        highScoresStore.createIndex('synced', 'synced', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('savedGames')) {
        const savedGamesStore = db.createObjectStore('savedGames', { keyPath: 'id' });
        savedGamesStore.createIndex('synced', 'synced', { unique: false });
      }
    };
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      reject(new Error('Failed to open database: ' + event.target.error));
    };
  });
}

/**
 * Get unsynced high scores from IndexedDB
 * @param {IDBDatabase} db - Database object
 * @returns {Promise<Array>} - Promise with array of unsynced high scores
 */
function getUnsyncedHighScores(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['highScores'], 'readonly');
    const store = transaction.objectStore('highScores');
    const index = store.index('synced');
    const request = index.getAll(0); // 0 = not synced
    
    request.onsuccess = event => {
      resolve(event.target.result);
    };
    
    request.onerror = event => {
      reject(new Error('Failed to get unsynced high scores: ' + event.target.error));
    };
  });
}

/**
 * Mark high scores as synced in IndexedDB
 * @param {IDBDatabase} db - Database object
 * @param {Array} highScores - Array of high scores to mark as synced
 * @returns {Promise} - Promise that resolves when update completes
 */
function markHighScoresAsSynced(db, highScores) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['highScores'], 'readwrite');
    const store = transaction.objectStore('highScores');
    
    // Update each high score
    let completed = 0;
    let failed = 0;
    
    highScores.forEach(score => {
      score.synced = 1;
      const request = store.put(score);
      
      request.onsuccess = () => {
        completed++;
        if (completed + failed === highScores.length) {
          if (failed > 0) {
            reject(new Error(`Failed to mark ${failed} high scores as synced`));
          } else {
            resolve();
          }
        }
      };
      
      request.onerror = () => {
        failed++;
        if (completed + failed === highScores.length) {
          reject(new Error(`Failed to mark ${failed} high scores as synced`));
        }
      };
    });
    
    if (highScores.length === 0) {
      resolve();
    }
  });
}

/**
 * Get unsynced saved game from IndexedDB
 * @param {IDBDatabase} db - Database object
 * @returns {Promise<Object|null>} - Promise with unsynced saved game or null
 */
function getUnsyncedSavedGame(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['savedGames'], 'readonly');
    const store = transaction.objectStore('savedGames');
    const index = store.index('synced');
    const request = index.get(0); // 0 = not synced
    
    request.onsuccess = event => {
      resolve(event.target.result || null);
    };
    
    request.onerror = event => {
      reject(new Error('Failed to get unsynced saved game: ' + event.target.error));
    };
  });
}

/**
 * Mark saved game as synced in IndexedDB
 * @param {IDBDatabase} db - Database object
 * @param {string} id - ID of saved game to mark as synced
 * @returns {Promise} - Promise that resolves when update completes
 */
function markSavedGameAsSynced(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['savedGames'], 'readwrite');
    const store = transaction.objectStore('savedGames');
    const request = store.get(id);
    
    request.onsuccess = event => {
      const savedGame = event.target.result;
      
      if (!savedGame) {
        reject(new Error('Saved game not found'));
        return;
      }
      
      savedGame.synced = 1;
      const updateRequest = store.put(savedGame);
      
      updateRequest.onsuccess = () => {
        resolve();
      };
      
      updateRequest.onerror = event => {
        reject(new Error('Failed to mark saved game as synced: ' + event.target.error));
      };
    };
    
    request.onerror = event => {
      reject(new Error('Failed to get saved game: ' + event.target.error));
    };
  });
}