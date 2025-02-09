import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/handleApiError";
import { gateway } from "../../utilitis/braintreeConfig";
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
    const professional = await RetireProfessional.findOne({
      retireProfessional: professionalId,
    });
    if (!professional) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "professional not found");
    }
    const platformFee = (amount * 20) / 100;
    const payoutAmount = amount - platformFee;
    const result = await gateway.transaction.sale({
      amount: payoutAmount.toString(),
      paymentMethodNonce: nonce,
      customer: {
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
      options: { submitForSettlement: true },
    });
    if (!result.success) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, result.message);
    }
  } catch (error: any) {
    console.error("Error processing payment:", error);
    throw new ApiError(StatusCodes.UNAUTHORIZED, error.message);
  }
};
export const BraintreeService = {
  generateClientToken,
  processPayment,
};
