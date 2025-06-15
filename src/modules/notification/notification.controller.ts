import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";

import { Request, Response } from "express";
import { NotificationService } from "./notification.service";
import { INotification } from "./notification.interface";
import { sseConnections } from "../sse/sseUser";
import eventEmitter from "../sse/eventEmitter";

const getUserNotification = catchAsync(async (req: Request, res: Response) => {
  const user: any = req.user;
  const messages = await NotificationService.getUserNotification(
    user.id as string
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "user notification  get   successfully",
    data: messages,
  });
});
const updateNotification = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;

  const messages = await NotificationService.updateNotification(id);

  sendResponse<INotification>(res, {
    success: true,
    statusCode: StatusCodes.OK,

    message: "user notification  update    successfully",
    data: messages,
  });
});
const updateMessageNotification = catchAsync(
  async (req: Request, res: Response) => {
    const ids = req.body.ids;

    const messages = await NotificationService.updateMessageNotification(ids);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,

      message: "user notification  update    successfully",
      data: messages,
    });
  }
);
const messageCount = catchAsync(async (req: Request, res: Response) => {
  console.log("✅ [SSE] /message-count route hit");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Flush headers immediately so the client gets them
  res.flushHeaders();

  const user: any = req.user;
  console.log("✅ [SSE] Authenticated User ID:", user?.id);

  if (!user?.id) {
    console.log("❌ [SSE] Missing user ID. Aborting SSE.");
    res.write(`event: error\ndata: ${JSON.stringify({ message: "Unauthorized" })}\n\n`);
    res.end();
    return;
  }

  if (!sseConnections[user.id]) {
    sseConnections[user.id] = [];
  }

  sseConnections[user.id].push(res);
  console.log("✅ [SSE] Current SSE Connections:", Object.keys(sseConnections));

  // Initial response
  res.write(`event: connected\ndata: "SSE connected for user ${user.id}"\n\n`);

  try {
    const sendData = async () => {
      try {
        const count = await NotificationService.messageCount(user.id);
        console.log("✅ [SSE] Sending message count:", count);
        res.write(`event:message-count\ndata: ${JSON.stringify({ count })}\n\n`);
      } catch (err) {
        console.log("❌ [SSE] Error while sending count:", err);
      }
    };

    const eventHandler = async ({ userId: targetUserId }: { userId: string }) => {
      console.log("ℹ️ [SSE] Event triggered for user:", targetUserId);
      if (targetUserId === user.id) {
        await sendData();
      }
    };

    // Send initial data
    await sendData();

    // Subscribe to future events
    eventEmitter.on("event:message-count", eventHandler);

    // Heartbeat
    const heartbeat = setInterval(() => {
      res.write(`:\n\n`);
      console.log("🔁 [SSE] Heartbeat sent for user:", user.id);
    }, 300 * 1000); // 5 minutes

    req.on("close", () => {
      clearInterval(heartbeat);
      eventEmitter.off("event:message-count", eventHandler);
      sseConnections[user.id] = sseConnections[user.id].filter((r) => r !== res);
      console.log("🛑 [SSE] Connection closed for user:", user.id);
      res.end();
    });

  } catch (error) {
    console.log("❌ [SSE] Unexpected error:", error);
    res.write(
      `event: error\ndata: ${JSON.stringify({ message: "Unexpected SSE error" })}\n\n`
    );
    res.end();
  }
});

const otherNotificationCount = catchAsync(
  async (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const user: any = req.user;
    if (!sseConnections[user.id]) {
      sseConnections[user.id] = [];
    }
    sseConnections[user.id].push(res);
    res.write(`event: connected\ndata: "SSE connected"\n\n`);
    try {
      const sendData = async () => {
        const count = await NotificationService.otherNotificationCount(user.id);
        res.write(
          `event:notification-count\ndata: ${JSON.stringify({ count })}\n\n`
        );
      };
      await sendData()
      const eventHandler = async ({
        userId: targetUserId,
      }: {
        userId: string;
      }) => {
        if (targetUserId === user.id) {
          await sendData();
        }
      };

      eventEmitter.on("event:notification-count", eventHandler);

      const heartbeat = setInterval(() => {
        res.write(`:\n\n`);
      }, 300 * 1000);

      req.on("close", () => {
        clearInterval(heartbeat);
        eventEmitter.off("event:notification-count", eventHandler);
        res.end();
      });
    } catch (error) {
      res.write(
        `event: error\ndata: ${JSON.stringify({
          message: "Unexpected SSE error",
        })}\n\n`
      );
    }
  }
);
export const NotificationController = {
  getUserNotification,
  updateNotification,
  updateMessageNotification,
  messageCount,
  otherNotificationCount,
};
