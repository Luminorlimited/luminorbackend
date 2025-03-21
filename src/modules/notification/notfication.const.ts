import {
    INotificationStatus,
    INotificationType,
  } from "./notification.interface";
  
  export const NotificationType: INotificationType[] = [
    "privateMessage",
   "offer",
   "order",
   "delivery",
   "revision",
  ];
  
  export const NotificationStatus: INotificationStatus[] = ["seen", "unseen"];