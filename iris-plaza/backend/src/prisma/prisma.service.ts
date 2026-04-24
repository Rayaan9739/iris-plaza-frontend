import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private connectAttempts = 0;
  private maxRetries = 3;

  constructor() {
    super();
  }

  async onModuleInit() {
    await this.connectWithRetry();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async connectWithRetry(maxRetries = 3, delayMs = 3000) {
    this.maxRetries = maxRetries;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.connectAttempts = attempt;
      try {
        await this.$connect();
        this.isConnected = true;
        this.logger.log("Database connected successfully");
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${message}`,
        );

        if (attempt === maxRetries) {
          this.logger.error(
            "Database unavailable. Application will continue without database connection.",
          );
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
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  async $disconnect() {
    this.isConnected = false;
    return super.$disconnect();
  }

  private async reconnectIfNeeded() {
    if (!this.isConnected && this.connectAttempts < this.maxRetries) {
      this.logger.warn("Attempting to reconnect to database...");
      await this.connectWithRetry(1, 1000);
    }
  }

  // Check if we can perform database operations
  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new Error(
        "Database is not connected. Please check your network connection to the database server.",
      );
    }
  }
}
