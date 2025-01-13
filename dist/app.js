"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const routes_1 = require("./routes");
const globalErrorHandler_1 = __importDefault(require("./middlewares/globalErrorHandler"));
const http_status_codes_1 = require("http-status-codes");
const passport_1 = __importDefault(require("passport"));
const socialLogin_route_1 = require("./modules/socialLogin/socialLogin.route");
const express_session_1 = __importDefault(require("express-session"));
const stripe_controller_1 = require("./modules/stipe/stripe.controller");
const app = (0, express_1.default)();
exports.corsOptions = {
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
app.use((0, cors_1.default)(exports.corsOptions));
app.use((0, cookie_parser_1.default)());
app.use("/api/v1/stripe/payment-webhook", express_1.default.raw({ type: "application/json" }), stripe_controller_1.StripeController.handleWebHook);
//parser
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === "production" },
}));
//handle not found
app.get("/", (req, res) => {
    res.send({
        message: "Demos Server is Running",
    });
});
app.set("view engine", "ejs");
// Set the correct path to the 'views' folder
app.set("views", path_1.default.join(__dirname, "../views"));
app.get("/payment", (req, res) => {
    res.render("braintree"); // Assuming your file is named braintree.ejs
});
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(socialLogin_route_1.socialLoginRoutes);
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "uploads")));
app.use("/api/v1", routes_1.routes);
app.use(globalErrorHandler_1.default);
//global error handler
app.use((req, res, next) => {
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
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
exports.default = app;
