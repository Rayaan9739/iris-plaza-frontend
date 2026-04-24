export interface ExtractedPaymentData {
    transactionId?: string;
    amount?: number;
    date?: Date;
    upiId?: string;
    rawText: string;
}
export interface ExtractedDocumentData {
    rawText: string;
    aadhaarNumber?: string;
    gender?: string;
    fatherName?: string;
    collegeName?: string;
}
export declare class OcrService {
    private readonly logger;
    extractFromImage(buffer: Buffer): Promise<ExtractedPaymentData>;
    extractFromPdf(buffer: Buffer): Promise<ExtractedPaymentData>;
    extractDocumentFromImage(buffer: Buffer): Promise<ExtractedDocumentData>;
    private parseText;
    private parseDocumentText;
}
