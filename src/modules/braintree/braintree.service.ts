import { StatusCodes } from "http-status-codes";
import ApiError from "../../errors/handleApiError";
import { gateway } from "../../utilitis/braintreeConfig";


const generateClientToken=async()=>{
    try {
        const response = await gateway.clientToken.generate({});
        return response
      } catch (error:any) {
       throw new ApiError(StatusCodes.UNAUTHORIZED,error.message)
      }
}


const processPayment=async(payload:any)=>{
    try {
      
        const result = await gateway.transaction.sale({
          amount: payload.amount.toString(),
          paymentMethodNonce: payload.nonce,
          options: { submitForSettlement: true },
        });
    
        if (!result.success) {
         throw new ApiError(StatusCodes.BAD_REQUEST,result.message)
        }
    
       
        const platformFee = (payload.amount * 20) / 100;
        const payoutAmount = payload.amount - platformFee;
    
        // await saveTransactionDetails({
        //   clientId,
        //   professionalId,
        //   platformFee,
        //   payoutAmount,
        //   transactionId: result.transaction.id,
        // });
    
        return result
      } catch (error:any) {
        throw new ApiError(StatusCodes.BAD_REQUEST,error.message)
      }
}


export const BraintreeService={
    generateClientToken,
    processPayment
}