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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super();
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.isConnected = false;
        this.connectAttempts = 0;
        this.maxRetries = 3;
    }
    async onModuleInit() {
        await this.connectWithRetry();
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async connectWithRetry(maxRetries = 3, delayMs = 3000) {
        this.maxRetries = maxRetries;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            this.connectAttempts = attempt;
            try {
                await this.$connect();
                this.isConnected = true;
                this.logger.log("Database connected successfully");
                return;
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                this.logger.error(`Database connection attempt ${attempt}/${maxRetries} failed: ${message}`);
                if (attempt === maxRetries) {
                    this.logger.error("Database unavailable. Application will continue without database connection.");
                    this.isConnected = false;
                    return;
                }
                this.logger.warn(`Retrying in ${delayMs / 1000}s...`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
        }
    }
    async $connect() {
        if (this.isConnected) {
            return Promise.resolve();
        }
        try {
            await super.$connect();
            this.isConnected = true;
            return Promise.resolve();
        }
        catch (error) {
            this.isConnected = false;
            throw error;
        }
    }
    async $disconnect() {
        this.isConnected = false;
        return super.$disconnect();
    }
    async reconnectIfNeeded() {
        if (!this.isConnected && this.connectAttempts < this.maxRetries) {
            this.logger.warn("Attempting to reconnect to database...");
            await this.connectWithRetry(1, 1000);
        }
    }
    ensureConnected() {
        if (!this.isConnected) {
            throw new Error("Database is not connected. Please check your network connection to the database server.");
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map