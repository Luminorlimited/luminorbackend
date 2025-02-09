import mongoose from "mongoose";
import config from "./config";
import { createServer } from "http";
import app from "./app";
import { Server } from "socket.io";
import { Message } from "./modules/messages/messages.model";

import { calculateTotalPrice } from "./utilitis/calculateTotalPrice";
import { generateOfferPDF } from "./utilitis/generateOfferPdf";

import { zoomService } from "./modules/zoom/zoom.service";
import { OfferService } from "./modules/offers/offer.service";

import { MessageService } from "./modules/messages/messages.service";

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

export const users: { [key: string]: string } = {};
export const onlineUsers = new Map<string, boolean>();
export const userInChat = new Map<string, string | null>();

io.on("connection", (socket) => {
  socket.on("register", async (data: any) => {
    const { email } = JSON.parse(data);

    users[email] = socket.id;

    onlineUsers.set(email, true);

    const conversationList = await MessageService.getConversationLists(email);

    socket.emit("conversation-list", conversationList);
  });

  socket.on("privateMessage", async (data: any) => {
    const { toEmail, message, fromEmail, media, mediaUrl } = JSON.parse(data);

    if (!fromEmail) {
      return socket.send(JSON.stringify({ error: "email is required" }));
    }

    const toSocketId = users[toEmail];

    const recipientInChatWith = userInChat.get(toEmail);

    try {
      const isUnseen = recipientInChatWith === fromEmail ? false : true;
      const savedMessage = await MessageService.createMessage({
        sender: fromEmail,
        message: message || null,
        media: mediaUrl || null,
        recipient: toEmail,
        isUnseen: isUnseen,
      });

      // const [fromEmailConversationList, toEmailConversationList] =
      //   await Promise.all([
      //     MessageService.getConversationLists(fromEmail),
      //     toEmail ? MessageService.getConversationLists(toEmail) : null,
      //   ]);
      const toEmailConversationList = await MessageService.getConversationLists(
        toEmail
      );

      const populatedMessage = await Message.findById(savedMessage._id)
        .populate({ path: "sender", select: "name email _id" })
        .populate({ path: "recipient", select: "name email _id" })
        .lean();

      // socket.emit("privateMessage", {
      //   message: populatedMessage,
      //   fromEmail: fromEmail,
      // });

      // socket.emit("conversation-list", fromEmailConversationList);

      if (toSocketId) {
        socket.to(toSocketId).emit("privateMessage", {
          message: populatedMessage,
          fromEmail: fromEmail,
          toEmail: toEmail,
        });

        if (toEmailConversationList) {
          socket
            .to(toSocketId)
            .emit("conversation-list", toEmailConversationList);
        }
      }
    } catch (error) {
      console.error("Error sending private message:", error);
    }
  });
  socket.on("userInChat", (data: any) => {
    const { userEmail, chattingWith } = JSON.parse(data);

    if (chattingWith) {
      userInChat.set(userEmail, chattingWith);
    } else {
      userInChat.delete(userEmail);
    }
  });

  socket.on("sendOffer", async (data: any) => {
    const { toEmail, offer, fromEmail } = JSON.parse(data);

    const toSocketId = users[toEmail];

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
      }
      socket.emit("sendOfferSuccess", {
        message: "Offer sent successfully!",
        statusCode: 200,
      });
    } catch (error: any) {
      socket.emit("sendOfferError", {
        message: error.message || "Failed to create offer",
        statusCode: error.statusCode || 500,
      });
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

      const savedMessage = await MessageService.createMessage({
        sender: fromEmail,
        recipient: toEmail,
        message: join_url,
        media: "",
        meetingLink: start_url,
        isUnseen: false,
      });

      if (toSocketId) {
        socket.to(toSocketId).emit("createZoomMeeting", {
          from: fromEmail,
          savedMessage,
        });
      }

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
    await mongoose.connect(config.database_url as string, options);

    console.log("Connected to MongoDB successfully.");

    httpServer.listen(config.port, () => {
      console.log(`Server running at port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

bootstrap();
