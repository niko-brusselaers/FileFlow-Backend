import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import {Server} from "socket.io"
import { createServer } from "http";
import cors from "cors";
import { IConnectedDevice } from "./types/IConnectedDevice";
import { ITransferRequest } from "./types/ITransferRequest";
import { log } from "console";

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

        if(!data.socketId || !data.deviceName|| !data.publicIPAdress) return socket.emit("addConnectedDevice", Error("missing required fields"));
        console.log("new device connected");
        
        connectedDevices.set(data.socketId, data);

        //notify other devices on the local network about the new connection
        const localDevices = Array.from(connectedDevices.values()).filter((device) => device.publicIPAdress === data.publicIPAdress);
        const socketIds = localDevices.map((device) => device.socketId);

        ws.to(socketIds).emit("localChange");
        
    });

    //request devices that are on the local network of requesting device
    socket.on("requestLocalDevices", (data) => {
        const requestingDevice = connectedDevices.get(socket.id);

        if(!requestingDevice) return socket.emit("localDevices", Error("socket id not found"));
        
        const localDevices = Array.from(connectedDevices.values()).filter((device) => device.publicIPAdress === requestingDevice.publicIPAdress);
        

        socket.emit("localDevices", localDevices);
    });

    socket.on("transferFileRequest", (data:ITransferRequest) => {
        //return error if no socketId, userName or code is provided or empty
        if(!data.socketIdReceiver && !data.userNameReceiver && !data.socketIdSender && !data.userNameSender) return socket.emit("transferFileRequest", Error("socketId or userName of both receiver is required"));
        if(!data.code) return socket.emit("transferFileRequest", Error("code is required"));

        if(data.socketIdReceiver){
            //check if device is connected
            const device = connectedDevices.get(data.socketIdReceiver);
            if(!device) return socket.emit("transferFileRequest", Error("device not found"));
            return ws.to(data.socketIdReceiver).emit("transferFileRequest", data);
        }

        if(data.userNameReceiver){
            
            //check if device is connected
            const device = Array.from(connectedDevices.values()).filter((device) => device.userName === data.userNameReceiver);
            if(!device) return socket.emit("transferFileRequest", Error("device not found"));

            //send request to all devices with the same username
            const socketIds = device.map((device) => device.socketId);
            return ws.to(socketIds).emit("transferFileRequest", data);
        }

    });

    //remove connected device from the map and notify other devices on the local network about the disconnection
    //when listening to localDisconnect event
    socket.on("disconnect", (data) => {
        const disconnectedDevice = connectedDevices.get(socket.id);
        
        if(!disconnectedDevice) return;
        console.log("device disconnected");
        
        const localDevices = Array.from(connectedDevices.values()).filter((device) => device.publicIPAdress === disconnectedDevice.publicIPAdress);
        const socketIds = localDevices.map((device) => device.socketId);

        connectedDevices.delete(disconnectedDevice?.socketId);        

        ws.to(socketIds).emit("localChange");
    });
});

server.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});