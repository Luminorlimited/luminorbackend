"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.generateOfferPDF = void 0;
const uploadTos3_1 = require("./uploadTos3");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const offer_interface_1 = require("../modules/offers/offer.interface");
const generateOfferPDF = (offer) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const fileName = `offer_${Date.now()}.pdf`;
        const filePath = path.join(__dirname, "..", "uploads", fileName);
        if (!fs.existsSync(path.dirname(filePath))) {
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        const doc = new pdfkit_1.default({
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
        const drawTableRow = (label, value, isHeader = false) => {
            const headerBackground = "#f9f9f9";
            const rowUnderlineColor = "#888";
            const rowUnderlineWidth = 1;
            const leftColumnMargin = 20;
            const rightColumnMargin = 20;
            const leftColumnX = containerLeft + leftColumnMargin;
            const leftColumnWidth = 170;
            const rightColumnX = leftColumnX + leftColumnWidth + 10;
            const rightColumnWidth = containerWidth - leftColumnWidth - 10;
            const leftColumnColor = isHeader || label.includes("Milestone") ? "#f4f4f4" : "#f4f4f4";
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
            case offer_interface_1.AgreementType.FlatFee:
                if (offer.flatFee) {
                    drawTableRow("Total Price", `$${parseFloat(offer.flatFee.price).toFixed(2)}`, true);
                    drawTableRow("Revisions", `${offer.flatFee.revision}`);
                    drawTableRow("Delivery Time", `${offer.flatFee.delivery} days`);
                }
                break;
            case offer_interface_1.AgreementType.HourlyFee:
                if (offer.hourlyFee) {
                    drawTableRow("Price Per Hour", `$${parseFloat(offer.hourlyFee.pricePerHour).toFixed(2)}`);
                    drawTableRow("Revisions", `${offer.hourlyFee.revision}`);
                    drawTableRow("Delivery Time", `${offer.hourlyFee.delivery} days`);
                }
                break;
            case offer_interface_1.AgreementType.Milestone:
                if ((_a = offer.milestones) === null || _a === void 0 ? void 0 : _a.length) {
                    drawTableRow("Total Price", `$${offer.milestones
                        .reduce((sum, m) => parseFloat(sum) + parseFloat(m.price), 0)
                        .toFixed(2)}`, true);
                    offer.milestones.forEach((milestone, index) => {
                        drawTableRow(`Milestone ${index + 1}`, `${milestone.title} - $${parseFloat(milestone.price).toFixed(2)} - ${milestone.delivery} days`);
                    });
                }
                break;
            default:
                drawTableRow("Details", "No specific details available.");
        }
        doc.end();
        yield new Promise((resolve, reject) => {
            writeStream.on("finish", resolve);
            writeStream.on("error", reject);
        });
        const uploadedURL = yield (0, uploadTos3_1.uploadFileToSpace)({
            buffer: fs.readFileSync(filePath),
            originalname: fileName,
            mimetype: "application/pdf",
        }, "offers");
        fs.unlinkSync(filePath);
        return uploadedURL;
    }
    catch (error) {
        console.error("Error generating or uploading PDF:", error);
        throw error;
    }
});
exports.generateOfferPDF = generateOfferPDF;
