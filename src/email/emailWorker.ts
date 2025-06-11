import { StatusCodes } from "http-status-codes";
import ApiError from "../errors/handleApiError";
import { User } from "../modules/auth/auth.model";
import emailSender from "../utilitis/emailSender";
import { Offer } from "../modules/offers/offer.model";

const offerSend = async (userId: string, offerId: string) => {
  const user = await User.findById(userId);
  const offer = await Offer.findById(offerId)
    .populate("clientEmail")
    .populate("professionalEmail");


  const professional=offer?.professionalEmail as any

  if (!user || !offer) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User or Offer not found");
  }

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>New Offer Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <div style="max-width: 650px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background-color: #5633d1; padding: 30px 20px; text-align: center;">
            <h2 style="margin: 0; color: #ffffff; font-size: 26px;">You’ve Received a New Offer!</h2>
        </div>
        <div style="padding: 25px 30px;">
            <p style="font-size: 18px; color: #333333;">Hi <b>${user.name.firstName}</b>,</p>
            <p style="font-size: 16px; color: #333333;">You’ve received a new offer for <strong>"${offer.projectName}"</strong> from <b>${professional.name.firstName} ${professional.name.lastName}</b>.</p>

            <div style="background-color: #f9f9f9; border-left: 4px solid #5633d1; padding: 15px 20px; margin: 20px 0; border-radius: 8px;">
                <p style="margin: 0; font-size: 16px; color: #333;"><strong>Offer Details:</strong></p>
                <ul style="margin: 10px 0 0 18px; padding: 0; color: #555555;">
                    <li><strong>Project:</strong> ${offer.projectName}</li>
                    <li><strong>Total Price:</strong> $${offer.totalPrice}</li>
                    <li><strong>Delivery Time:</strong> ${offer.totalDeliveryTime} days</li>
                    <li><strong>Agreement Type:</strong> ${offer.agreementType}</li>
                </ul>
            </div>

            <p style="font-size: 16px; color: #333333;">Click the button below to view the full offer and take action.</p>
            <div style="text-align: center; margin-top: 30px;">
                <a href="https://yourdomain.com/dashboard/offers/${offerId}" 
                   style="background-color: #5633d1; padding: 12px 30px; border-radius: 6px; color: #ffffff; text-decoration: none; font-weight: bold;">
                   View Offer
                </a>
            </div>

            <p style="margin-top: 40px; font-size: 14px; color: #777777;">If you have questions or need help, reach out to us at 
                <a href="mailto:luminorlimited@gmail.com" style="color: #5633d1; text-decoration: none;">luminorlimited@gmail.com</a>.
            </p>
        </div>
        <div style="background-color: #f0f0f0; padding: 12px; text-align: center; font-size: 12px; color: #999999;">
            <p style="margin: 0;">© 2025 Luminor. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;


  await emailSender("Luminor Offer Received", user.email, html);
};

const messageSend = async (
  senderList: string,
  receiverName: string,
  receiverEmail:string

) => {
  try {
    // console.log("check message send from email workder demo")
    // const [sender, receiver] = await Promise.all([
    //   User.findById(senderId),
    //   User.findById(receiverId),
    // ]);

    // if (!sender || !receiver) {
    //   throw new Error("Sender or receiver not found");
    // }

    // const senderName = `${sender?.name?.firstName || "Someone"} ${sender?.name?.lastName || ""}`;
    // const receiverName = `${receiver?.name?.firstName || "User"}`;

    // const messagePreview = message.length > 150 ? `${message.slice(0, 150)}...` : message;

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>New Message Received</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 650px; margin: 30px auto; background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 14px rgba(0,0,0,0.1); overflow: hidden;">
            <div style="background-color: #5633d1; padding: 25px 20px; text-align: center;">
                <h2 style="margin: 0; color: #ffffff; font-size: 24px;">📬 You've Got a New Message!</h2>
            </div>
            <div style="padding: 25px 30px;">
                <p style="font-size: 18px; color: #333;">Hi <b>${receiverName}</b>,</p>
                <p style="font-size: 16px; color: #333;">You’ve unread message from <strong>${senderList}</strong>.</p>

               

                
                <p style="margin-top: 40px; font-size: 14px; color: #777;">Need help? Contact us at 
                    <a href="mailto:support@yourdomain.com" style="color: #5633d1; text-decoration: none;">support@yourdomain.com</a>.
                </p>
            </div>
            <div style="background-color: #f0f0f0; padding: 12px; text-align: center; font-size: 12px; color: #999;">
                <p style="margin: 0;">© 2025 Luminor. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;

    await emailSender("You've received a message on Luminor", receiverEmail, html);
      // console.log("cafeter email sender to send message")
  } catch (error) {
    console.error("Failed to send message email:", error);
  }
};


export const emailWorker = {
  offerSend,
  messageSend
};
