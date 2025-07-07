import { emailNotificationQueue } from "../utilitis/redis";

export async function scheduleEmailNotifications() {
  await emailNotificationQueue.add(
    "email-notification",
    {},
    {
      jobId: "emailNotificationRepeatJob",
      repeat: {
        every: 1000 * 60 * 60 ,
         
      },
      removeOnComplete: true,
      removeOnFail: true,
    }
  );
}