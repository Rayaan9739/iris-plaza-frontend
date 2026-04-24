import { Injectable, Logger } from "@nestjs/common";
import { SmsService, SmsMessage, SmsResult } from "./sms.service";

/**
 * Mock SMS Service for development/testing
 *
 * In production, replace with:
 * - TwilioSmsService
 * - NexmoSmsService
 * - AwsSnsService
 */
@Injectable()
export class MockSmsService extends SmsService {
  private readonly logger = new Logger(MockSmsService.name);

  async sendSms(message: SmsMessage): Promise<SmsResult> {
    // In development, just log the SMS
    // In production, integrate with actual SMS provider
    this.logger.log(`[MOCK SMS] To: ${message.to}, Body: ${message.body}`);

    // Simulate successful send
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
    };
  }
}
