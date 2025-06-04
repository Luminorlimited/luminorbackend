import { Worker, Queue } from "bullmq";
import Redis, { RedisOptions } from "ioredis";
import { User } from "../modules/auth/auth.model";
import emailSender from "./emailSender";
import { emailWorker } from "../email/emailWorker";

// Redis Configuration
const redisOptions: RedisOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  retryStrategy: (times: number) => {
    if (times > 5) return undefined;
    return Math.min(times * 100, 3000);
  },
  connectTimeout: 10000,
  keepAlive: 30000,
  maxRetriesPerRequest: null,
};

const redis = new Redis(redisOptions);

// Redis Events
redis.on("connect", () => console.log("✅ Redis connected successfully"));
redis.on("error", (err: any) => console.error("❌ Redis error:", err));
redis.on("close", () => console.warn("⚠️ Redis connection closed"));
redis.on("reconnecting", (delay: any) =>
  console.log(`♻️ Redis reconnecting in ${delay}ms`)
);
redis.on("end", () => console.error("❌ Redis connection ended"));

// Queues
const emailNotificationQueue = new Queue("email-notification", {
  connection: redis,
});

// Cleanup function to clean old and stuck jobs
export async function cleanQueues() {
  await Promise.all([
    emailNotificationQueue.clean(0, 1000, "completed"),
    emailNotificationQueue.clean(0, 1000, "failed"),
    emailNotificationQueue.clean(0, 1000, "delayed"),
    emailNotificationQueue.clean(0, 1000, "wait"),
  ]);
}

// Worker to process email notifications
const emailNotificationWorker = new Worker(
  "email-notification",
  async () => {
    // Get all offline user keys
    const keys = await redis.keys("offline:*");
    console.log(keys,"check keys from worker")

    for (const key of keys) {
      const recipientId = key.split(":")[1];
      const senders = await redis.smembers(key);
      if (senders.length === 0) {
        continue;
      }

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        await redis.del(key);
        continue;
      }

      const senderList = senders.join(", ");
      console.log(senderList,"check sender list")

      emailWorker.messageSend(
        senderList,
        recipient.name.firstName,
        recipient.email
      );

      await redis.del(key);
    }
  },
  {
    connection: redis,
  }
);

emailNotificationWorker.on("completed", (job) => {
  console.log(`Email notification sent for job ${job.id}`);
});

emailNotificationWorker.on("failed", (job: any, err) => {
  console.error(`Failed to send email notification for job ${job.id}:`, err);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🚨 Gracefully shutting down...");
  await Promise.all([
    emailNotificationWorker.close(),
    emailNotificationQueue.close(),
  ]);
  console.log("✅ Workers and Queues closed gracefully");
  process.exit(0);
});

export { redis, emailNotificationQueue };
