import { Injectable } from "@nestjs/common";

/**
 * Abstract SMS Service Interface
 * 
 * This allows you to swap SMS providers easily:
 * - Twilio
 * - Nexmo (Vonage)
 * - AWS SNS
 * - Custom provider
 */
export interface SmsMessage {
  to: string;
  body: string;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export abstract class SmsService {
  /**
   * Send SMS message
   */
  abstract sendSms(message: SmsMessage): Promise<SmsResult>;

  /**
   * Send OTP via SMS
   */
  async sendOtp(phone: string, otp: string): Promise<SmsResult> {
    return this.sendSms({
      to: phone,
      body: `Your verification code is: ${otp}. This code expires in 5 minutes.`,
    });
  }
}
