import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import * as fs from "fs";
import * as path from "path";
import { Buffer } from "buffer";
import { toWords } from "number-to-words";

const TEMPLATE_FILE_NAME = "rent_agreement_template.docx";

function normalizeDateInput(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

// Helper function to format date as DD-MM-YYYY
export function formatDate(date: Date): string {
  const d = normalizeDateInput(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper to convert numeric amounts to words
export function numberToWords(amount: number): string {
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) ? Math.max(0, Math.round(numericAmount)) : 0;
  return toWords(safeAmount).replace(/-/g, " ");
}

// Helper function to calculate number of months between two dates
export function calculateMonths(start: Date, end: Date): number {
  const startDate = normalizeDateInput(start);
  const endDate = normalizeDateInput(end);

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }

  if (endDate <= startDate) {
    return 0;
  }

  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  const totalMonths = years * 12 + months;

  return Math.max(totalMonths, 1);
}

// Agreement data interface - matching the placeholders in the DOCX template
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

function extractTemplateVariables(zip: PizZip): string[] {
  const variableSet = new Set<string>();
  const variablePattern = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

  for (const fileName of Object.keys(zip.files)) {
    if (!fileName.startsWith("word/") || !fileName.endsWith(".xml")) {
      continue;
    }

    const file = zip.file(fileName);
    if (!file) {
      continue;
    }

    const xml = file.asText();
    for (const match of xml.matchAll(variablePattern)) {
      variableSet.add(match[1]);
    }
  }

  return Array.from(variableSet).sort();
}

/**
 * Generate a DOCX agreement from the template file
 * Loads the DOCX template, replaces placeholders with data, and returns the generated DOCX buffer
 */
export async function generateAgreementDocx(data: AgreementData): Promise<Buffer> {
  try {
    const templatePath = path.resolve(process.cwd(), "templates", TEMPLATE_FILE_NAME);
    const templateExtension = path.extname(templatePath).toLowerCase();

    console.log("Using template:", templatePath);
    console.log("[Template] Extension:", templateExtension);

    // Check if template exists
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at: ${templatePath}`);
    }

    const templateStats = fs.statSync(templatePath);
    console.log("[Template] Exists:", true);
    console.log("[Template] Size (bytes):", templateStats.size);

    if (templateExtension !== ".docx") {
      throw new Error(`Invalid template extension "${templateExtension}". Docxtemplater supports only .docx files.`);
    }

    // Fresh read for every generation to avoid stale template content.
    const templateContent = fs.readFileSync(templatePath);

    // DOCX is a ZIP container; reject mislabeled/corrupted files early.
    const isZipContainer =
      templateContent.length >= 4 &&
      templateContent[0] === 0x50 &&
      templateContent[1] === 0x4b &&
      templateContent[2] === 0x03 &&
      templateContent[3] === 0x04;

    if (!isZipContainer) {
      throw new Error(`Template at ${templatePath} is not a valid .docx zip container.`);
    }

    // Create a PizZip instance
    const zip = new PizZip(templateContent);
    const templateVariables = extractTemplateVariables(zip);
    console.log("[Template] Variables detected:", templateVariables.join(", "));

    const renderData: Record<string, string | number> = { ...data };
    const missingVariables: string[] = [];
    for (const variable of templateVariables) {
      if (!(variable in renderData)) {
        missingVariables.push(variable);
        renderData[variable] = "N/A";
      }
    }

    if (missingVariables.length > 0) {
      console.warn(`[Template] Missing values supplied for: ${missingVariables.join(", ")}. Using N/A fallback.`);
    }
    
    // Create the docxtemplater instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: {
        start: "{{",
        end: "}}",
      },
      nullGetter() {
        return "";
      },
    });
    
    // Render the document (replace placeholders with data)
    try {
      doc.render(renderData);
    } catch (renderError: any) {
      console.error("[Template] Error rendering DOCX template:", renderError);
      // Check for common template errors
      if (renderError.properties && renderError.properties.errors) {
        const errors = renderError.properties.errors;
        console.error("[Template] Template errors:", JSON.stringify(errors, null, 2));
        
        // Log specific problematic tags
        errors.forEach((err: any) => {
          if (err.tag) {
            console.error(`[Template] Problematic tag found: ${err.tag} at position ${err.offset}`);
          }
        });
      }
      throw new Error(`DOCX template rendering failed: ${renderError.message}`);
    }
    
    // Get the generated document as a buffer
    const generatedBuffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });
    
    console.log("[Template] Output size (bytes):", generatedBuffer.length);
    console.log("[Template] DOCX agreement generated successfully");
    
    return Buffer.from(generatedBuffer);
  } catch (error: any) {
    console.error("[Template] Error generating agreement from DOCX template:", error.message);
    throw error;
  }
}

// Keep for backwards compatibility - now uses DOCX
export async function generateAgreementFromTemplate(data: AgreementData): Promise<Buffer> {
  return generateAgreementDocx(data);
}
