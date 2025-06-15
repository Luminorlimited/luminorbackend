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
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const user: any = req.user;
  if (!sseConnections[user.id]) {
    sseConnections[user.id] = [];
  }
  sseConnections[user.id].push(res);

  // Send initial connection event
  res.write(`event: connected\ndata: "SSE connected"\n\n`);

  const sendData = async () => {
    try {
      const count = await NotificationService.messageCount(user.id);
      res.write(`event:message-count\ndata: ${JSON.stringify({ count })}\n\n`);
    } catch (err) {
      // Optional: Log or handle error on sendData
    }
  };

  const eventHandler = async ({ userId: targetUserId }: { userId: string }) => {
    if (targetUserId === user.id) {
      await sendData();
    }
  };

  await sendData();
  eventEmitter.on("event:message-count", eventHandler);

  // Heartbeat to keep connection alive every 5 minutes
  const heartbeat = setInterval(() => {
    try {
      res.write(":\n\n"); // SSE comment to keep connection alive
    } catch {
      // Client disconnected
      clearInterval(heartbeat);
    }
  }, 300000);

  req.on("close", () => {
    clearInterval(heartbeat);
    eventEmitter.off("event:message-count", eventHandler);

    // Remove this response from sseConnections[user.id] to avoid memory leaks
    sseConnections[user.id] = sseConnections[user.id].filter(r => r !== res);

    res.end();
  });
});

const otherNotificationCount = catchAsync(async (req: Request, res: Response) => {
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

  const sendData = async () => {
    try {
      const count = await NotificationService.otherNotificationCount(user.id);
      res.write(`event:notification-count\ndata: ${JSON.stringify({ count })}\n\n`);
    } catch (err) {
      // Optional: Log or handle error
    }
  };

  const eventHandler = async ({ userId: targetUserId }: { userId: string }) => {
    if (targetUserId === user.id) {
      await sendData();
    }
  };

  await sendData();
  eventEmitter.on("event:notification-count", eventHandler);

  const heartbeat = setInterval(() => {
    try {
      res.write(":\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 300000);

  req.on("close", () => {
    clearInterval(heartbeat);
    eventEmitter.off("event:notification-count", eventHandler);
    sseConnections[user.id] = sseConnections[user.id].filter(r => r !== res);
    res.end();
  });
});

export const NotificationController = {
  getUserNotification,
  updateNotification,
  updateMessageNotification,
  messageCount,
  otherNotificationCount,
};
