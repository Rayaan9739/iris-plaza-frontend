import { ConfigService } from "@nestjs/config";
export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    format: string;
    width?: number;
    height?: number;
    bytes: number;
    resource_type: string;
}
export declare class CloudinaryService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    uploadImage(file: Express.Multer.File, folder?: string): Promise<CloudinaryUploadResult>;
    uploadRaw(file: Express.Multer.File, folder?: string): Promise<CloudinaryUploadResult>;
    uploadBuffer(buffer: Buffer, filename: string, folder?: string): Promise<CloudinaryUploadResult>;
    uploadBase64(base64Data: string, folder?: string): Promise<CloudinaryUploadResult>;
    deleteFile(publicId: string, resourceType?: string): Promise<void>;
}
