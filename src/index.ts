import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import {Server} from "socket.io"
import { createServer } from "http";
import cors from "cors";
import { IConnectedDevice } from "./types/IConnectedDevice";

dotenv.config();

const port = process.env.PORT || 3000;
const app: Express = express();
const server = createServer(app);
const ws = new Server(server,{
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
})

const connectedDevices = new Map<string, IConnectedDevice>();

app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello world");
});

ws.on("connection", (socket) => {

    //add connected device to the map
    socket.on("addConnectedDevice", (data:IConnectedDevice) => {
        if(!data.socketId || !data.deviceName|| !data.publicIPAdress) return;
        connectedDevices.set(data.socketId, data);
        
    });

    //request devices that are on the local network of requesting device
    socket.on("requestLocalDevices", (data) => {
        const requestingDevice = connectedDevices.get(socket.id);

        if(!requestingDevice) return;
        
        const localDevices = Array.from(connectedDevices.values()).filter((device) => device.publicIPAdress === requestingDevice.publicIPAdress);
        const socketIds = localDevices.map((device) => device.socketId);
        

        socket.emit("localDevices", socketIds);
    });

    //remove connected device from the map and notify other devices on the local network about the disconnection
    //when listening to localDisconnect event
    socket.on("disconnect", (data) => {
        const disconnectedDevice = connectedDevices.get(socket.id);
        
        if(!disconnectedDevice) return;
        const localDevices = Array.from(connectedDevices.values()).filter((device) => device.publicIPAdress === disconnectedDevice.publicIPAdress);
        const socketIds = localDevices.map((device) => device.socketId);

        connectedDevices.delete(disconnectedDevice?.socketId);        

        ws.to(socketIds).emit("localDisconnect");
    });
});

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});