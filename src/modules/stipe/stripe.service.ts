import Stripe from "stripe";
import { User } from "../auth/auth.model";
import config from "../../config";
import ApiError from "../../errors/handleApiError";
import { StatusCodes } from "http-status-codes";
import { Order } from "../order/order.model";
import { OfferService } from "../offers/offer.service";
import { OrderService } from "../order/order.service";
import { Transaction } from "../transaction/transaction.model";
import mongoose from "mongoose";
import { PAYMENTSTATUS } from "../transaction/transaction.interface";
import { Offer } from "../offers/offer.model";
import { IUser } from "../auth/auth.interface";
import emailSender from "../../utilitis/emailSender";
const stripe = new Stripe(config.stripe_key as string, {
  apiVersion: "2024-11-20.acacia",
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
const refundPaymentToCustomer = async (payload: {
  paymentIntentId: string;
}) => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: payload?.paymentIntentId,
    });

    return refund;
  } catch (error: any) {
    throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  }
};
const createPaymentIntentService = async (payload: any) => {
  const { offer } = await OfferService.getSingleOffer(payload.offerId);

  if (!offer) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Offer not found");
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
    amount: offer.totalPrice * 100,
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
    };

    orderResult = await Order.create([order], { session });

    await Transaction.updateOne(
      { _id: transaction[0]._id },
      { orderId: orderResult[0]._id },
      { session }
    );

    await Offer.deleteOne({ id: offer.id }), { session };
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return orderResult[0];
};

const handleAccountUpdated = async (event: any) => {};

const deliverProject = async (orderId: string) => {
  const order = await OrderService.getOrderById(orderId);
  if (!order || !order.result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "order not found");
  }
  const retireProfessional = await User.findOne({
    email: order?.result.orderReciver,
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
  return { transfer, updateTransaction };
};
const generateNewAccountLink = async (user: IUser) => {
  const accountLink = await stripe.accountLinks.create({
    account: user.stripe?.customerId as string,
    refresh_url: "https://your-platform.com/reauth",
    return_url: "https://luminoor.vercel.app",
    type: "account_onboarding",
  });

  const html = `
  <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #007bff; text-align: center;">Complete Your Onboarding</h2>
  
    <p>Dear <b>${user.name.firstName}</b>,</p>
  
    <p>We’re excited to have you onboard! To get started, please complete your onboarding process by clicking the link below:</p>
  
    <div style="text-align: center; margin: 20px 0;">
      <a href=${accountLink.url} style="background-color: #007bff; color: #fff; padding: 12px 20px; border-radius: 5px; text-decoration: none; font-weight: bold;">
        Complete Onboarding
      </a>
    </div>
  
    <p>If the button above doesn’t work, you can also copy and paste this link into your browser:</p>
    <p style="word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
      ${accountLink.url}
    </p>
  
    <p><b>Note:</b> This link is valid for a limited time. Please complete your onboarding as soon as possible.</p>
  
    <p>Thank you,</p>
    <p><b>The Support Team</b></p>
  
    <hr style="border: 0; height: 1px; background: #ddd; margin: 20px 0;">
    <p style="font-size: 12px; color: #777; text-align: center;">
      If you didn’t request this, please ignore this email or contact support.
    </p>
  </div>
  `;
  await emailSender("Your Onboarding Url", user.email, html);
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

  console.log(id,paymentMethodId)
  const user = await User.findById(id );
  console.log(user,"chekc  user")
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
  const user = await User.findById(id );
  console.log(user,"chekc  user")
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
  handleAccountUpdated,
  deliverProject,
  generateNewAccountLink,
  getStripeCardLists,
  createStripeCard,
};
