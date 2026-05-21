import api from './api';

const CACHE_PREFIX = 'trello_clone_cache_';
const QUEUE_KEY = 'trello_clone_offline_queue';

export const offlineSyncService = {
  // Cache board details locally
  cacheBoard(boardId, boardData) {
    try {
      localStorage.setItem(`${CACHE_PREFIX}${boardId}`, JSON.stringify(boardData));
    } catch (e) {
      console.error('Failed to cache board details', e);
    }
  },

  // Retrieve cached board details
  getCachedBoard(boardId) {
    try {
      const data = localStorage.getItem(`${CACHE_PREFIX}${boardId}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to read board cache', e);
      return null;
    }
  },

  // Queue mutation for offline syncing
  queueMutation(boardId, actionType, url, method, data) {
    try {
      const queue = this.getQueue();
      const newMutation = {
        id: Math.random().toString(36).substring(2, 11),
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

  // Get active stashed offline mutations queue
  getQueue() {
    try {
      const queue = localStorage.getItem(QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (e) {
      console.error('Failed to read offline queue', e);
      return [];
    }
  },

  // Clear queued mutations
  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
  },

  // Sync stashed queue sequentially with the backend
  async syncQueue(onProgress) {
    const queue = this.getQueue();
    if (queue.length === 0) return;

    console.log(`Syncing ${queue.length} offline mutations...`);
    const remainingQueue = [...queue];

    for (let i = 0; i < queue.length; i++) {
      const mutation = queue[i];
      try {
        if (onProgress) onProgress(i + 1, queue.length, mutation.actionType);

        if (mutation.method.toUpperCase() === 'POST') {
          await api.post(mutation.url, mutation.data);
        } else if (mutation.method.toUpperCase() === 'PUT') {
          await api.put(mutation.url, mutation.data);
        } else if (mutation.method.toUpperCase() === 'DELETE') {
          await api.delete(mutation.url);
        }

        remainingQueue.shift();
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
      } catch (err) {
        console.error(`Offline sync failed for mutation id: ${mutation.id}`, err);
        if (err.response && err.response.status >= 400 && err.response.status < 500) {
          remainingQueue.shift();
          localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
        } else {
          break; // Stop and retain the rest of the queue
        }
      }
    }
  }
};
export default offlineSyncService;
