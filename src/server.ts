import mongoose from "mongoose";
import config from "./config";
import { createServer } from "http";
import app from "./app";
import { Server } from "socket.io";
import { Message } from "./modules/messages/messages.model";
import { Notification } from "./modules/notification/notification.model";
import { ENUM_NOTIFICATION_STATUS } from "./enums/notificationStatus";
import { NotificationCreateResponse } from "./modules/notification/notification.interface";


const options = {
  autoIndex: true,
};

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
  
      "http://localhost:3000",
   
    ],
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

  // Private messaging between users
  socket.on("privateMessage", async (data: any) => {
    console.log(users);
    const { toEmail, message, fromEmail } = JSON.parse(data);
    const toSocketId = users[toEmail];
    console.log(toSocketId);

    const fromSocketId = users[fromEmail];

    if (!fromEmail) {
      socket.send(JSON.stringify({error:"email is required"}))
    }

    try {
      const savedMessage = await Message.create({
        sender: fromEmail,
        message: message,
        recipient: toEmail,
      });

      if (toSocketId) {
        socket.to(toSocketId).emit("privateMessage", {
          from: fromSocketId,
          message: savedMessage,
          
        });
      }
    } catch (error) {}
  });
  // const message = {
  //   toEmail: "b@mail.com",
  //   message: "Hello, this is a test message",
  //   fromEmail: "a@mail.com",

  // };
  // socket.emit("privateMessage", JSON.stringify(message))
  // Notification event
  socket.on(
    "notification",
    async ({ toEmail, message, fromEmail, type }) => {
      const toSocketId = users[toEmail];
     
      const fromSocketId = users[fromEmail];

      if (!fromEmail) {
        socket.send(JSON.stringify({error:"email is required"}))
      }

      try {
        const notification = await Notification.create({
          recipient: toEmail,
          sender: fromEmail,
          message: message,
          status: ENUM_NOTIFICATION_STATUS.UNSEEN,
          type: type,
        });

        const notificationData = notification.toObject();

        const notificationResponse: NotificationCreateResponse = {
          success: true,
          statusCode: 200,
          message: "Notification saved successfully",
          data: notificationData,
        };

        const notificationId = notificationData._id;
        if (toSocketId) {
          socket.to(toSocketId).emit("notification", {
            from: fromSocketId,
            message,
           
           
            type: type,
          });
        }
      } catch (error) {
        socket.emit("notificationError", "Failed to create notification");
      }
    }
  );

  socket.on("sendOffer", (offer: any, toEmail: string) => {
    const toSocketId = users[toEmail];
    if (toSocketId) {
      socket.to(toSocketId).emit("receiveOffer", offer, socket.id);
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
