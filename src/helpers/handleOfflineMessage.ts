import { redis } from "../utilitis/redis";

export async function handleOfflineMessage(userId: string, senderName: string) {
  const key = `offline:${userId}`;

  await redis.sadd(key, senderName);

  await redis.expire(key, 60 * 60 );
}
