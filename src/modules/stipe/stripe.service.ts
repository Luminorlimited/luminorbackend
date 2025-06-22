import Stripe from "stripe";
import { User } from "../auth/auth.model";
import config from "../../config";
import ApiError from "../../errors/handleApiError";
import { StatusCodes } from "http-status-codes";
import { Order } from "../order/order.model";
import { OfferService } from "../offers/offer.service";
import { OrderService } from "../order/order.service";
import { Transaction } from "../transaction/transaction.model";
import mongoose, { ObjectId } from "mongoose";
import { PAYMENTSTATUS } from "../transaction/transaction.interface";
import { Offer } from "../offers/offer.model";
import { IUser } from "../auth/auth.interface";
import emailSender from "../../utilitis/emailSender";
import { MessageService } from "../messages/messages.service";
import { Message } from "../messages/messages.model";
import { users } from "../../socket";
import { io } from "../../server";
import { INotification } from "../notification/notification.interface";
import {
  ENUM_NOTIFICATION_STATUS,
  ENUM_NOTIFICATION_TYPE,
} from "../../enums/notificationStatus";
import { NotificationService } from "../notification/notification.service";
import { off } from "pdfkit";
import moment from "moment";
import { IMessage } from "../messages/messages.interface";
const stripe = new Stripe(config.stripe_key as string, {
  apiVersion: "2025-01-27.acacia",
});
const getCustomerSavedCardsFromStripe = async (customerId: string) => {
  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });
    return { paymentMethods: paymentMethods.data };
  } catch (error: any) {
    throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  }
};
const deleteCardFromCustomer = async (paymentMethodId: string) => {
  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    return { message: "Card deleted successfully" };
  } catch (error: any) {
    throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  }
};
const refundPaymentToCustomer = async (orderId: string) => {
  try {
    const order: any = await Order.findById(orderId)
      .populate("orderFrom")
      .populate("orderReciver");

    const messageContent = `Your order has been cancelled. Please speak to the client. `;
    const senderId = order?.orderFrom._id as mongoose.Types.ObjectId;

    const recipientId = order?.orderReciver._id as mongoose.Types.ObjectId;

    const savedMessage = await MessageService.createMessage({
      sender: senderId,
      message: messageContent,
      recipient: recipientId,
      isUnseen: true,
    });

    const populatedMessage = await Message.findById(savedMessage._id)
      .populate({ path: "sender", select: "name email _id" })
      .populate({ path: "recipient", select: "name email _id" })
      .lean();

    const notificationData: INotification = {
      recipient: recipientId._id as mongoose.Types.ObjectId,
      sender: senderId._id as mongoose.Types.ObjectId,
      message: `Your order has been cancelled. Please speak to the client.`,
      type: ENUM_NOTIFICATION_TYPE.OFFER,
      status: ENUM_NOTIFICATION_STATUS.UNSEEN,
      orderId: order._id,
    };

    const notification = await NotificationService.createNotification(
      notificationData,
      "sendNotification"
    );
    const toSocketId = users[recipientId._id.toString()];
    if (toSocketId) {
      io.to(toSocketId).emit("privateMessage", {
        message: populatedMessage,
        fromUserId: senderId._id,
        toUserId: recipientId._id,
      });
    }

    const refund = await stripe.refunds.create({
      payment_intent: order?.paymentIntentId,
    });

    await Transaction.updateOne(
      { orderId: orderId },
      { $set: { paymentStatus: PAYMENTSTATUS.REFUNDED } }
    );
    return refund;
  } catch (error: any) {
    throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  }
};
const createPaymentIntentService = async (payload: any) => {
  const { offer }: any = await OfferService.getSingleOffer(payload.offerId);

  if (!offer) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Offer not found.");
  }

  await stripe.paymentMethods.attach(payload.paymentMethodId, {
    customer: payload.customerId,
  });

  const paymentMethodDetails = await stripe.paymentMethods.retrieve(
    payload.paymentMethodId
  );
  if (paymentMethodDetails.customer !== payload.customerId) {
    throw new Error("PaymentMethod does not belong to this customer.");
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(offer.totalPrice * 100),
    currency: "usd",
    customer: payload.customerId,
    payment_method: payload.paymentMethodId,
    confirm: true,
    setup_future_usage: "on_session",
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
  });

  if (paymentIntent.status !== "succeeded") {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "PaymentIntent was not successful"
    );
  }

  const session = await mongoose.startSession();
  let orderResult;

  try {
    session.startTransaction();

    const transaction = await Transaction.create(
      [
        {
          orderId: null,
          amount: offer.totalPrice,
          charge: offer.serviceFee,
          paymentStatus: "pending",
          stripePaymentIntentId: paymentIntent.id,
        },
      ],
      { session }
    );

    const order = {
      clientRequerment: payload.clientRequerment,
      orderFrom: offer.clientEmail,
      orderReciver: offer.professionalEmail,
      deliveryDate: offer.totalDeliveryTime,
      totalPrice: offer.totalPrice,
      project: payload.offerId,
      paymentIntentId: paymentIntent.id,
      transaction: transaction[0]._id,
      revisions: [],
    };

    orderResult = await Order.create([order], { session });

    await Transaction.updateOne(
      { _id: transaction[0]._id },
      { orderId: orderResult[0]._id },
      { session }
    );

    await session.commitTransaction();

    const senderId = offer.clientEmail;
    const recipientId = offer.professionalEmail;
    const messageId = new mongoose.Types.ObjectId();
    const messageContent = `Your offer has been accepted By ${
      offer.clientEmail?.name.firstName + offer.clientEmail.name.lastName
    }.\nView details: https://www.luminor-ltd.com/clientOrder/${
      orderResult[0]._id
    }`;
    const timestamp = new Date();

    const toSocketId = users[recipientId._id.toString()];
    if (toSocketId) {
      io.to(toSocketId).emit("privateMessage", {
        _id: messageId,
        sender: {
          _id: senderId._id,
          name: senderId.name,
          email: senderId.email,
        },
        recipient: {
          _id: recipientId._id,
          name: recipientId.name,
          email: recipientId.email,
        },
        message: messageContent,
        timestamp,
        status: "pending",
      });
    }

    (async () => {
      try {
    
        const payload = {
          _id:messageId,
          sender: senderId._id,
          recipient: recipientId._id,

          message: messageContent,

          isUnseen: true,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
      await MessageService.createMessage(
          payload as IMessage
        );

        const senderSocketId = users[senderId._id.toString()];
        if (senderSocketId) {
          io.to(senderSocketId).emit("messageSaved", {
            _id: messageId,
            status: "delivered",
          });
        }
      } catch (err) {
        console.error("Message save failed:", err);
      }
    })();

    const notificationData: INotification = {
      recipient: recipientId._id as mongoose.Types.ObjectId,
      sender: senderId._id as mongoose.Types.ObjectId,
      message: messageContent,
      type: ENUM_NOTIFICATION_TYPE.OFFER,
      status: ENUM_NOTIFICATION_STATUS.UNSEEN,
      orderId: orderResult[0]._id,
    };

    await NotificationService.createNotification(
      notificationData,
      "sendNotification"
    );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return orderResult[0];
};

const deliverRequest = async (orderId: string) => {
  const order = await OrderService.getOrderById(orderId);

  if (!order || !order.result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "order not found");
  }
  const retireProfessional = await User.findOne({
    _id: order?.result.orderReciver,
  });
  if (!retireProfessional) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "user not found");
  }
  if (!order) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "order not found");
  }
  const senderId = order.result.orderFrom;
  const recipientId = order.result.orderReciver;

  const toSocketId = users[order.result?.orderFrom._id.toString()];

  const notificationData: INotification = {
    recipient: order.result?.orderFrom._id as mongoose.Types.ObjectId,
    sender: order.result.orderReciver._id as mongoose.Types.ObjectId,
    message: ` ${
      retireProfessional.name.firstName + "" + retireProfessional.name.lastName
    } sent  you a delivery request.`,
    type: ENUM_NOTIFICATION_TYPE.DELIVERY,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
    orderId: order.result._id,
  };

  const savedMessage = await MessageService.createMessage({
    sender: senderId._id,
    message: `You received  a delivery request.\nView details: https://luminor-ltd.com/project/${orderId}`,
    recipient: recipientId._id,
    isUnseen: true,
  });


  const populatedMessage = await Message.findById(savedMessage._id)
    .populate({ path: "sender", select: "name email _id" })
    .populate({ path: "recipient", select: "name email _id" })
    .lean();
  if (toSocketId) {
    io.to(toSocketId).emit("privateMessage", {
      message: populatedMessage,
      fromUserId: senderId._id,
      toUserId: recipientId._id,
    });
  }

  const notification = await NotificationService.createNotification(
    notificationData,
    "sendNotification"
  );
  return notification;
};

const deliverProject = async (orderId: string) => {
  const order: any = await OrderService.getOrderById(orderId);
  if (!order || !order.result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "order not found");
  }
  const retireProfessional = await User.findOne({
    _id: order?.result.orderReciver,
  });
  if (!retireProfessional) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "user not found");
  }
  if (!order) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "order not found");
  }
  const totalAmount = Math.round(parseFloat(order?.result.totalPrice) * 100);
  const platformFee =
    Math.round((parseFloat(order.result.totalPrice) * 20) / 100) * 100;
  const transferAmount = totalAmount - platformFee;
  const transfer = await stripe.transfers.create({
    amount: transferAmount,
    currency: "usd",
    destination: retireProfessional?.stripe?.customerId as string,
    transfer_group: `DELIVERY_${order?.result.paymentIntentId}`,
  });

  const updateTransaction = await Transaction.findOneAndUpdate(
    { _id: order.result.transaction },
    { $set: { paymentStatus: PAYMENTSTATUS.COMPLETED } },
    { new: true }
  );
  const messageContent = `Your project has been successfully accepted by ${
    order.client.name.firstName + order.client.name.lastName
  }`;
  const senderId = order.result.orderFrom;
  const recipientId = order.result.orderReciver;

  // Save the message to the database
  const savedMessage = await MessageService.createMessage({
    sender: senderId._id,
    message: messageContent,
    recipient: recipientId._id,
    isUnseen: true,
  });

  // Populate the message before sending
  const populatedMessage = await Message.findById(savedMessage._id)
    .populate({ path: "sender", select: "name email _id" })
    .populate({ path: "recipient", select: "name email _id" })
    .lean();

  const toSocketId = users[recipientId._id.toString()];

  const notificationData: INotification = {
    recipient: recipientId._id as mongoose.Types.ObjectId,
    sender: senderId._id as mongoose.Types.ObjectId,
    message: `Your project has been successfully accepted by ${
      order.client.name.firstName + order.client.name.lastName
    }.`,
    type: ENUM_NOTIFICATION_TYPE.OFFER,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
    orderId: order.result._id,
  };

  await NotificationService.createNotification(
    notificationData,
    "sendNotification"
  );
  if (toSocketId) {
    io.to(toSocketId).emit("privateMessage", {
      message: populatedMessage,
      fromUserId: senderId,
      toUserId: recipientId._id,
    });
  }

  return { transfer, updateTransaction };
};
const revision = async (orderId: string, clientId: string, payload: any) => {
  console.log(payload,"check revision")
  const order: any = await Order.findById(orderId)
    .populate("orderFrom")
    .populate("orderReciver");
  if (!order) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "order  not found");
  }
  if (order.orderFrom._id.toString() !== clientId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "only this order client have the authrothy to give revesion request."
    );
  }
  const senderId = order?.orderFrom._id as mongoose.Types.ObjectId;
  const messageContent = `You have a revision request from ${order?.orderFrom.name.firstName} ${order?.orderFrom.name.lastName}.\nView details: https://luminor-ltd.com/deliver-details/${orderId}`;
  const notifcationContent = `You have a revision request from ${order?.orderFrom.name.firstName} ${order?.orderFrom.name.lastName}.`;
  const recipientId = order?.orderReciver._id as mongoose.Types.ObjectId;
  const savedMessage = await MessageService.createMessage({
    sender: senderId,
    message: messageContent,
    recipient: recipientId,
    isUnseen: true,
  });
  const populatedMessage = await Message.findById(savedMessage._id)
    .populate({ path: "sender", select: "name email _id" })
    .populate({ path: "recipient", select: "name email _id" })
    .lean();
  const notificationData: INotification = {
    recipient: recipientId._id as mongoose.Types.ObjectId,
    sender: senderId._id as mongoose.Types.ObjectId,
    message: notifcationContent,
    type: ENUM_NOTIFICATION_TYPE.REVISION,
    status: ENUM_NOTIFICATION_STATUS.UNSEEN,
    orderId: order._id as mongoose.Types.ObjectId,
  };
  const notification = await NotificationService.createNotification(
    notificationData,
    "sendNotification"
  );
  const toSocketId = users[recipientId._id.toString()];
  if (toSocketId) {
    io.to(toSocketId).emit("privateMessage", {
      message: populatedMessage,
      fromUserId: senderId._id,
      toUserId: recipientId._id,
    });
  }

  const timeLength = moment().add(payload.duration, "days").toDate();
  const revisionData = {
    requestedBy: clientId,
    timeLength: timeLength,
    description: payload.description,
    createdAt: new Date(),
  };
  const updatedOrder = await Order.findByIdAndUpdate(
    orderId,
    {
      $push: { revision: revisionData },
      $inc: { revisionCount: 1 },
    },
    { new: true }
  );
  const updateTransaction = await Transaction.findOneAndUpdate(
    { orderId: orderId },
    { $set: { paymentStatus: PAYMENTSTATUS.REVISION } },
    { new: true }
  );

  return { updatedOrder, updateTransaction };
};
const generateNewAccountLink = async (user: any) => {
  const accountLink = await stripe.accountLinks.create({
    account: user.stripe?.customerId as string,
    refresh_url: `https://www.luminor-ltd.com/user/editProfile/retireProfessional/${user._id}`,
    return_url: "https://www.luminor-ltd.com",
    type: "account_onboarding",
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Complete Your Onboarding</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0; line-height: 1.6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
    
    <div style="background-color: #5633d1;  padding: 30px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Complete Your Onboarding</h1>
    </div>

    <div style="padding: 20px 20px; text-align: left;">
      <p style="font-size: 18px; color: #333333;">Dear <b>${user.name.firstName}</b>,</p>
      <p style="font-size: 16px; color: #333333;">We’re excited to have you onboard! To complete your onboarding, please click the button below:</p>

      <div style="text-align: center; margin: 20px 0;">
        <a href="${accountLink.url}" style="background-color: #5633d1; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Complete Stripe Onboarding</a>
      </div>

      <p style="font-size: 16px; color: #333333;">If the button above doesn't work, you can also copy and paste this link into your browser:</p>

      <p style="word-break: break-all; background-color: #f0f8f0; padding: 10px; border-radius: 5px; color: #555555;">
        ${accountLink.url}
      </p>

      <p style="font-size: 14px; color: #d9534f; text-align: center;">
        Note: This Stripe onboarding link will expire within a few minutes.<br/>
    If the link is not working, please generate a new onboarding link by clicking the button below.
      </p>
      <div style="text-align: center; margin: 20px 10px;">
                <a href="https://www.luminor-ltd.com/user/editProfile/retireProfessional/${user._id}" style="background-color: #6c757d; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none; font-size: 14px;">Generate New Onboarding Link</a>
            </div>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center;">
        <p style="font-size: 14px; color: #888888;">Thank you for choosing Luminor!</p>
        <p style="font-size: 12px; color: #999999;">If you didn’t request this onboarding, you can ignore this email safely.</p>
      </div>
    </div>

    <div style="background-color: #f9f9f9; padding: 10px; text-align: center; font-size: 12px; color: #999999;">
      <p style="margin: 0;">© 2025 Luminor. All rights reserved.</p>
    </div>

  </div>
</body>
</html>`;

  await emailSender("Luminor  Onboarding Url", user.email, html);
};

const isDuplicateStripecard = async (
  paymentMethodId: string,
  stripeCustomerId: string
) => {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: stripeCustomerId,
    type: "card",
  });
  const newCard: any = await stripe.paymentMethods.retrieve(paymentMethodId);

  const duplicateCards = paymentMethods?.data?.filter(
    (existingCard: any) => existingCard.card.last4 === newCard.card.last4
  );

  return duplicateCards;
};
const createStripeCard = async (id: string, paymentMethodId: string) => {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "user not found");
  }

  if (!user.stripe?.customerId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Customer ID not found");
  }

  const existingCard: any = await isDuplicateStripecard(
    paymentMethodId,
    user.stripe.customerId
  );

  if (existingCard?.length === 0) {
    const result = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripe.customerId,
    });
    return result;
  } else {
    throw new ApiError(
      404,
      `The card you are trying to add is already linked to your account.`
    );
  }
};

const getStripeCardLists = async (id: string) => {
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "user not found");
  }

  if (!user.stripe?.customerId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Customer ID not found");
  }

  const result = await stripe.paymentMethods.list({
    customer: user.stripe?.customerId,
    type: "card",
  });
  return result;
};

export const StripeServices = {
  getCustomerSavedCardsFromStripe,
  deleteCardFromCustomer,
  refundPaymentToCustomer,
  createPaymentIntentService,

  deliverProject,
  generateNewAccountLink,
  getStripeCardLists,
  createStripeCard,
  deliverRequest,
  revision,
};
