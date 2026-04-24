export interface SmsMessage {
    to: string;
    body: string;
}
export interface SmsResult {
    success: boolean;
    messageId?: string;
    error?: string;
}
export declare abstract class SmsService {
    abstract sendSms(message: SmsMessage): Promise<SmsResult>;
    sendOtp(phone: string, otp: string): Promise<SmsResult>;
}
