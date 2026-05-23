import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  socket = null;
  _currentBoard = null;

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

  joinBoard(boardId) {
    this._currentBoard = boardId;
    if (this.socket) {
      this.socket.emit('join-board', boardId);
      console.log(`📡 JOINED_BOARD: ${boardId}`);
    }
  }

  leaveBoard(boardId) {
    if (this.socket && boardId) {
      this.socket.emit('leave-board', boardId);
    }
    if (this._currentBoard === boardId) {
      this._currentBoard = null;
    }
  }

  // --- Presence Logic ---
  joinCard(boardId, cardId, user) {
    if (this.socket) {
      this.socket.emit('join-card', { boardId, cardId, user });
    }
  }

  leaveCard(boardId, cardId, userId) {
    if (this.socket) {
      this.socket.emit('leave-card', { boardId, cardId, userId });
    }
  }

  onCardViewersUpdated(callback) {
    if (this.socket) {
      this.socket.on('card-viewers-updated', callback);
    }
  }

  emitCardMove(data) {
    if (this.socket) {
      this.socket.emit('card-moved', data);
    }
  }

  onUpdateCard(callback) {
    if (this.socket) {
      // Remove old listener first to avoid duplicates
      this.socket.off('update-card');
      this.socket.on('update-card', callback);
    }
  }

  onBoardRefresh(callback) {
    if (this.socket) {
      // Remove old listener first to avoid duplicates
      this.socket.off('board-refresh');
      this.socket.on('board-refresh', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this._currentBoard = null;
    }
  }
}

export const socketService = new SocketService();
