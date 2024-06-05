export interface ITransferRequest {
    userNameReceiver?: string;
    userNameSender?: string;
    socketIdReceiver?: string;
    socketIdSender?: string;

    fileDetails: {
        fileName: string;
        fileSize: string;
        fileType: string;
    }
    code: string;
}