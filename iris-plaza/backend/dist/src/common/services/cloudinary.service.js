"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CloudinaryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
let CloudinaryService = CloudinaryService_1 = class CloudinaryService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(CloudinaryService_1.name);
        cloudinary_1.v2.config({
            cloud_name: this.configService.get("CLOUDINARY_CLOUD_NAME") || "dtcp8qhoy",
            api_key: this.configService.get("CLOUDINARY_API_KEY") || "951614482151491",
            api_secret: this.configService.get("CLOUDINARY_API_SECRET") || "IPGYB_3WXHmNlzpaMAGb01tvCVc",
        });
    }
    async uploadImage(file, folder = "iris-plaza") {
        const timeout = Math.max(120000, Math.ceil(file.size / (10 * 1024 * 1024)) * 60000);
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: "auto",
                timeout: timeout,
            }, (error, result) => {
                if (error) {
                    this.logger.error(`Cloudinary upload error: ${error.message}`, error.stack);
                    reject(error);
                    return;
                }
                resolve(result);
            });
            const stream = stream_1.Readable.from(file.buffer);
            stream.pipe(uploadStream);
        });
    }
    async uploadRaw(file, folder = "iris-plaza/agreements") {
        const timeout = Math.max(120000, Math.ceil(file.size / (10 * 1024 * 1024)) * 60000);
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: "raw",
                type: "upload",
                access_mode: "public",
                format: file.originalname.split(".").pop() || "pdf",
                timeout: timeout,
            }, (error, result) => {
                if (error) {
                    this.logger.error(`Cloudinary raw upload error: ${error.message}`, error.stack);
                    reject(error);
                    return;
                }
                resolve(result);
            });
            const stream = stream_1.Readable.from(file.buffer);
            stream.pipe(uploadStream);
        });
    }
    async uploadBuffer(buffer, filename, folder = "iris-plaza/agreements") {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: "raw",
                type: "upload",
                access_mode: "public",
                public_id: filename.replace(/\.[^/.]+$/, ""),
                format: filename.split(".").pop() || "pdf",
                overwrite: true,
                invalidate: true,
            }, (error, result) => {
                if (error) {
                    this.logger.error(`Cloudinary buffer upload error: ${error.message}`, error.stack);
                    reject(error);
                    return;
                }
                resolve(result);
            });
            const stream = stream_1.Readable.from(buffer);
            stream.pipe(uploadStream);
        });
    }
    async uploadBase64(base64Data, folder = "iris-plaza") {
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.upload(base64Data, {
                folder,
                resource_type: "auto",
            }, (error, result) => {
                if (error) {
                    this.logger.error(`Cloudinary base64 upload error: ${error.message}`, error.stack);
                    reject(error);
                    return;
                }
                resolve(result);
            });
        });
    }
    async deleteFile(publicId, resourceType = "image") {
        return new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType }, (error) => {
                if (error) {
                    this.logger.error(`Cloudinary delete error: ${error.message}`, error.stack);
                    reject(error);
                    return;
                }
                resolve();
            });
        });
    }
};
exports.CloudinaryService = CloudinaryService;
exports.CloudinaryService = CloudinaryService = CloudinaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CloudinaryService);
//# sourceMappingURL=cloudinary.service.js.map