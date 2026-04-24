"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const docx_1 = require("docx");
const fs = require("fs");
const path = require("path");
async function generateDocxTemplate() {
    const doc = new docx_1.Document({
        sections: [
            {
                properties: {},
                children: [
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.CENTER,
                        heading: docx_1.HeadingLevel.TITLE,
                        children: [
                            new docx_1.TextRun({
                                text: "RENTAL AGREEMENT",
                                bold: true,
                                size: 44,
                            }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.LEFT,
                        children: [
                            new docx_1.TextRun({
                                text: "This Rental Agreement is made on {{agreement_date}}",
                                size: 22,
                            }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        alignment: docx_1.AlignmentType.LEFT,
                        children: [
                            new docx_1.TextRun({
                                text: "BETWEEN",
                                bold: true,
                                size: 22,
                            }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({
                                text: "LANDLORD/OWNER: Iris Plaza Management",
                                bold: true,
                                size: 22,
                            }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({
                                text: "TENANT DETAILS:",
                                bold: true,
                                size: 22,
                            }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Table({
                        rows: [
                            new docx_1.TableRow({
                                children: [
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "Name:", bold: true, size: 20 })] })],
                                        width: { size: 30, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "{{tenant_name}}", size: 20 })] })],
                                        width: { size: 70, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                ],
                            }),
                            new docx_1.TableRow({
                                children: [
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "Relation:", bold: true, size: 20 })] })],
                                        width: { size: 30, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "{{relation}}", size: 20 })] })],
                                        width: { size: 70, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                ],
                            }),
                            new docx_1.TableRow({
                                children: [
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "Father's Name:", bold: true, size: 20 })] })],
                                        width: { size: 30, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "{{father_name}}", size: 20 })] })],
                                        width: { size: 70, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                ],
                            }),
                            new docx_1.TableRow({
                                children: [
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "Address:", bold: true, size: 20 })] })],
                                        width: { size: 30, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "{{tenant_address}}", size: 20 })] })],
                                        width: { size: 70, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                ],
                            }),
                            new docx_1.TableRow({
                                children: [
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "Aadhaar Number:", bold: true, size: 20 })] })],
                                        width: { size: 30, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "{{aadhaar_number}}", size: 20 })] })],
                                        width: { size: 70, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                ],
                            }),
                            new docx_1.TableRow({
                                children: [
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "College/Institution:", bold: true, size: 20 })] })],
                                        width: { size: 30, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                    new docx_1.TableCell({
                                        children: [new docx_1.Paragraph({ children: [new docx_1.TextRun({ text: "{{college_name}}", size: 20 })] })],
                                        width: { size: 70, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                ],
                            }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({
                                text: "PROPERTY DETAILS:",
                                bold: true,
                                size: 24,
                            }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: "Room Number: {{room_number}}", size: 22 }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: "Floor: {{floor}}", size: 22 }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: "Agreement Period: {{start_date}} to {{end_date}}", size: 22 }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: "Agreement Duration: {{agreement_months}} months", size: 22 }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({
                                text: "RENTAL TERMS:",
                                bold: true,
                                size: 24,
                            }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: "Monthly Rent (Rs.): {{rent_amount}}", size: 22 }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: "Monthly Rent in Words: {{rent_amount_words}}", size: 22 }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: "Security Deposit (Rs.): {{deposit_amount}}", size: 22 }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({
                        children: [
                            new docx_1.TextRun({ text: "Security Deposit in Words: {{deposit_amount_words}}", size: 22 }),
                        ],
                    }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Paragraph({ text: "" }),
                    new docx_1.Table({
                        rows: [
                            new docx_1.TableRow({
                                children: [
                                    new docx_1.TableCell({
                                        children: [
                                            new docx_1.Paragraph({
                                                children: [new docx_1.TextRun({ text: "Landlord Signature", bold: true, size: 20 })],
                                            }),
                                            new docx_1.Paragraph({ text: "" }),
                                            new docx_1.Paragraph({ text: "" }),
                                            new docx_1.Paragraph({
                                                children: [new docx_1.TextRun({ text: "_________________________", size: 20 })],
                                            }),
                                        ],
                                        width: { size: 50, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                    new docx_1.TableCell({
                                        children: [
                                            new docx_1.Paragraph({
                                                children: [new docx_1.TextRun({ text: "Tenant Signature", bold: true, size: 20 })],
                                            }),
                                            new docx_1.Paragraph({ text: "" }),
                                            new docx_1.Paragraph({ text: "" }),
                                            new docx_1.Paragraph({
                                                children: [new docx_1.TextRun({ text: "_________________________", size: 20 })],
                                            }),
                                        ],
                                        width: { size: 50, type: docx_1.WidthType.PERCENTAGE },
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            },
        ],
    });
    const buffer = await docx_1.Packer.toBuffer(doc);
    const templatePath = path.resolve(process.cwd(), "templates", "rent_agreement_template.docx");
    const dir = path.dirname(templatePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(templatePath, buffer);
    console.log(`DOCX Template created at: ${templatePath}`);
}
generateDocxTemplate().catch(console.error);
//# sourceMappingURL=create-docx-template.js.map