import mongoose from "mongoose";
import config from "./config";
import { createServer } from "http";
import app from "./app";
import { Server } from "socket.io";
import { Message } from "./modules/messages/messages.model";
import { Notification } from "./modules/notification/notification.model";
import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "./enums/notificationStatus";
import {
  INotification,
  NotificationCreateResponse,
} from "./modules/notification/notification.interface";
import { calculateTotalPrice } from "./utilitis/calculateTotalPrice";
import { generateOfferPDF } from "./utilitis/generateOfferPdf";
import { Offer } from "./modules/offers/offer.model";
import { uploadFileToSpace } from "./utilitis/uploadTos3";
import { Nimble } from "aws-sdk";
import { zoomService } from "./modules/zoom/zoom.service";
import { OfferService } from "./modules/offers/offer.service";
import { User } from "./modules/auth/auth.model";
import { MessageService } from "./modules/messages/messages.service";
import { NotificationService } from "./modules/notification/notification.service";

const options = {
  autoIndex: true,
};

const httpServer = createServer(app);
export const io = new Server(httpServer, {
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
export const onlineUsers = new Map<string, boolean>();

io.on("connection", (socket) => {
  socket.on("register", async (data: any) => {
    const { email } = JSON.parse(data);
    // console.log(email)
    users[email] = socket.id;
    // console.log(users[email]);
    onlineUsers.set(email, true);

    const conversationList = await MessageService.getConversationLists(email);
    console.log(conversationList,"check convirsation list")


    socket.emit("conversation-list", conversationList);
  });

  socket.on("privateMessage", async (data: any) => {
    // console.log(users);
    const { toEmail, message, fromEmail, media, mediaUrl } = JSON.parse(data);

    const toSocketId = users[toEmail];

    if (!fromEmail) {
      socket.send(JSON.stringify({ error: "email is required" }));
    }

    try {
      const savedMessage = await MessageService.createMessage({
        sender: fromEmail,
        message: message || null,
        media: mediaUrl || null,

        recipient: toEmail,
      });
      const notificatnionBody: INotification = {
        recipient: toEmail as string,
        sender: fromEmail as string,
        message: `${fromEmail} send you a message`,
        type: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
        status: ENUM_NOTIFICATION_STATUS.UNSEEN,
      };
      await NotificationService.createNotification(
        notificatnionBody,
        "message-notification"
      );
 
      if (toSocketId) {
        const toEmailConvisationList =
          await MessageService.getConversationLists(toEmail);
        socket.to(toSocketId).emit("conversation-list", toEmailConvisationList);
        socket.to(toSocketId).emit("privateMessage", {
          message: savedMessage,
          fromEmail: fromEmail,
          
        });
      }
      const fromEmailConvirsationList =
        await MessageService.getConversationLists(fromEmail);
      socket.emit("conversation-list", fromEmailConvirsationList);
      socket.emit("privateMessage", {
        message: savedMessage,
        fromEmail: fromEmail,
        // convirsationList:fromEmailConvirsationList
      });
      
    
      
    } catch (error) {}
  });

  socket.on("sendOffer", async (data: any) => {
    const { toEmail, offer, fromEmail } = JSON.parse(data);
    // console.log(toEmail, "the reciver")
    // console.log(fromEmail, "the initator")
    // console.log(offer, "the check offer")
    const toSocketId = users[toEmail];
    // console.log(data,"from send offer")
    // console.log(offer,"check offer")
    // console.log(toSocketId, "check socket id to email")
    try {
      offer.totalPrice = calculateTotalPrice(offer);
      const offerPDFPath = await generateOfferPDF(offer);
      offer.orderAgreementPDF = offerPDFPath;
      const totalOffer = {
        ...offer,
        clientEmail: toEmail,
        professionalEmail: fromEmail,
      };
      const newOffer = await OfferService.createOffer(totalOffer);

      if (toSocketId) {
        socket.to(toSocketId).emit("sendOffer", {
          from: fromEmail,
          offer: newOffer,
        });
        const notificatnionBody: INotification = {
          recipient: offer.clientEmail as string,
          sender: offer.professionalEmail as string,
          message: `${offer.professionalEmail} send you a offer`,
          type: ENUM_NOTIFICATION_TYPE.OFFER,
          status: ENUM_NOTIFICATION_STATUS.UNSEEN,
        };

        await NotificationService.createNotification(
          notificatnionBody,
          "offer-notification"
        );
      }
    } catch (error) {
      socket.emit("sendoffer error ", "Failed to create effor");
    }
  });
  socket.on("createZoomMeeting", async (data: any) => {
    const { fromEmail, toEmail } = JSON.parse(data);
    // console.log(data, "from zoom meeting")
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
        message: join_url,
        media: null,
        meetingLink: join_url,
      });

      if (toSocketId) {
        socket.to(toSocketId).emit("createZoomMeeting", {
          from: fromEmail,
          savedMessage,
        });
      }
      savedMessage.meetingLink = start_url;
      savedMessage.message = start_url;
      socket.emit("createZoomMeeting", {
        savedMessage,
      });
    } catch (error) {
      console.error("Error creating Zoom meeting:", error);
      socket.emit("zoomMeetingError", "Failed to create Zoom meeting");
    }
  });

  socket.on("disconnect", async (reason) => {
    let email = "";
    for (let [userEmail, isOnline] of onlineUsers) {
      if (socket.id === users[userEmail]) {
        email = userEmail;
        break;
      }
    }

    if (email) {
      onlineUsers.set(email, false);
      delete users[email];
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
    // console.log(config.database_url, "check data base url");
    console.log("Connected to MongoDB successfully.");
    await MessageService.countMessages("tamim@example.com");
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
