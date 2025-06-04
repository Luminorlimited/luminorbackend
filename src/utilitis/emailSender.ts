import axios from "axios";
import config from "../config";
import { tryCatch } from "bullmq";

// const emailSender = async (subject: string, email: string, html: string) => {
//   const transporter = nodemailer.createTransport({
//     service: "gmail",
//     auth: {
//       user: config.emailSender.email,
//       pass: config.emailSender.app_pass,
//     },
//   });
// //
//   const emailTransport = transporter;

//   const mailOptions = {
//     from: `"Luminor" <${config.emailSender.email}>`,
//     to: email,
//     subject,
//     html,
//   };

//   // Send the email
//   try {
//     const info = await emailTransport.sendMail(mailOptions);

//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw new ApiError(500, "Error sending email");
//   }
// };

// export default emailSender;

const emailSender = async (
subject: string, email: string, html: string
) => {
  const payload = {
    sender: {
      name: "Luminor",
      email: "masukkabir.dev@gmail.com",
    },
    to: [
      {
        email: email,
      },
    ],
    subject,
    htmlContent: html,

  };
   try {
      await axios.post("https://api.brevo.com/v3/smtp/email", payload, {
    headers: {
      "api-key": config.brevo.brevo_api_key,
      "Content-Type": "application/json",
    },
  });
   } catch (error) {
    console.log(error,'check error form email sender')
   }
};

export default emailSender;
