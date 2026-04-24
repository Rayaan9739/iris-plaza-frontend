import { Buffer } from "buffer";
export declare function formatDate(date: Date): string;
export declare function numberToWords(amount: number): string;
export declare function calculateMonths(start: Date, end: Date): number;
export interface AgreementData {
    tenant_name: string;
    relation: string;
    father_name: string;
    tenant_address: string;
    aadhaar_number: string;
    college_name: string;
    room_number: string;
    floor: string;
    rent_amount: number;
    rent_amount_words: string;
    deposit_amount: number;
    deposit_amount_words: string;
    start_date: string;
    end_date: string;
    agreement_months: number;
    agreement_date: string;
}
export declare function generateAgreementDocx(data: AgreementData): Promise<Buffer>;
export declare function generateAgreementFromTemplate(data: AgreementData): Promise<Buffer>;
