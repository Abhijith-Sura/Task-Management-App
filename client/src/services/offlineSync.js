import api from './api';

const CACHE_PREFIX = 'trello_clone_cache_';
const QUEUE_KEY = 'trello_clone_offline_queue';

/**
 * Service to manage offline data synchronization and caching.
 * Provides caching of board states and queues network mutations 
 * for deferred processing when connectivity is restored.
 */
export const offlineSyncService = {
  /**
   * Caches board details locally to allow offline access.
   * 
   * @param {string} boardId - The unique identifier of the board.
   * @param {Object} boardData - The full board data object to persist.
   */
  cacheBoard(boardId, boardData) {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${boardId}`, JSON.stringify(boardData));
    } catch (e) {
      console.error('Failed to cache board details', e);
    }
  },

  /**
   * Retrieves the locally cached board details if available.
   * 
   * @param {string} boardId - The unique identifier of the board to retrieve.
   * @returns {Object|null} The cached board data, or null if not found or on error.
   */
  getCachedBoard(boardId) {
    try {
      const data = localStorage.getItem(`${CACHE_PREFIX}${boardId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to read board cache', e);
      return null;
    }
  },

  /**
   * Queues an API mutation for execution when the app comes back online.
   * 
   * @param {string} boardId - The board associated with this mutation.
   * @param {string} actionType - A description of the action (e.g., 'UPDATE_CARD').
   * @param {string} url - The API endpoint for the mutation.
   * @param {string} method - The HTTP method (POST, PUT, DELETE).
   * @param {Object} [data] - The payload to send with the request.
   * @returns {Object|null} The created mutation record, or null on error.
   */
  queueMutation(boardId, actionType, url, method, data) {
    try {
      const queue = this.getQueue();
      const newMutation = {
        id: Math.random().toString(36).substring(2, 11), // Generate a simple unique ID
        timestamp: Date.now(),
        boardId,
        actionType,
        url,
        method,
        data
      };
      queue.push(newMutation);
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
      return newMutation;
    } catch (e) {
      console.error('Failed to queue offline mutation', e);
      return null;
    }
  },

  /**
   * Retrieves the current list of stashed offline mutations.
   * 
   * @returns {Array<Object>} The array of queued mutation objects.
   */
  getQueue() {
    try {
      const queue = localStorage.getItem(QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (e) {
      console.error('Failed to read offline queue', e);
      return [];
    }
  },

  /**
   * Clears all queued mutations from local storage.
   */
  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
  },

  /**
   * Syncs the stashed mutation queue sequentially with the backend.
   * Removes successful mutations and unrecoverable errors (4xx) from the queue.
   * 
   * @param {Function} [onProgress] - Optional callback fired before each mutation executes.
   * @returns {Promise<void>}
   */
  async syncQueue(onProgress) {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline mutations...`);
    // Keep a working copy to track remaining mutations during sync
    const remainingQueue = [...queue];

    for (let i = 0; i < queue.length; i++) {
      const mutation = queue[i];
      try {
        if (onProgress) onProgress(i + 1, queue.length, mutation.actionType);

        // Execute the appropriate API call based on the queued method
        if (mutation.method.toUpperCase() === 'POST') {
          await api.post(mutation.url, mutation.data);
        } else if (mutation.method.toUpperCase() === 'PUT') {
          await api.put(mutation.url, mutation.data);
        } else if (mutation.method.toUpperCase() === 'DELETE') {
          await api.delete(mutation.url);
        }

        // Successfully synced, remove from queue
        remainingQueue.shift();
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
      } catch (err) {
        console.error(`Offline sync failed for mutation id: ${mutation.id}`, err);
        
        // If the error is a client-side issue (4xx), it likely won't succeed on retry,
        // so we drop it to prevent blocking the entire queue.
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
          remainingQueue.shift();
          localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
        } else {
          break; // Stop and retain the rest of the queue for network/server errors
        }
      }
    }
  }
};
export default offlineSyncService;
