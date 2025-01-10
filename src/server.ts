import mongoose from "mongoose";
import config from "./config";
import { createServer } from "http";
import app from "./app";
import { Server } from "socket.io";
import { Message } from "./modules/messages/messages.model";
import { Notification } from "./modules/notification/notification.model";
import { ENUM_NOTIFICATION_STATUS } from "./enums/notificationStatus";
import { NotificationCreateResponse } from "./modules/notification/notification.interface";
import { calculateTotalPrice } from "./utilitis/calculateTotalPrice";
import { generateOfferPDF } from "./utilitis/generateOfferPdf";
import { Offer } from "./modules/offers/offer.model";
import { uploadFileToSpace } from "./utilitis/uploadTos3";
import { Nimble } from "aws-sdk";
import { zoomService } from "./modules/zoom/zoom.service";

const options = {
  autoIndex: true,
};

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  transports: ["polling", "websocket"],
  pingInterval: 25000,
  pingTimeout: 60000,
  upgradeTimeout: 30000,
});

// Store socket IDs for users
const users: { [key: string]: string } = {};

io.on("connection", (socket) => {
  // Register the user with their email and socket ID
  socket.on("register", (data: any) => {
    const { email } = JSON.parse(data);
    console.log(email);

    users[email] = socket.id;
    console.log(users[email]);
  });

  // Private messaging between users6
  socket.on("privateMessage", async (data: any) => {
    console.log(users);
    const { toEmail, message = null, fromEmail, media } = JSON.parse(data);
    const toSocketId = users[toEmail];
    // console.log(toSocketId);

    // const fromSocketId = users[fromEmail];

    if (!fromEmail) {
      socket.send(JSON.stringify({ error: "email is required" }));
    }

    try {
      let mediaUrl = null;
      if (media) {
        let mediaBuffer = Buffer.from(media, "base64");
        mediaUrl = await uploadFileToSpace(mediaBuffer, "privateMessageFile");
      }
      const savedMessage = await Message.create({
        sender: fromEmail,
        message: message,
        medai: mediaUrl,
        recipient: toEmail,
      });

      if (toSocketId) {
        socket.to(toSocketId).emit("privateMessage", {
          message: savedMessage,
        });
      }
      socket.emit("privateMessage", {
        message: savedMessage,
      });
    } catch (error) {}
  });
  // const message = {
  //   toEmail: "b@mail.com",
  //   message: "Hello, this is a test message",
  //   fromEmail: "a@mail.com",

  // };
  // socket.emit("privateMessage", JSON.stringify(message))
  // Notification event
  socket.on("notification", async ({ toEmail, message, fromEmail, type }) => {
    const toSocketId = users[toEmail];

    // const fromSocketId = users[fromEmail];

    if (!fromEmail) {
      socket.send(JSON.stringify({ error: "email is required" }));
    }

    try {
      const notification = await Notification.create({
        recipient: toEmail,
        sender: fromEmail,
        message: message,
        status: ENUM_NOTIFICATION_STATUS.UNSEEN,
        type: type,
      });

      const notificationResponse: NotificationCreateResponse = {
        success: true,
        statusCode: 200,
        message: "Notification saved successfully",
        data: notification.toObject(),
      };

      // const notificationId = notificationData._id;
      if (toSocketId) {
        socket.to(toSocketId).emit("notification", {
          from: fromEmail,
          message,

          type: type,
        });
      }
    } catch (error) {
      socket.emit("notificationError", "Failed to create notification");
    }
  });

  socket.on("sendOffer", async (data: any) => {
    const { toEmail, offer, fromEmail } = JSON.parse(data);
    const toSocketId = users[toEmail];
    try {
      offer.totalPrice = calculateTotalPrice(data);
      const offerPDFPath = await generateOfferPDF(data);
      offer.orderAgreementPDF = offerPDFPath;
      const newOffer = await Offer.create(offer);
      if (toSocketId) {
        socket.to(toSocketId).emit("sendOffer", {
          from: fromEmail,
          offer: newOffer,
        });
      }
    } catch (error) {
      socket.emit("sendoffer error ", "Failed to create effor");
    }
  });
  socket.on("createZoomMeeting", async (data: any) => {
    const { fromEmail, toEmail } = JSON.parse(data);
    const toSocketId = users[toEmail];

    try {
      const meeting = await zoomService.createZoomMeeting();
      if (!meeting || !meeting.start_url || !meeting.join_url) {
        throw new Error("Invalid Zoom meeting data");
      }
      const { start_url, join_url } = meeting;

      const savedMessage = await Message.create({
        sender: fromEmail,
        recipient: toEmail,
        message: "Zoom meeting invitation",
        media: null,
        meetingLink: join_url,
      });

      if (toSocketId) {
        socket.to(toSocketId).emit("zoomMeeting", {
          from: fromEmail,
          join_url,
        });
      }
      socket.emit("zoomMeeting", {
        start_url,
      });
    } catch (error) {
      console.error("Error creating Zoom meeting:", error);
      socket.emit("zoomMeetingError", "Failed to create Zoom meeting");
    }
  });

  // Handle disconnection of users
  socket.on("disconnect", (reason) => {
    for (const email in users) {
      if (users[email] === socket.id) {
        delete users[email];
        break;
      }
    }
  });

  socket.on("error", (error) => {});
});

async function bootstrap() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      "mongodb+srv://luminor:BYcHOYLQI2eiZ9IU@cluster0.v0ciw.mongodb.net/luminor?retryWrites=true&w=majority&appName=Cluster0" as string,
      options
    );
    console.log(config.database_url, "check data base url");
    console.log("Connected to MongoDB successfully.");

    // Start the server
    httpServer.listen(config.port, () => {
      console.log(`Server running at port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

bootstrap();
