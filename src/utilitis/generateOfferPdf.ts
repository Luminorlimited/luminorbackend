import { uploadFileToSpace } from "./uploadTos3";
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { AgreementType, IOffer } from "../modules/offers/offer.interface";

export const generateOfferPDF = async (offer: IOffer) => {
  //console.log(offer, "check offer")
  try {
    const fileName = `offer_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, "..", "uploads", fileName);

    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    const doc = new PDFDocument({
      size: "A4",
      margin: 30,
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Add container-like background
    doc
      .rect(0, 0, doc.page.width, doc.page.height)
      .fill("#f4f4f4");

    // Add styled container with padding (adjusted for both sides)
    const containerLeft = 40;  // Left margin for the container
    const containerRight = 40;  // Right margin for the container
    const containerWidth = doc.page.width - containerLeft - containerRight;
    doc
      .rect(containerLeft, 40, containerWidth, doc.page.height - 80)
      .fill("#fff")
      .strokeColor("#ddd")
      .lineWidth(0.5)
      .stroke();

    // Title inside the white container
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#333")
      .text("Web Development Project Details", containerLeft, 50, { align: "center", underline: false })
      .moveDown(1);

    // Line tracker
    let yPosition = 100;

    // Helper to draw table rows with padding
    const drawTableRow = (
      label: string,
      value: string,
      isHeader: boolean = false
    ) => {
      const headerBackground = "#f9f9f9"; // Background color for the header cells
      const rowUnderlineColor = "#888"; // Darker color for the row underline to make it more visible
      const rowUnderlineWidth = 1; // Thicker line for better visualization

      const leftColumnMargin = 20; // Margin from the left for the first column
      const rightColumnMargin=20
      const leftColumnX = containerLeft + leftColumnMargin; // Push the left column with margin
      const leftColumnWidth = 170; // Width of the left column
      const rightColumnX = leftColumnX + leftColumnWidth + 10; 
      // const rightColumnX = containerLeft + rightColumnMargin + 10; // Adding some space between first and second columns (10px)
      const rightColumnWidth = containerWidth - leftColumnWidth - 10; // Adjust the width of the second column

      const leftColumnColor = isHeader || label.includes('Milestone') ? "#f4f4f4" : "#f4f4f4"; // Deeper gray for left column in milestones

      // Header cell (left column)
      doc
        .rect(leftColumnX, yPosition, leftColumnWidth, 25) // Apply background only to the left column
        .fill(leftColumnColor);

      // Label (header or left column text)
      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#333")
        .text(label, leftColumnX + 5, yPosition + 7); // Added padding inside the cell

      // Value cell (right column text)
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#333")
        .text(value, rightColumnX, yPosition + 7); // Right column text with some margin

      // Underline for the row with deeper color and thicker line
      doc
        .moveTo(leftColumnX, yPosition + 25)
        .lineTo(containerLeft + containerWidth, yPosition + 25) // Ensure the line fits within the container
        .strokeColor(rowUnderlineColor) // Darker color for the underline
        .lineWidth(rowUnderlineWidth) // Thicker line for the row underline
        .stroke();

      yPosition += 25;
    };

    // Draw rows with headers styled
    drawTableRow("Project", offer.projectName, true);
    drawTableRow("Description", offer.description, true);
    drawTableRow("Agreement Type", offer.agreementType.replace("_", " "), true);

    // Agreement-specific details
    switch (offer.agreementType) {
      case AgreementType.FlatFee:
        if (offer.flatFee) {
        //  console.log(offer.flatFee, "check offer float fee")
          drawTableRow("Total Price", `$${parseFloat(offer.flatFee.price as unknown as string).toFixed(2)}`, true);
          drawTableRow("Revisions", `${offer.flatFee.revision}`);
          drawTableRow("Delivery Time", `${offer.flatFee.delivery} days`);
        }
        break;

      case AgreementType.HourlyFee:
        if (offer.hourlyFee) {
          drawTableRow("Price Per Hour", `$${parseFloat(offer.hourlyFee.pricePerHour as unknown as string).toFixed(2)}`);
          drawTableRow("Revisions", `${offer.hourlyFee.revision}`);
          drawTableRow("Delivery Time", `${offer.hourlyFee.delivery} days`);
        }
        break;

      case AgreementType.Milestone:
        if (offer.milestones?.length) {
          drawTableRow("Total Price", `$${offer.milestones.reduce((sum: any, m: { price: any; }) => parseFloat(sum) + parseFloat(m.price), 0).toFixed(2)}`, true);
          offer.milestones.forEach((milestone: { title: any; price: number; delivery: any; }, index: number) => {
            drawTableRow(
              `Milestone ${index + 1}`,
              `${milestone.title} - $${parseFloat(milestone.price as unknown as string).toFixed(2)} - ${milestone.delivery} days`
            );
          });
        }
        break;

      default:
        drawTableRow("Details", "No specific details available.");
    }

    doc.end();

    // Save and Upload PDF
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    const uploadedURL = await uploadFileToSpace(
      {
        buffer: fs.readFileSync(filePath),
        originalname: fileName,
        mimetype: "application/pdf",
      },
      "offers"
    );

    fs.unlinkSync(filePath);

    return uploadedURL;
  } catch (error) {
    console.error("Error generating or uploading PDF:", error);
    throw error;
  }
};
