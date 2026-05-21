import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  socket = null;

  connect() {
    this.socket = io(SOCKET_URL);
    
    this.socket.on('connect', () => {
      console.log('📡 WORKSTATION_ONLINE: Connected to core infrastructure');
    });

    this.socket.on('disconnect', () => {
      console.log('⚠️ WORKSTATION_OFFLINE: Connection lost');
    });

    return this.socket;
  }

  joinBoard(boardId) {
    if (this.socket) {
      this.socket.emit('join-board', boardId);
      console.log(`📡 JOINED_BOARD: ${boardId}`);
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
      this.socket.on('update-card', callback);
    }
  }

  onBoardRefresh(callback) {
    if (this.socket) {
      this.socket.on('board-refresh', callback);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const socketService = new SocketService();
