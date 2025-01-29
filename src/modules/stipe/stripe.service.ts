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

// Initialize Stripe with your secret API key
const stripe = new Stripe(config.stripe_key as string, {
  //   apiVersion: "2024-06-20",
  apiVersion: "2024-11-20.acacia",
});

// Step 1: Create a Customer and Save the Card
// const saveCardWithCustomerInfoIntoStripe = async (
//   payload: TStripeSaveWithCustomerInfo,
//   userId: string
// ) => {
//   try {
//     const { user, paymentMethodId, address } = payload;

//     // Create a new Stripe customer
//     const customer = await stripe.customers.create({
//       name: user.name,
//       email: user.email,
//       address: {
//         city: address.city,
//         postal_code: address.postal_code,
//         country: address.country,
//       },
//     });

//     // Attach PaymentMethod to the Customer
//     await stripe.paymentMethods.attach(paymentMethodId, {
//       customer: customer.id,
//     });

//     // Set PaymentMethod as Default
//     await stripe.customers.update(customer.id, {
//       invoice_settings: {
//         default_payment_method: paymentMethodId,
//       },
//     });

//     // update profile with customerId
//     await User.findByIdAndUpdate(
//       {
//         _id: userId,
//       },
//       {
//         customerId: customer.id,
//       }
//     );

//     return {
//       customerId: customer.id,
//       paymentMethodId: paymentMethodId,
//     };
//   } catch (error: any) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
//   }
// };

// Step 2: Authorize the Payment Using Saved Card
// const authorizedPaymentWithSaveCardFromStripe = async (payload: {
//   customerId: string;
//   amount: number;
//   paymentMethodId: string;
// }) => {
//   try {
//     const { customerId, amount, paymentMethodId } = payload;

//     if (!isValidAmount(amount)) {
//       throw new ApiError(
//         StatusCodes.BAD_REQUEST,
//         `Amount '${amount}' is not a valid amount`
//       );
//     }

//     // Create a PaymentIntent with the specified PaymentMethod
//     const paymentIntent = await stripe.paymentIntents.create({
//       amount: amount * 100, // Convert to cents
//       currency: "usd",
//       customer: customerId,
//       payment_method: paymentMethodId,
//       off_session: true,
//       confirm: true,
//       capture_method: "manual", // Authorize the payment without capturing
//     });

//     return paymentIntent;
//   } catch (error: any) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
//   }
// };

// Step 3: Capture the Payment
// const capturePaymentRequestToStripe = async (payload: {
//   paymentIntentId: string;
// }) => {
//   try {
//     const { paymentIntentId } = payload;

//     // Capture the authorized payment using the PaymentIntent ID
//     const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

//     return paymentIntent;
//   } catch (error: any) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
//   }
// };

// New Route: Save a New Card for Existing Customer
// const saveNewCardWithExistingCustomerIntoStripe = async (payload: {
//   customerId: string;
//   paymentMethodId: string;
// }) => {
//   try {
//     const { customerId, paymentMethodId } = payload;

//     // Attach the new PaymentMethod to the existing Customer
//     await stripe.paymentMethods.attach(paymentMethodId, {
//       customer: customerId,
//     });

//     // Optionally, set the new PaymentMethod as the default
//     await stripe.customers.update(customerId, {
//       invoice_settings: {
//         default_payment_method: paymentMethodId,
//       },
//     });

//     return {
//       customerId: customerId,
//       paymentMethodId: paymentMethodId,
//     };
//   } catch (error: any) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
//   }
// };

const getCustomerSavedCardsFromStripe = async (customerId: string) => {
  try {
    // List all payment methods for the customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
    });

    return { paymentMethods: paymentMethods.data };
  } catch (error: any) {
    throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  }
};

// Delete a card from a customer in the stripe
const deleteCardFromCustomer = async (paymentMethodId: string) => {
  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    return { message: "Card deleted successfully" };
  } catch (error: any) {
    throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  }
};

// Refund amount to customer in the stripe
const refundPaymentToCustomer = async (payload: {
  paymentIntentId: string;
}) => {
  try {
    // Refund the payment intent
    const refund = await stripe.refunds.create({
      payment_intent: payload?.paymentIntentId,
    });

    return refund;
  } catch (error: any) {
    throw new ApiError(StatusCodes.BAD_REQUEST, error.message);
  }
};

// const createPaymentIntentService = async (payload: any) => {
//   // console.log(payload, "check payload");

//   if (!payload.amount) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, "Amount is required");
//   }

//   if (!isValidAmount(payload.amount)) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       `Amount '${payload.amount}' is not a valid amount`
//     );
//   }

//   // Create a PaymentIntent with Stripe
//   const paymentIntent = await stripe.paymentIntents.create({
//     amount: payload.amount, // Total amount in cents
//     currency: "usd",
//     customer: payload.customerId,
//     payment_method: payload.paymentMethodId,
//     confirm: true,
//     setup_future_usage: "on_session",
//     // application_fee_amount: platformFee,

//     // transfer_data: {
//     //   destination: config.stripe.accountId as string,
//     //   // amount: retireProfessionalAmount, // Transfer amount in cents
//     // },
//     automatic_payment_methods: {
//       enabled: true,
//       allow_redirects: "never", // Disallow redirect-based methods
//     },
//   });
//   const offer = await OfferService.getSingleOffer(payload.offerId);
//   let orderResult;

//   if (offer && paymentIntent.status === "succeeded") {
//     const order = {
//       clientRequerment: payload.clientRequerment,
//       orderFrom: offer.clientEmail,
//       orderReciver: offer.professionalEmail,

//       deliveryDate: offer.totalDeliveryTime,
//       totalPrice: offer.totalPrice,

//       project: payload.offerId,

//       paymentIntentId: payload.paymentMethodId,
//     };
//     console.log(order, "check order");
//     orderResult = await Order.create(order);
//   }

//   return orderResult;
// };
const createPaymentIntentService = async (payload: any) => {
  console.log(payload, "check payload");
  const { offer } = await OfferService.getSingleOffer(payload.offerId);
  console.log(offer, "check offer");
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

  // Create a PaymentIntent with Stripe
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

const handleAccountUpdated = async (event: any) => {
  console.log(event, "check even from handle account updated");
};

const deliverProject = async (orderId: string) => {
  // console.log(orderId, "check orderId")
  const order = await OrderService.getOrderById(orderId);

  // console.log(order, "check order")
  if (!order || !order.result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "order not found");
  }
  const retireProfessional = await User.findOne({
    email: order?.result.orderReciver,
  });
  if (!retireProfessional) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "user not found");
  }
  // console.log(retireProfessional, "check retire professional");
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
  // console.lo
  const updateTransaction = await Transaction.findOneAndUpdate(
    { _id: order.result.transaction },
    { $set: { paymentStatus: PAYMENTSTATUS.COMPLETED } },
    { new: true }
  );
  console.log(updateTransaction, "check update transaction");
  return { transfer, updateTransaction };
};

const generateAccountLink = async (id: string) => {
  // Find the user by ID
  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (!user.stripe?.customerId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "User does not have a Stripe customer ID"
    );
  }

  try {
    // Create the account link
    const accountLink = await stripe.accountLinks.create({
      account: user.stripe.customerId,
      refresh_url: "https://your-platform.com/reauth",
      return_url: "https://your-platform.com/return",
      type: "account_onboarding",
    });

    // Update the user with the new onboarding URL
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { "stripe.onboardingUrl": accountLink.url },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Failed to update the user with the onboarding URL"
      );
    }

    return updatedUser;
  } catch (error) {
    console.error("Error generating account link:", error);
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Failed to generate account link"
    );
  }
};
export const StripeServices = {
  // saveCardWithCustomerInfoIntoStripe,
  // authorizedPaymentWithSaveCardFromStripe,
  // capturePaymentRequestToStripe,
  // saveNewCardWithExistingCustomerIntoStripe,
  getCustomerSavedCardsFromStripe,
  deleteCardFromCustomer,
  refundPaymentToCustomer,
  createPaymentIntentService,
  handleAccountUpdated,
  deliverProject,
  generateAccountLink,
};
