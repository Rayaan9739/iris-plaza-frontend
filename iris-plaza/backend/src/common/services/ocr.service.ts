import { Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const Tesseract = require('tesseract.js');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse');

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

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  async extractFromImage(buffer: Buffer): Promise<ExtractedPaymentData> {
    try {
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      return this.parseText(text);
    } catch (error) {
      this.logger.error('Error during image OCR:', error);
      throw new Error('Failed to process image screenshot');
    }
  }

  async extractFromPdf(buffer: Buffer): Promise<ExtractedPaymentData> {
    try {
      const data = await pdf(buffer);
      return this.parseText(data.text);
    } catch (error) {
      this.logger.error('Error during PDF extraction:', error);
      throw new Error('Failed to process PDF screenshot');
    }
  }

  /**
   * Extract Aadhaar and College ID document data from an image buffer
   */
  async extractDocumentFromImage(buffer: Buffer): Promise<ExtractedDocumentData> {
    try {
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      return this.parseDocumentText(text);
    } catch (error) {
      this.logger.error('Error during document OCR:', error);
      throw new Error('Failed to process document image');
    }
  }

  private parseText(text: string): ExtractedPaymentData {
    const data: ExtractedPaymentData = {
      rawText: text,
    };

    // Amount Extraction (e.g., ₹20,000, Rs. 20000, 20000.00)
    const amountRegex = /(?:₹|Rs\.?|Amount:?)\s?([\d,]+(?:\.\d{2})?)/i;
    const amountMatch = text.match(amountRegex);
    if (amountMatch) {
      data.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Transaction ID Extraction
    const txnRegex = /(?:Transaction\sID|Txn\sID|Google\sTransaction\sID|Ref\sNo|Reference\sNo)[:\s]*([A-Za-z0-9_-]+)/i;
    const txnMatch = text.match(txnRegex);
    if (txnMatch) {
      data.transactionId = txnMatch[1].trim();
    }

    // UPI ID Extraction
    const upiRegex = /[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+/g;
    const upiMatches = text.match(upiRegex);
    if (upiMatches) {
      data.upiId = upiMatches[0];
    }

    // Date Extraction
    const dateRegex = /(?:Paid\son|Date)[:\s]*(\d{1,2}[\s\/\-][A-Za-z0-9\s\/\-]{3,12})/i;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      const parsedDate = new Date(dateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        data.date = parsedDate;
      }
    }

    return data;
  }

  /**
   * Parse Aadhaar and College ID document text
   */
  private parseDocumentText(text: string): ExtractedDocumentData {
    const data: ExtractedDocumentData = {
      rawText: text,
    };

    // Extract Aadhaar Number (12 digits, possibly with spaces: XXXX XXXX XXXX)
    const aadhaarNumber = text.match(/\d{4}\s?\d{4}\s?\d{4}/)?.[0]?.replace(/\s/g, '') || null;
    if (aadhaarNumber) {
      data.aadhaarNumber = aadhaarNumber;
    }

    // Extract Gender
    if (text.includes("MALE") || text.includes("Male")) {
      data.gender = "MALE";
    } else if (text.includes("FEMALE") || text.includes("Female")) {
      data.gender = "FEMALE";
    }

    // Extract Father Name (S/O or D/O)
    const fatherMatch = text.match(/S\/O\s+([A-Za-z\s]+)/i) || text.match(/D\/O\s+([A-Za-z\s]+)/i);
    if (fatherMatch && fatherMatch[1]) {
      data.fatherName = fatherMatch[1].trim();
    }

    // Extract College Name (look for common college/university keywords)
    const collegeMatch = text.match(/(?:University|College|Institute|WGSHA|School|Academy|Management)\s+([A-Za-z\s]+)/i);
    if (collegeMatch && collegeMatch[1]) {
      data.collegeName = collegeMatch[0].trim();
    }

    return data;
  }
}
