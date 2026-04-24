import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
  resource_type: string;
}

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private configService: ConfigService) {
    // Configure Cloudinary with credentials
    cloudinary.config({
      cloud_name: this.configService.get<string>("CLOUDINARY_CLOUD_NAME") || "dtcp8qhoy",
      api_key: this.configService.get<string>("CLOUDINARY_API_KEY") || "951614482151491",
      api_secret: this.configService.get<string>("CLOUDINARY_API_SECRET") || "IPGYB_3WXHmNlzpaMAGb01tvCVc",
    });
  }

  /**
   * Upload an image or video file to Cloudinary
   */
  async uploadImage(
    file: Express.Multer.File,
    folder: string = "iris-plaza",
  ): Promise<CloudinaryUploadResult> {
    // Calculate timeout based on file size (1 minute per 10MB, minimum 2 minutes)
    const timeout = Math.max(120000, Math.ceil(file.size / (10 * 1024 * 1024)) * 60000);
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          timeout: timeout,
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary upload error: ${error.message}`, error.stack);
            reject(error);
            return;
          }
          resolve(result as CloudinaryUploadResult);
        },
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Upload a raw file (like PDF) to Cloudinary
   */
  async uploadRaw(
    file: Express.Multer.File,
    folder: string = "iris-plaza/agreements",
  ): Promise<CloudinaryUploadResult> {
    // Calculate timeout based on file size (1 minute per 10MB, minimum 2 minutes)
    const timeout = Math.max(120000, Math.ceil(file.size / (10 * 1024 * 1024)) * 60000);
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "raw",
          type: "upload",
          access_mode: "public",
          format: file.originalname.split(".").pop() || "pdf",
          timeout: timeout,
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary raw upload error: ${error.message}`, error.stack);
            reject(error);
            return;
          }
          resolve(result as CloudinaryUploadResult);
        },
      );

      const stream = Readable.from(file.buffer);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Upload a buffer (like generated PDF) to Cloudinary
   */
  async uploadBuffer(
    buffer: Buffer,
    filename: string,
    folder: string = "iris-plaza/agreements",
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "raw",
          type: "upload",
          access_mode: "public",
          public_id: filename.replace(/\.[^/.]+$/, ""),
          format: filename.split(".").pop() || "pdf",
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary buffer upload error: ${error.message}`, error.stack);
            reject(error);
            return;
          }
          resolve(result as CloudinaryUploadResult);
        },
      );

      const stream = Readable.from(buffer);
      stream.pipe(uploadStream);
    });
  }

  /**
   * Upload a base64 image to Cloudinary
   */
  async uploadBase64(
    base64Data: string,
    folder: string = "iris-plaza",
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Data,
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            this.logger.error(`Cloudinary base64 upload error: ${error.message}`, error.stack);
            reject(error);
            return;
          }
          resolve(result as CloudinaryUploadResult);
        },
      );
    });
  }

  /**
   * Delete a file from Cloudinary
   */
  async deleteFile(publicId: string, resourceType: string = "image"): Promise<void> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, { resource_type: resourceType as any }, (error) => {
        if (error) {
          this.logger.error(`Cloudinary delete error: ${error.message}`, error.stack);
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}
