import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

/**
 * SocketService handles real-time WebSocket communication.
 * It manages the connection lifecycle, board presence, and card collaboration events.
 */
class SocketService {
  socket = null;
  _currentBoard = null;

  /**
   * Establishes or restores the WebSocket connection.
   * Automatically attempts to rejoin the active board on reconnection.
   * 
   * @returns {import('socket.io-client').Socket} The active socket instance.
   */
  connect() {
    // Don't create duplicate connections — reuse existing connected socket
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    // If socket exists but disconnected, reconnect it instead of creating new one
    if (this.socket) {
      this.socket.connect();
      return this.socket;
    }

    // Initialize a new socket connection with reconnection policies
    this.socket = io(SOCKET_URL, {
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    this.socket.on('connect', () => {
      console.log('📡 WORKSTATION_ONLINE: Connected to core infrastructure');
      // Re-join the current board after reconnect
      if (this._currentBoard) {
        this.socket.emit('join-board', this._currentBoard);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('⚠️ WORKSTATION_OFFLINE: Connection lost');
    });

    return this.socket;
  }

  /**
   * Joins a specific board's real-time room.
   * 
   * @param {string} boardId - The unique identifier of the board.
   */
  joinBoard(boardId) {
    this._currentBoard = boardId;
    if (this.socket) {
      this.socket.emit('join-board', boardId);
      console.log(`📡 JOINED_BOARD: ${boardId}`);
    }
  }

  /**
   * Leaves a specific board's real-time room.
   * 
   * @param {string} boardId - The unique identifier of the board.
   */
  leaveBoard(boardId) {
    if (this.socket && boardId) {
      this.socket.emit('leave-board', boardId);
    }
    // Clear the active board state if we are leaving it
    if (this._currentBoard === boardId) {
      this._currentBoard = null;
    }
  }

  // --- Presence Logic ---

  /**
   * Emits an event to notify others that the current user has joined a card.
   * 
   * @param {string} boardId - The board containing the card.
   * @param {string} cardId - The card being viewed.
   * @param {Object} user - The user object joining the card.
   */
  joinCard(boardId, cardId, user) {
    if (this.socket) {
      this.socket.emit('join-card', { boardId, cardId, user });
    }
  }

  /**
   * Emits an event to notify others that the current user has left a card.
   * 
   * @param {string} boardId - The board containing the card.
   * @param {string} cardId - The card being left.
   * @param {string} userId - The ID of the user leaving the card.
   */
  leaveCard(boardId, cardId, userId) {
    if (this.socket) {
      this.socket.emit('leave-card', { boardId, cardId, userId });
    }
  }

  /**
   * Subscribes to card viewer updates (presence changes).
   * 
   * @param {Function} callback - Executed when viewers on a card change.
   */
  onCardViewersUpdated(callback) {
    if (this.socket) {
      this.socket.on('card-viewers-updated', callback);
    }
  }

  /**
   * Emits an event indicating a card has been moved within or across lists.
   * 
   * @param {Object} data - Information about the moved card and its new position.
   */
  emitCardMove(data) {
    if (this.socket) {
      this.socket.emit('card-moved', data);
    }
  }

  /**
   * Subscribes to real-time updates for a specific card.
   * Ensures only one listener is active at a time to prevent duplicate events.
   * 
   * @param {Function} callback - Executed when a card is updated.
   */
  onUpdateCard(callback) {
    if (this.socket) {
      // Remove old listener first to avoid duplicates
      this.socket.off('update-card');
      this.socket.on('update-card', callback);
    }
  }

  /**
   * Subscribes to general board refresh events, typically triggered 
   * when significant changes occur that require a full state reload.
   * 
   * @param {Function} callback - Executed when the board needs refreshing.
   */
  onBoardRefresh(callback) {
    if (this.socket) {
      // Remove old listener first to avoid duplicates
      this.socket.off('board-refresh');
      this.socket.on('board-refresh', callback);
    }
  }

  /**
   * Fully disconnects the socket and clears the active board state.
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._currentBoard = null;
    }
  }
}

export const socketService = new SocketService();
