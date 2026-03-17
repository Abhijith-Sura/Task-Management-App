import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import {Server} from "socket.io";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import boardRoutes from "./routes/boardRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";

import {socketHandler} from "./sockets/socketHandler.js";


dotenv.config();

const app = express();

const server = http.createServer(app);

const io = new Server(server,{
  cors:{origin:"*"}
});

socketHandler(io);

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth",authRoutes);
app.use("/api/boards",boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/cards", cardRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT,()=>{
  console.log(`Server running on ${PORT}`);
});