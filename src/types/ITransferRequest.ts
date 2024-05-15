export interface ITransferRequest {
    userName?: string;
    socketId?: string;
    fileDetails: {
        fileName: string;
        fileSize: string;
        fileType: string;
    }
    code: string;
}