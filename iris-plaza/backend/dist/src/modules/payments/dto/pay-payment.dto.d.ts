export declare enum PaymentMethodType {
    ONLINE = "ONLINE",
    CASH = "CASH",
    UPI = "UPI",
    BANK_TRANSFER = "BANK_TRANSFER"
}
export declare class PayPaymentDto {
    amount: number;
    paymentMethod: PaymentMethodType;
}
export declare class OnlinePaymentDto extends PayPaymentDto {
    transactionId: string;
    screenshotUrl: string;
    transactionDate?: string;
}
export declare class CashPaymentDto extends PayPaymentDto {
    description?: string;
}
