import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import {Server} from "socket.io"
import { createServer } from "http";
import { log } from "console";

dotenv.config();

const port = process.env.PORT || 3000;
const app: Express = express();
const server = createServer(app);
const ws = new Server(server);

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world");
});

ws.on("connection", (socket) => {
    log("New client connected", socket.id);
})

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});