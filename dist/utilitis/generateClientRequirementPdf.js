"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePDFs = void 0;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uploadTos3_1 = require("./uploadTos3"); // Assuming this is your upload logic
const mergePDFs = (files, // Array of files (could be empty)
caption, // Single caption string
additionalMessage // Single additional message string
) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Define the local file path for the merged PDF
        const fileName = `merged_${Date.now()}.pdf`;
        const filePath = path_1.default.join(__dirname, "..", "uploads", fileName);
        // Create the uploads folder if it doesn't exist
        if (!fs_1.default.existsSync(path_1.default.dirname(filePath))) {
            fs_1.default.mkdirSync(path_1.default.dirname(filePath), { recursive: true });
        }
        // Initialize a new PDF document
        const mergedDoc = new pdfkit_1.default();
        // Write the merged PDF to the local file system
        const writeStream = fs_1.default.createWriteStream(filePath);
        mergedDoc.pipe(writeStream);
        // Add the caption to the first page
        if (caption) {
            mergedDoc
                .fontSize(14)
                .text(caption, { align: "center", underline: true })
                .moveDown(); // Move down after the caption
        }
        // Add space between caption and files or additional message
        const spaceBetweenCaptionAndContent = 1.5; // Adjust space as needed
        mergedDoc.moveDown(spaceBetweenCaptionAndContent);
        // If files are provided, embed each file in the PDF
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const pdfBuffer = file.buffer; // Buffer of the uploaded file
                // Add the file content
                mergedDoc.image(pdfBuffer, {
                    fit: [500, 700], // Fit the image within this dimension
                    align: "center",
                    valign: "center",
                });
                // Add space after each file (optional)
                if (i < files.length - 1) {
                    mergedDoc.addPage(); // Add a new page if more than one file
                }
            }
        }
        // If there are no files, just add space for the additional message
        if (files.length === 0) {
            mergedDoc.moveDown(spaceBetweenCaptionAndContent);
        }
        else {
            // After files, continue on the same page for the additional message
            mergedDoc.addPage(); // Ensure that additional message starts from a new page if files exist
        }
        // Add the additional message (plain text with no header or underline)
        if (additionalMessage) {
            mergedDoc
                .fontSize(12)
                .text(additionalMessage, { align: "left" }); // Plain text for the additional message
        }
        // End the PDF document
        mergedDoc.end();
        // Wait for the file to be completely written
        yield new Promise((resolve, reject) => {
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
        });
        // Upload the merged PDF to DigitalOcean Spaces
        const uploadedURL = yield (0, uploadTos3_1.uploadFileToSpace)({
            buffer: fs_1.default.readFileSync(filePath),
            originalname: fileName,
            mimetype: "application/pdf",
        }, "merged-pdfs");
        // Optionally delete the local file after uploading
        fs_1.default.unlinkSync(filePath);
        return uploadedURL;
    }
    catch (error) {
        console.error("Error merging or uploading PDF:", error);
        throw error;
    }
});
exports.mergePDFs = mergePDFs;
