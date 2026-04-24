"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDate = formatDate;
exports.numberToWords = numberToWords;
exports.calculateMonths = calculateMonths;
exports.generateAgreementDocx = generateAgreementDocx;
exports.generateAgreementFromTemplate = generateAgreementFromTemplate;
const docxtemplater_1 = require("docxtemplater");
const pizzip_1 = require("pizzip");
const fs = require("fs");
const path = require("path");
const buffer_1 = require("buffer");
const number_to_words_1 = require("number-to-words");
const TEMPLATE_FILE_NAME = "rent_agreement_template.docx";
function normalizeDateInput(date) {
    return date instanceof Date ? date : new Date(date);
}
function formatDate(date) {
    const d = normalizeDateInput(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
}
function numberToWords(amount) {
    const numericAmount = Number(amount);
    const safeAmount = Number.isFinite(numericAmount) ? Math.max(0, Math.round(numericAmount)) : 0;
    return (0, number_to_words_1.toWords)(safeAmount).replace(/-/g, " ");
}
function calculateMonths(start, end) {
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
function extractTemplateVariables(zip) {
    const variableSet = new Set();
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
async function generateAgreementDocx(data) {
    try {
        const templatePath = path.resolve(process.cwd(), "templates", TEMPLATE_FILE_NAME);
        const templateExtension = path.extname(templatePath).toLowerCase();
        console.log("Using template:", templatePath);
        console.log("[Template] Extension:", templateExtension);
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template file not found at: ${templatePath}`);
        }
        const templateStats = fs.statSync(templatePath);
        console.log("[Template] Exists:", true);
        console.log("[Template] Size (bytes):", templateStats.size);
        if (templateExtension !== ".docx") {
            throw new Error(`Invalid template extension "${templateExtension}". Docxtemplater supports only .docx files.`);
        }
        const templateContent = fs.readFileSync(templatePath);
        const isZipContainer = templateContent.length >= 4 &&
            templateContent[0] === 0x50 &&
            templateContent[1] === 0x4b &&
            templateContent[2] === 0x03 &&
            templateContent[3] === 0x04;
        if (!isZipContainer) {
            throw new Error(`Template at ${templatePath} is not a valid .docx zip container.`);
        }
        const zip = new pizzip_1.default(templateContent);
        const templateVariables = extractTemplateVariables(zip);
        console.log("[Template] Variables detected:", templateVariables.join(", "));
        const renderData = { ...data };
        const missingVariables = [];
        for (const variable of templateVariables) {
            if (!(variable in renderData)) {
                missingVariables.push(variable);
                renderData[variable] = "N/A";
            }
        }
        if (missingVariables.length > 0) {
            console.warn(`[Template] Missing values supplied for: ${missingVariables.join(", ")}. Using N/A fallback.`);
        }
        const doc = new docxtemplater_1.default(zip, {
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
        try {
            doc.render(renderData);
        }
        catch (renderError) {
            console.error("[Template] Error rendering DOCX template:", renderError);
            if (renderError.properties && renderError.properties.errors) {
                const errors = renderError.properties.errors;
                console.error("[Template] Template errors:", JSON.stringify(errors, null, 2));
                errors.forEach((err) => {
                    if (err.tag) {
                        console.error(`[Template] Problematic tag found: ${err.tag} at position ${err.offset}`);
                    }
                });
            }
            throw new Error(`DOCX template rendering failed: ${renderError.message}`);
        }
        const generatedBuffer = doc.getZip().generate({
            type: "nodebuffer",
            compression: "DEFLATE",
        });
        console.log("[Template] Output size (bytes):", generatedBuffer.length);
        console.log("[Template] DOCX agreement generated successfully");
        return buffer_1.Buffer.from(generatedBuffer);
    }
    catch (error) {
        console.error("[Template] Error generating agreement from DOCX template:", error.message);
        throw error;
    }
}
async function generateAgreementFromTemplate(data) {
    return generateAgreementDocx(data);
}
//# sourceMappingURL=agreement-template.service.js.map