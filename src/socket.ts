import { Server } from "socket.io";
import { Message } from "./modules/messages/messages.model";
import { MessageService } from "./modules/messages/messages.service";
import { calculateTotalPrice } from "./utilitis/calculateTotalPrice";
import { generateOfferPDF } from "./utilitis/generateOfferPdf";
import { zoomService } from "./modules/zoom/zoom.service";
import { OfferService } from "./modules/offers/offer.service";
import { NotificationService } from "./modules/notification/notification.service";
import { ENUM_NOTIFICATION_STATUS, ENUM_NOTIFICATION_TYPE } from "./enums/notificationStatus";

export const users: { [key: string]: string } = {};
export const onlineUsers = new Map<string, boolean>();
export const userInChat = new Map<string, string | null>();

export function initializeSocket(io: Server) {
  io.on("connection", (socket) => {
    socket.on("register", async (data: any) => {
      // const { email } = JSON.parse(data);

      const { id } = JSON.parse(data);
      users[id] = socket.id;

      onlineUsers.set(id, true);
 
      const conversationList = await MessageService.getConversationLists(id);
   

      socket.emit("conversation-list", conversationList);
    });
    socket.on("userInChat", (data: any) => {
      const { userId, chattingWith } = JSON.parse(data);


      if (chattingWith) {
        userInChat.set(userId, chattingWith);
      } else {
        userInChat.delete(userId);
      }
    });
    socket.on("privateMessage", async (data: any) => {
      const { toUserId, message, fromUserId, media, mediaUrl } =
        JSON.parse(data);
      
      if (!fromUserId) {
        return socket.send(JSON.stringify({ error: "id is required" }));
      }

      const toSocketId = users[toUserId];
   

      const recipientInChatWith = userInChat.get(toUserId);

      try {
        const isUnseen = recipientInChatWith === fromUserId ? false : true;
        const savedMessage = await MessageService.createMessage({
          sender: fromUserId,
          message: message || null,
          media: mediaUrl || null,
          recipient: toUserId,
          isUnseen: isUnseen,
        });
         
      
        // const [fromEmailConversationList, toEmailConversationList] =
        //   await Promise.all([
        //     MessageService.getConversationLists(fromEmail),
        //     toEmail ? MessageService.getConversationLists(toEmail) : null,
        //   ]);
        const toEmailConversationList =
          await MessageService.getConversationLists(toUserId);

        const populatedMessage:any = await Message.findById(savedMessage._id)
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
            fromUserId: fromUserId,
            toUserId: toUserId,
          });

          if (toEmailConversationList) {
            socket
              .to(toSocketId)
              .emit("conversation-list", toEmailConversationList);
          }
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
        console.error("Error sending private message:", error);
      }
    });
    socket.on("image-pass", async (data: any) => {
      const { toUserId, fromUserId, media } = JSON.parse(data);
    

      if (!fromUserId) {
        return socket.send(JSON.stringify({ error: "id is required" }));
      }

      const toSocketId = users[toUserId];


      const recipientInChatWith = userInChat.get(toUserId);

      try {
        const isUnseen = recipientInChatWith === fromUserId ? false : true;
        const savedMessage = await MessageService.createMessage({
          sender: fromUserId,
          message: "",
          media: media || null,
          recipient: toUserId,
          isUnseen: isUnseen,
        });

        const toEmailConversationList =
          await MessageService.getConversationLists(toUserId);

        const populatedMessage = await Message.findById(savedMessage._id)
          .populate({ path: "sender", select: "name email _id" })
          .populate({ path: "recipient", select: "name email _id" })
          .lean();

        if (toSocketId) {
          socket.to(toSocketId).emit("image-pass", {
            message: populatedMessage,
            media: populatedMessage,
            fromUserId: fromUserId,
            toUserId: toUserId,
          });

          if (toEmailConversationList) {
            socket
              .to(toSocketId)
              .emit("conversation-list", toEmailConversationList);
          }
        }
        // socket.emit("image-pass", populatedMessage);
      } catch (error) {
        console.error("Error sending private message:", error);
      }
    });

    socket.on("sendOffer", async (data: any) => {

      const { toEmail, offer, fromEmail } = JSON.parse(data);
      console.log(offer,"check offer")
;
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
      const { fromUserId, toUserId } = JSON.parse(data);
  
      const toSocketId = users[toUserId];

      try {
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
          sender: {
            _id: savedMessage.sender,
          },
          recipient: {
            _id: savedMessage.recipient,
          },
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
        console.error("Error creating Zoom meeting:", error);
        socket.emit("zoomMeetingError", "Failed to create Zoom meeting");
      }
    });
   
    socket.on("disconnect", async (reason) => {
      let id = "";
      for (let [userId, isOnline] of onlineUsers) {
        if (socket.id === users[userId]) {
          id = userId;
          break;
        }
      }

      if (id) {
        onlineUsers.set(id, false);
        delete users[id];
      }
    });

    socket.on("error", (error) => {});
  });
}
