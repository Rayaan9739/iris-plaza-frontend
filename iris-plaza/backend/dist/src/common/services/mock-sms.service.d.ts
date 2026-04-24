import { SmsService, SmsMessage, SmsResult } from "./sms.service";
export declare class MockSmsService extends SmsService {
    private readonly logger;
    sendSms(message: SmsMessage): Promise<SmsResult>;
}
