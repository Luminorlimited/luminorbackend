import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { uploadFileToSpace } from "./uploadTos3"; // Assuming this is your upload logic

export const mergePDFs = async (
  files: any[], // Array of files (could be empty)
  caption: string, // Single caption string
  additionalMessage: string // Single additional message string
) => {
  try {
    // Define the local file path for the merged PDF
    const fileName = `merged_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "..", "uploads", fileName);

    // Create the uploads folder if it doesn't exist
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    // Initialize a new PDF document
    const mergedDoc = new PDFDocument();

    // Write the merged PDF to the local file system
    const writeStream = fs.createWriteStream(filePath);
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
    } else {
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
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    // Upload the merged PDF to DigitalOcean Spaces
    const uploadedURL = await uploadFileToSpace(
      {
        buffer: fs.readFileSync(filePath),
        originalname: fileName,
        mimetype: "application/pdf",
      },
      "merged-pdfs"
    );

    // Optionally delete the local file after uploading
    fs.unlinkSync(filePath);

    return uploadedURL;
  } catch (error) {
    console.error("Error merging or uploading PDF:", error);
    throw error;
  }
};
