import { uploadFileToSpace } from "./uploadTos3";
import * as fs from "fs";
import * as path from "path";
import PDFDocument from "pdfkit";
import { AgreementType, IOffer } from "../modules/offers/offer.interface";

export const generateOfferPDF = async (offer: IOffer) => {
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

    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#f4f4f4");

    const containerLeft = 40;
    const containerRight = 40;
    const containerWidth = doc.page.width - containerLeft - containerRight;
    doc
      .rect(containerLeft, 40, containerWidth, doc.page.height - 80)
      .fill("#fff")
      .strokeColor("#ddd")
      .lineWidth(0.5)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .fillColor("#333")
      .text("Web Development Project Details", containerLeft, 50, {
        align: "center",
        underline: false,
      })
      .moveDown(1);

    let yPosition = 100;

    const drawTableRow = (
      label: string,
      value: string,
      isHeader: boolean = false
    ) => {
      const headerBackground = "#f9f9f9";
      const rowUnderlineColor = "#888";
      const rowUnderlineWidth = 1;

      const leftColumnMargin = 20;
      const rightColumnMargin = 20;
      const leftColumnX = containerLeft + leftColumnMargin;
      const leftColumnWidth = 170;
      const rightColumnX = leftColumnX + leftColumnWidth + 10;

      const rightColumnWidth = containerWidth - leftColumnWidth - 10;

      const leftColumnColor =
        isHeader || label.includes("Milestone") ? "#f4f4f4" : "#f4f4f4";

      // Header cell (left column)
      doc
        .rect(leftColumnX, yPosition, leftColumnWidth, 25)
        .fill(leftColumnColor);

      doc
        .font("Helvetica-Bold")
        .fontSize(12)
        .fillColor("#333")
        .text(label, leftColumnX + 5, yPosition + 7);

      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("#333")
        .text(value, rightColumnX, yPosition + 7);

      doc
        .moveTo(leftColumnX, yPosition + 25)
        .lineTo(containerLeft + containerWidth, yPosition + 25)
        .strokeColor(rowUnderlineColor)
        .lineWidth(rowUnderlineWidth)
        .stroke();

      yPosition += 25;
    };
    drawTableRow("Project", offer.projectName, true);
    drawTableRow("Description", offer.description, true);
    drawTableRow("Agreement Type", offer.agreementType.replace("_", " "), true);

    switch (offer.agreementType) {
      case AgreementType.FlatFee:
        if (offer.flatFee) {
          drawTableRow(
            "Total Price",
            `$${parseFloat(offer.flatFee.price as unknown as string).toFixed(
              2
            )}`,
            true
          );
          drawTableRow("Revisions", `${offer.flatFee.revision}`);
          drawTableRow("Delivery Time", `${offer.flatFee.delivery} days`);
        }
        break;

      case AgreementType.HourlyFee:
        if (offer.hourlyFee) {
          drawTableRow(
            "Price Per Hour",
            `$${parseFloat(
              offer.hourlyFee.pricePerHour as unknown as string
            ).toFixed(2)}`
          );
          drawTableRow("Revisions", `${offer.hourlyFee.revision}`);
          drawTableRow("Delivery Time", `${offer.hourlyFee.delivery} days`);
        }
        break;

      case AgreementType.Milestone:
        if (offer.milestones?.length) {
          drawTableRow(
            "Total Price",
            `$${offer.milestones
              .reduce(
                (sum: any, m: { price: any }) =>
                  parseFloat(sum) + parseFloat(m.price),
                0
              )
              .toFixed(2)}`,
            true
          );
          offer.milestones.forEach(
            (
              milestone: { title: any; price: number; delivery: any },
              index: number
            ) => {
              drawTableRow(
                `Milestone ${index + 1}`,
                `${milestone.title} - $${parseFloat(
                  milestone.price as unknown as string
                ).toFixed(2)} - ${milestone.delivery} days`
              );
            }
          );
        }
        break;

      default:
        drawTableRow("Details", "No specific details available.");
    }

    doc.end();
    await new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => resolve());
      writeStream.on("error", (error) => reject(error));
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
