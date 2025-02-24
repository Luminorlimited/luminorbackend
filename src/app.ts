import cors from "cors";
import express, { Application, NextFunction, Request, Response } from "express";
import path from "path";
import cookieParser from "cookie-parser";
import { routes } from "./routes";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import { StatusCodes } from "http-status-codes";
import passport from "passport";
import { socialLoginRoutes } from "./modules/socialLogin/socialLogin.route";
import session from "express-session";
import { StripeController } from "./modules/stipe/stripe.controller";

const app: Application = express();

app.use(
  "/api/v1/stripe/payment-webhook",
  express.raw({ type: "application/json" }),
  StripeController.handleWebHook
);
export const corsOptions = {
  origin: [
    "https://luminoor.vercel.app",
    "http://localhost:3000",
    "http://10.0.20.68:3000",
    "https://luminor-ltd.com",
    "https://www.luminor-ltd.com",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(cookieParser());

app.use(express.json());
//parser

app.use(express.urlencoded({ extended: true }));



//handle not found
app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Demos Server is Running",
  });
});
app.set("view engine", "ejs");

// Set the correct path to the 'views' folder
app.set("views", path.join(__dirname, "../views"));
app.get("/payment", (req, res) => {
  // res.render("braintree"); // Assuming your file is named braintree.ejs
  res.render("stripe"); // Assuming your file is named braintree.ejs
});

app.use(passport.initialize());
app.use(passport.session());
app.use(socialLoginRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v1", routes);

app.use(globalErrorHandler);
//global error handler

app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: "Not Found",
    errorMessages: [
      {
        path: req.originalUrl,
        message: "API Not Found",
      },
    ],
  });
  next();
});

export default app;
