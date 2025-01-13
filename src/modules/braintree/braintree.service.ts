import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/handleApiError";
import { gateway } from "../../utilitis/braintreeConfig";
import { STATUS_CODES } from "http";
import { RetireProfessional } from "../professional/professional.model";

const generateClientToken = async () => {
  try {
    const response = await gateway.clientToken.generate({});
    return response;
  } catch (error: any) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, error.message);
  }
};

const processPayment = async (payload: any) => {
  try {
    const { amount, nonce, professionalId } = payload;

    // Fetch professional's bank details
    const professional = await RetireProfessional.findOne({
      retireProfessional: professionalId,
    });
    if (!professional) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "professional not found");
    }

    // Create Braintree transaction
    const platformFee = (amount * 20) / 100;
    const payoutAmount = amount - platformFee;
    const result = await gateway.transaction.sale({
      amount: payoutAmount.toString(),
      paymentMethodNonce: nonce,
      customer: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        // email: payload.email,
        // phone: payload.phone,
      },
      options: { submitForSettlement: true },
    });
    console.log(result, "check result");

    if (!result.success) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, result.message);
    }

    // Calculate platform fee and payout amount

    // Save payment details to database
    //  const payment = new Payment({
    //    professionalId,
    //    amount,
    //    platformFee,
    //    payoutAmount,
    //    transactionId: result.transaction.id,
    //    paymentMethod,
    //    status: "Completed",
    //  });
    //  await payment.save();

    //  // Simulate payout (Replace with actual bank transfer API integration)
    //  console.log("Payout to Professional:", {
    //    name: professional.name,
    //    bankName: professional.bankName,
    //    accountNumber: professional.accountNumber,
    //    amount: payoutAmount,
    //  });

    //  res.status(200).json({
    //    message: "Payment processed successfully",
    //    transactionId: result.transaction.id,
    //    platformFee,
    //    payoutAmount,
    //  });
  } catch (error: any) {
    console.error("Error processing payment:", error);
    throw new ApiError(StatusCodes.UNAUTHORIZED, error.message);
  }
};

export const BraintreeService = {
  generateClientToken,
  processPayment,
};
