export interface ITransferRequest {
    userName?: string;
    socketId?: string;
    fileDetails: {
        fileName: string;
        fileSize: number;
        fileType: string;
    }
    code: string;
}