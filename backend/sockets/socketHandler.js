export const socketHandler = (io)=>{

  io.on("connection",(socket)=>{

    console.log("User connected");

    socket.on("join-board",(boardId)=>{
      socket.join(boardId);
    });

    socket.on("card-moved",(data)=>{

      io.to(data.boardId).emit("update-card",data);

    });

    socket.on("disconnect",()=>{
      console.log("User disconnected");
    });

  });

}