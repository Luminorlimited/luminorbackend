import { emailNotificationQueue } from "../utilitis/redis";

export async function scheduleEmailNotifications() {
  console.log("i am here to scedule email notifications")
  await emailNotificationQueue.add(
    "email-notification",
    {},
    {
      jobId: "emailNotificationRepeatJob",
      repeat: {
        // every: 1000 * 60 * 60 * 6,
          every: 1000 * 60 ,
      },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}