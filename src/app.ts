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

export const corsOptions = {
  origin: [
    // "https://tasneem-social-frontend.netlify.app",
    "https://luminoor.vercel.app",
    "http://localhost:3000",
    "http://192.168.11.130:3000",
    "https://allen8797-frontend.vercel.app",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(
  "/api/v1/stripe/payment-webhook",
  express.raw({ type: "application/json" }),
  StripeController.handleWebHook
);
//parser

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
  })
);

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
