// import bcrypt from "bcrypt";
// import { User } from "../modules/auth/auth.model";
// import config from "../config";

// // Define the user details (Super Admin in this case)
// export const initiateSuperAdmin = async () => {
//   const payload = {
//     firstName: "Super",
//     lastName: "Admin",

//     email: "superadmin@gmail10p.com",
//     password: "123456",
//     role: "admin",
//     profileUrl:
//       "https://smtech-space.nyc3.digitaloceanspaces.com/message-file/1738906933674_man-6086415_1280.png",
//     phone: "01708383081",
//   };

//   const existingSuperAdmin = await User.findOne({ email: payload.email }).select("+password");

//   if (existingSuperAdmin) {
//     return;
//   } 

//   console.log(config.bcrypt_salt_round,"check salt ")
//   const bycryptSalt=Number(config.bcrypt_salt_round)
//   console.log(bycryptSalt,"check bycrypt salt")

//   const hashedPassword = await bcrypt.hash(
//     payload.password,
//      Number(config.bcrypt_salt_round as string) 
//   );

//   const newUser = {
//     name: {
//       firstName: payload.firstName,
//       lastName: payload.lastName,
//     },
//     email: payload.email,
//     password: hashedPassword,
//     role: payload.role,
//     profileUrl: payload.profileUrl,
//     phone: payload.phone,
//   };

// await User.create(newUser)
//   console.log("Super Admin created successfully.");
// };
