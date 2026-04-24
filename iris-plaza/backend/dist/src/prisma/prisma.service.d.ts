import { OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    private isConnected;
    private connectAttempts;
    private maxRetries;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connectWithRetry;
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    private reconnectIfNeeded;
    private ensureConnected;
}
