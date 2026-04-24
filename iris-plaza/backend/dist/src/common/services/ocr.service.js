"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var OcrService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OcrService = void 0;
const common_1 = require("@nestjs/common");
const Tesseract = require('tesseract.js');
const pdf = require('pdf-parse');
let OcrService = OcrService_1 = class OcrService {
    constructor() {
        this.logger = new common_1.Logger(OcrService_1.name);
    }
    async extractFromImage(buffer) {
        try {
            const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
            return this.parseText(text);
        }
        catch (error) {
            this.logger.error('Error during image OCR:', error);
            throw new Error('Failed to process image screenshot');
        }
    }
    async extractFromPdf(buffer) {
        try {
            const data = await pdf(buffer);
            return this.parseText(data.text);
        }
        catch (error) {
            this.logger.error('Error during PDF extraction:', error);
            throw new Error('Failed to process PDF screenshot');
        }
    }
    async extractDocumentFromImage(buffer) {
        try {
            const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
            return this.parseDocumentText(text);
        }
        catch (error) {
            this.logger.error('Error during document OCR:', error);
            throw new Error('Failed to process document image');
        }
    }
    parseText(text) {
        const data = {
            rawText: text,
        };
        const amountRegex = /(?:₹|Rs\.?|Amount:?)\s?([\d,]+(?:\.\d{2})?)/i;
        const amountMatch = text.match(amountRegex);
        if (amountMatch) {
            data.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
        }
        const txnRegex = /(?:Transaction\sID|Txn\sID|Google\sTransaction\sID|Ref\sNo|Reference\sNo)[:\s]*([A-Za-z0-9_-]+)/i;
        const txnMatch = text.match(txnRegex);
        if (txnMatch) {
            data.transactionId = txnMatch[1].trim();
        }
        const upiRegex = /[a-zA-Z0-9.\-_]+@[a-zA-Z0-9.\-_]+/g;
        const upiMatches = text.match(upiRegex);
        if (upiMatches) {
            data.upiId = upiMatches[0];
        }
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
    parseDocumentText(text) {
        const data = {
            rawText: text,
        };
        const aadhaarNumber = text.match(/\d{4}\s?\d{4}\s?\d{4}/)?.[0]?.replace(/\s/g, '') || null;
        if (aadhaarNumber) {
            data.aadhaarNumber = aadhaarNumber;
        }
        if (text.includes("MALE") || text.includes("Male")) {
            data.gender = "MALE";
        }
        else if (text.includes("FEMALE") || text.includes("Female")) {
            data.gender = "FEMALE";
        }
        const fatherMatch = text.match(/S\/O\s+([A-Za-z\s]+)/i) || text.match(/D\/O\s+([A-Za-z\s]+)/i);
        if (fatherMatch && fatherMatch[1]) {
            data.fatherName = fatherMatch[1].trim();
        }
        const collegeMatch = text.match(/(?:University|College|Institute|WGSHA|School|Academy|Management)\s+([A-Za-z\s]+)/i);
        if (collegeMatch && collegeMatch[1]) {
            data.collegeName = collegeMatch[0].trim();
        }
        return data;
    }
};
exports.OcrService = OcrService;
exports.OcrService = OcrService = OcrService_1 = __decorate([
    (0, common_1.Injectable)()
], OcrService);
//# sourceMappingURL=ocr.service.js.map