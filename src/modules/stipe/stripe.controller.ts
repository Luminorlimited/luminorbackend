import { StatusCodes } from "http-status-codes";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { StripeServices } from "./stripe.service";
import config from "../../config";
import Stripe from "stripe";
import { RetireProfessionalService } from "../professional/professional.service";
import { mergePDFs } from "../../utilitis/generateClientRequirementPdf";
const stripe = new Stripe(config.stripe.secretKey as string, {
  apiVersion: "2024-11-20.acacia",
});
const getCustomerSavedCards = catchAsync(async (req: any, res: any) => {
  const result = await StripeServices.getCustomerSavedCardsFromStripe(
    req?.params?.customerId
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Retrieve customer cards successfully",
    data: result,
  });
});

const deleteCardFromCustomer = catchAsync(async (req: any, res: any) => {
  const result = await StripeServices.deleteCardFromCustomer(
    req.params?.paymentMethodId
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Delete a card successfully",
    data: result,
  });
});

const refundPaymentToCustomer = catchAsync(async (req: any, res: any) => {
  const result = await StripeServices.refundPaymentToCustomer(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Refund payment successfully",
    data: result,
  });
});
const createPaymentIntent = catchAsync(async (req: any, res: any) => {
  const files = req.files;
  let mergedPDFUrl;

  if (files || files.length === 0) {
    mergedPDFUrl = await mergePDFs(
      files,
      req.body.caption,
      req.body.additionalMessage
    );
  } else {
    mergedPDFUrl = await mergePDFs(
      [],
      req.body.caption,
      req.body.additionalMessage
    );
  }
  const order = req.body;
  order.clientRequerment = mergedPDFUrl;
  const result = await StripeServices.createPaymentIntentService(order);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Stipe payment successful",
    data: result,
  });
});
const handleWebHook = catchAsync(async (req: any, res: any) => {
  const sig = req.headers["stripe-signature"] as string;
  if (!sig) {
    return sendResponse(res, {
      statusCode: StatusCodes.BAD_REQUEST,
      success: false,
      message: "Missing Stripe signature header.",
      data: null,
    });
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret as string
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return res.status(400).send("Webhook Error");
  }
  switch (event.type) {
    case "account.updated":
      const account = event.data.object;
      if (
        account.charges_enabled &&
        account.details_submitted &&
        account.payouts_enabled
      ) {
        await RetireProfessionalService.updateProfessionalStripeAccount(
          account
        );
      } else {
      }
      break;

    case "capability.updated":
      break;

    case "financial_connections.account.created":
      break;
    case "account.application.authorized":
      break;
    case "customer.created":
      break;
    case "account.external_account.created":
    default:
  }
  res.status(200).send("Event received");
});

const deliverProject = catchAsync(async (req: any, res: any) => {
  const result = await StripeServices.deliverProject(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "project deliver successfully",
    data: result,
  });
});
export const StripeController = {
  getCustomerSavedCards,
  deleteCardFromCustomer,
  refundPaymentToCustomer,
  createPaymentIntent,
  handleWebHook,
  deliverProject,
};
