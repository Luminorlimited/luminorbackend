import mongoose from "mongoose";
import config from "./config";
import { createServer } from "http";
import app from "./app";
import { Server } from "socket.io";
import { initializeSocket } from "./socket";

const options = { autoIndex: true };

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://luminoor.vercel.app",
      "http://10.0.20.68:3000",
      "https://luminor-ltd.com",
      "https://www.luminor-ltd.com",
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

// Initialize socket connection
initializeSocket(io);

async function bootstrap() {
  try {
    await mongoose.connect(
      config.database_url as string,
      options
    );
    console.log("Connected to MongoDB successfully.");

    httpServer.listen(config.port, () => {
      (`Server running at port ${config.port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

bootstrap();
