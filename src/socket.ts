import { Server } from "socket.io";
import { Message } from "./modules/messages/messages.model";
import { MessageService } from "./modules/messages/messages.service";
import { calculateTotalPrice } from "./utilitis/calculateTotalPrice";
import { generateOfferPDF } from "./utilitis/generateOfferPdf";
import { zoomService } from "./modules/zoom/zoom.service";
import { OfferService } from "./modules/offers/offer.service";
import { NotificationService } from "./modules/notification/notification.service";
import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "./enums/notificationStatus";
import { emailWorker } from "./email/emailWorker";
import { emailNotificationQueue } from "./utilitis/redis";
import { handleOfflineMessage } from "./helpers/handleOfflineMessage";

export const users: { [key: string]: string } = {};
export const onlineUsers = new Map<string, boolean>();
export const userInChat = new Map<string, string | null>();

export function initializeSocket(io: Server) {
  io.on("connection", (socket) => {
    socket.on("register", async (data: any) => {
      try {
        const { id } = JSON.parse(data);
        users[id] = socket.id;
        onlineUsers.set(id, true);

        const conversationList = await MessageService.getConversationLists(id);
        socket.emit("conversation-list", conversationList);
      } catch (error) {
        console.error("Error in register:", error);
        socket.emit("register-error", { message: "Failed to register user." });
      }
    });

    socket.on("userInChat", (data: any) => {
      
      try {
        const { userId, chattingWith } = JSON.parse(data);
    

        if (chattingWith) {
          userInChat.set(userId, chattingWith);
         

          // ✅ Emit confirmation to the current socket
          socket.emit("chat-joined", {
            success: true,
            message: `Chat joined with user ID: ${chattingWith}`,
            chattingWith,
          });
        } else {
          userInChat.delete(userId);

          // ✅ Optional: notify user they exited chat
          socket.emit("chat-left", {
            success: true,
            message: `Chat context cleared for user ID: ${userId}`,
          });
        }
      } catch (error) {
        console.error("Error in userInChat:", error);

        socket.emit("chat-join-error", {
          success: false,
          message: "Failed to update active chat user.",
        });
      }
    });

    socket.on("privateMessage", async (data: any) => {
      try {
        const { toUserId, message, fromUserId, media, mediaUrl } =
          JSON.parse(data);

        if (!fromUserId) {
          return socket.emit("error", { message: "Sender ID is required" });
        }

        const toSocketId = users[toUserId]; // Check if user is online
        const recipientInChatWith = userInChat.get(toUserId);
        const isUnseen = recipientInChatWith !== fromUserId;

        // Save the message
        const savedMessage = await MessageService.createMessage({
          sender: fromUserId,
          message: message || null,
          media: mediaUrl || null,
          recipient: toUserId,
          isUnseen,
        });

        // Populate for frontend
        const populatedMessage: any = await Message.findById(savedMessage._id)
          .populate({ path: "sender", select: "name email _id" })
          .populate({ path: "recipient", select: "name email _id" })
          .lean();

        // Emit to recipient if online
        if (toSocketId) {
          socket.to(toSocketId).emit("privateMessage", {
            message: populatedMessage,
            fromUserId,
            toUserId,
          });

          // Update recipient's conversation list
          const toEmailConversationList =
            await MessageService.getConversationLists(toUserId);
          if (toEmailConversationList) {
            socket
              .to(toSocketId)
              .emit("conversation-list", toEmailConversationList);
          }
        } else {
          // Handle offline fallback
          handleOfflineMessage(
            toUserId,
            populatedMessage?.sender.name.firstName
          );
        }

        // Only create notification if recipient is not actively chatting with sender
        if (isUnseen) {
          await NotificationService.createNotification(
            {
              recipient: toUserId,
              sender: fromUserId,
              message: `${populatedMessage?.sender.name.firstName} ${populatedMessage?.sender.name.lastName} sent you a message`,
              type: ENUM_NOTIFICATION_TYPE.PRIVATEMESSAGE,
              status: ENUM_NOTIFICATION_STATUS.UNSEEN,
            },
            "sendNotification"
          );
        }
      } catch (error) {
        console.error("Error in privateMessage:", error);
        socket.emit("privateMessage-error", {
          message: "Failed to send message.",
        });
      }
    });

    socket.on("image-pass", async (data: any) => {
      try {
        const { toUserId, fromUserId, media } = JSON.parse(data);
        if (!fromUserId) {
          return socket.emit("error", { message: "Sender ID is required" });
        }

        const toSocketId = users[toUserId];
        const recipientInChatWith = userInChat.get(toUserId);
        const isUnseen = recipientInChatWith !== fromUserId;

        const savedMessage = await MessageService.createMessage({
          sender: fromUserId,
          message: "",
          media: media || null,
          recipient: toUserId,
          isUnseen,
        });

        const populatedMessage = await Message.findById(savedMessage._id)
          .populate({ path: "sender", select: "name email _id" })
          .populate({ path: "recipient", select: "name email _id" })
          .lean();

        const toEmailConversationList =
          await MessageService.getConversationLists(toUserId);

        if (toSocketId) {
          socket.to(toSocketId).emit("image-pass", {
            message: populatedMessage,
            media: populatedMessage,
            fromUserId,
            toUserId,
          });

          if (toEmailConversationList) {
            socket
              .to(toSocketId)
              .emit("conversation-list", toEmailConversationList);
          }
        }
      } catch (error) {
        console.error("Error in image-pass:", error);
        socket.emit("image-pass-error", { message: "Failed to send image." });
      }
    });

    socket.on("sendOffer", async (data: any) => {
      try {
        const { toEmail, offer, fromEmail } = JSON.parse(data);
        const toSocketId = users[toEmail];

        offer.totalPrice = calculateTotalPrice(offer);
        offer.orderAgreementPDF = await generateOfferPDF(offer);

        const totalOffer = {
          ...offer,
          clientEmail: toEmail,
          professionalEmail: fromEmail,
        };

        const newOffer = await OfferService.createOffer(totalOffer);
        emailWorker.offerSend(toEmail.toString(), newOffer?._id.toString()!);

        socket.emit("sendOfferSuccess", {
          message: "Offer sent successfully!",
          statusCode: 200,
        });

        if (toSocketId) {
          socket.to(toSocketId).emit("sendOffer", {
            from: fromEmail,
            offer: newOffer,
          });
        }
      } catch (error: any) {
        console.error("Error in sendOffer:", error);
        socket.emit("sendOfferError", {
          message: error.message || "Failed to create offer",
          statusCode: error.statusCode || 500,
        });
      }
    });

    socket.on("createZoomMeeting", async (data: any) => {
      try {
        const { fromUserId, toUserId } = JSON.parse(data);
        const toSocketId = users[toUserId];

        const meeting = await zoomService.createZoomMeeting();
        if (!meeting || !meeting.start_url || !meeting.join_url) {
          throw new Error("Invalid Zoom meeting data");
        }

        const { start_url, join_url } = meeting;
        const savedMessage = await MessageService.createMessage({
          sender: fromUserId,
          recipient: toUserId,
          message: join_url,
          media: "",
          meetingLink: start_url,
          isUnseen: false,
        });

        const populateMessage = {
          sender: { _id: savedMessage.sender },
          recipient: { _id: savedMessage.recipient },
          meetingLink: start_url,
          isUnseen: false,
          message: join_url,
          createdAt: savedMessage.createdAt,
        };

        const toEmailConversationList =
          await MessageService.getConversationLists(toUserId);
        const fromEmailConversationList =
          await MessageService.getConversationLists(fromUserId);

        socket.emit("createZoomMeeting", {
          from: fromUserId,
          populateMessage,
        });

        socket.emit("conversation-list", fromEmailConversationList);

        if (toSocketId) {
          socket.to(toSocketId).emit("createZoomMeeting", {
            from: fromUserId,
            populateMessage,
          });

          if (toEmailConversationList) {
            socket
              .to(toSocketId)
              .emit("conversation-list", toEmailConversationList);
          }
        }
      } catch (error) {
        console.error("Error in createZoomMeeting:", error);
        socket.emit("zoomMeetingError", {
          message: "Failed to create Zoom meeting",
        });
      }
    });

    socket.on("disconnect", () => {
      let id = "";
      for (let [userId] of onlineUsers) {
        if (socket.id === users[userId]) {
          id = userId;
          break;
        }
      }

      if (id) {
        onlineUsers.set(id, false);
        delete users[id];
        userInChat.delete(id);
      }
    });

    socket.on("error", (error) => {
      console.error("Socket level error:", error);
    });
  });
}
