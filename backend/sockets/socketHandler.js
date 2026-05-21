// In-memory store for active card viewers: cardId -> [{ userId, name, avatar, socketId }]
const activeViewers = new Map();
let ioInstance = null;

export const broadcastToBoard = (boardId, event, data) => {
  if (ioInstance && boardId) {
    ioInstance.to(boardId.toString()).emit(event, data);
  }
};

export const socketHandler = (io) => {
  ioInstance = io;
  io.on("connection", (socket) => {
    console.log(`📡 SOCKET_CONNECT: [${socket.id}]`);

    socket.on("join-board", (boardId) => {
      socket.join(boardId);
      console.log(`🏢 BOARD_JOINED: ${boardId} by [${socket.id}]`);
    });

    // --- Presence Logic ---
    socket.on("join-card", ({ boardId, cardId, user }) => {
      if (!cardId || !user) return;
      
      socket.join(`card:${cardId}`);
      
      if (!activeViewers.has(cardId)) {
        activeViewers.set(cardId, []);
      }
      
      const viewers = activeViewers.get(cardId);
      // Only add if not already present from this socket
      if (!viewers.find(v => v.socketId === socket.id)) {
        viewers.push({ ...user, socketId: socket.id });
      }
      
      console.log(`📝 CARD_VIEW_JOIN: ${cardId} by ${user.name}`);
      io.to(boardId).emit("card-viewers-updated", { cardId, viewers });
    });

    socket.on("leave-card", ({ boardId, cardId, userId }) => {
      if (!cardId) return;

      socket.leave(`card:${cardId}`);
      
      if (activeViewers.has(cardId)) {
        let viewers = activeViewers.get(cardId);
        viewers = viewers.filter(v => v.socketId !== socket.id);
        activeViewers.set(cardId, viewers);
        
        io.to(boardId).emit("card-viewers-updated", { cardId, viewers });
      }
    });

    // --- Interaction Logic ---
    socket.on("card-moved", (data) => {
      socket.to(data.boardId).emit("update-card", data);
    });

    socket.on("board-activity", (data) => {
      socket.to(data.boardId).emit("activity-update", data);
    });

    socket.on("board-mutation", (data) => {
      socket.to(data.boardId).emit("board-refresh", data);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 SOCKET_DISCONNECT: [${socket.id}]`);
      
      // Clean up all cards this socket was viewing
      activeViewers.forEach((viewers, cardId) => {
        if (viewers.some(v => v.socketId === socket.id)) {
          const updatedViewers = viewers.filter(v => v.socketId !== socket.id);
          activeViewers.set(cardId, updatedViewers);
          
          // We broadcast a global update or it will be picked up by board-level rooms if we tracked them
          // For now, simpler: broadcast to all (or better, track which boardId this socket belongs to)
          io.emit("card-viewers-updated", { cardId, viewers: updatedViewers });
        }
      });
    });
  });
}