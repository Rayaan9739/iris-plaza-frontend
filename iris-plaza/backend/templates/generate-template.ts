import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import * as fs from "fs";
import * as path from "path";

async function generateTemplate() {
  // Create the rental agreement template with placeholders
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.TITLE,
            children: [
              new TextRun({
                text: "RENTAL AGREEMENT",
                bold: true,
                size: 44,
              }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          
          // Agreement Date
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: "This Rental Agreement is made on {{agreement_date}}",
                size: 22,
              }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          
          // PARTIES Section
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: "BETWEEN",
                bold: true,
                size: 22,
              }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          
          // Landlord
          new Paragraph({
            children: [
              new TextRun({
                text: "LANDLORD/OWNER: Iris Plaza Management",
                bold: true,
                size: 22,
              }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          
          // Tenant Header
          new Paragraph({
            children: [
              new TextRun({
                text: "TENANT:",
                bold: true,
                size: 22,
              }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          
          // Tenant Details Table
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Name:", bold: true, size: 20 })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "{{tenant_name}}", size: 20 })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Relation:", bold: true, size: 20 })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "{{relation}}", size: 20 })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Father's Name:", bold: true, size: 20 })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "{{father_name}}", size: 20 })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Address:", bold: true, size: 20 })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "{{tenant_address}}", size: 20 })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Aadhaar Number:", bold: true, size: 20 })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "{{aadhaar_number}}", size: 20 })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "College/Institution:", bold: true, size: 20 })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "{{college_name}}", size: 20 })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          
          // PROPERTY DETAILS
          new Paragraph({
            children: [
              new TextRun({
                text: "PROPERTY DETAILS:",
                bold: true,
                size: 24,
              }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Room Number: {{room_number}}", size: 22 }),
            ],
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({ text: "Floor: {{floor}}", size: 22 }),
            ],
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({ text: "Agreement Period: {{start_date}} to {{end_date}}", size: 22 }),
            ],
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({ text: "Agreement Duration: {{agreement_months}} months", size: 22 }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          
          // RENTAL TERMS
          new Paragraph({
            children: [
              new TextRun({
                text: "RENTAL TERMS:",
                bold: true,
                size: 24,
              }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Monthly Rent: Rs. {{rent_amount}}", size: 22 }),
            ],
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({ text: "Monthly Rent in Words: {{rent_amount_words}}", size: 22 }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          
          new Paragraph({
            children: [
              new TextRun({ text: "Security Deposit: Rs. {{deposit_amount}}", size: 22 }),
            ],
          }),

          new Paragraph({ text: "" }),

          new Paragraph({
            children: [
              new TextRun({ text: "Security Deposit in Words: {{deposit_amount_words}}", size: 22 }),
            ],
          }),
          
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          new Paragraph({ text: "" }),
          
          // Signatures
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Landlord Signature", bold: true, size: 20 })],
                      }),
                      new Paragraph({ text: "" }),
                      new Paragraph({ text: "" }),
                      new Paragraph({
                        children: [new TextRun({ text: "_________________________", size: 20 })],
                      }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: "Tenant Signature", bold: true, size: 20 })],
                      }),
                      new Paragraph({ text: "" }),
                      new Paragraph({ text: "" }),
                      new Paragraph({
                        children: [new TextRun({ text: "_________________________", size: 20 })],
                      }),
                    ],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  // Generate the buffer
  const buffer = await Packer.toBuffer(doc);
  
  // Save to the runtime template location used by agreement generation.
  const templatePath = path.resolve(process.cwd(), "templates", "rent_agreement_template.docx");
  
  // Ensure directory exists
  const dir = path.dirname(templatePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(templatePath, buffer);
  console.log(`Template created at: ${templatePath}`);
}

generateTemplate().catch(console.error);
