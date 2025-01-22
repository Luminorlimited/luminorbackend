// import mongoose, { Schema, model } from "mongoose";
// import { IReview } from "../professional/professional.interface";


// const messageSchema = new Schema<IReview>(
//   {
//     clientId: {
//      type: mongoose.Schema.Types.ObjectId,
//               ref: "Client",
//               required: true,
//     },
//     retireProfessionalId:{
//     type: mongoose.Schema.Types.ObjectId,
//               ref: "RetireProfessional",
//               required: true,
//   }
//   ,

//   rating: {
//       type: Number,
//       enum:[
//         1,2,3,4,5
//       ]



//     },
//     comment: {
//       type: String,
//       default: null,
//     },
   
   
//   },
 

//   {
//     timestamps: true,
//     versionKey: false,
//   }
// );

// export const Message = model("Message", messageSchema);
