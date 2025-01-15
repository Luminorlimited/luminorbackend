import { uploadFileToSpace } from "./uploadTos3";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

export const mergePDFs = async (files: any, caption: string, additionalMessage: string) => {
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

    let isFirstPage = true; // Track the first page

    // Append each uploaded file to the merged PDF
    for (const file of files) {
      const pdfBuffer = file.buffer; // Use the buffer instead of reading from path

      // Add a new page for each file, except for the first page
      if (!isFirstPage) {
        mergedDoc.addPage();
      }

      // Handle the first page with the caption
      if (isFirstPage) {
        mergedDoc
          .fontSize(14)
          .text(caption, { align: "center", underline: true })
          .moveDown(); // Add the caption at the top
        isFirstPage = false; // Mark first page as processed
      }

      // Embed the file's image content into the current page
      mergedDoc.image(pdfBuffer, {
        fit: [500, 700], // Fit the image within this dimension
        align: "center",
        valign: "center",
      });
    }

    // Add the final page for the additional message
    mergedDoc.addPage();
    mergedDoc
      .fontSize(14)
      .text("Additional Message:", { align: "center", underline: true })
      .moveDown()
      .fontSize(12)
      .text(additionalMessage, { align: "left" });

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
