"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
exports.default = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    bcrypt_salt_round: process.env.bcrypt_salt_round,
    front_end_url: process.env.FRONT_END_URL,
    stripe_key: process.env.STRIPE_SECRET_KEY,
    jwt: {
        secret: process.env.JWT_SECRET,
        refresh_secret: process.env.JWT_REFRESH_SECRET,
        expires_in: process.env.JWT_EXPIRES_IN,
        refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
    },
    sosial_login: {
        google: {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        },
        facebook: {
            client_id: process.env.FACEBOOK_CLIENT_ID,
            client_secret: process.env.FACEBOOK_CLIENT_SECRET,
            redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
        },
    },
    s3: {
        do_space_endpoint: process.env.DO_SPACE_ENDPOINT,
        do_space_accesskey: process.env.DO_SPACE_ACCESS_KEY,
        do_space_secret_key: process.env.DO_SPACE_SECRET_KEY,
        do_space_bucket: process.env.DO_SPACE_BUCKET,
    },
    paypal: {
        paypalClientId: process.env.PAYPAL_CLIENT_ID,
        paypalSecretId: process.env.PAYPAL_SECRET_ID,
    },
    zoom: {
        zoomClientId: process.env.ZOOM_CLIENT_ID,
        zoomClientSecret: process.env.ZOOM_CLIENT_SECRET,
        zoomAccountId: process.env.ZOOM_ACCOUNT_ID,
        zooomDevelopmentClientId: process.env.ZOOM_DEVELOPMENT_CLIENT_ID,
        zoomDevelopmentClientSecret: process.env.ZOOM_DEVELOPMENT_CLIENT_SECRET
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_KEY,
        accountId: process.env.STRIPE_ACCOUNT_ID
    },
    braintree: {
        merchantId: process.env.BRAINTREE_MERCHANT_ID,
        publicKey: process.env.BRAINTREE_PUBLIC_KEY,
        privateKey: process.env.BRAITREE_PRIVATE_KEY
    },
    emailSender: {
        email: process.env.EMAIL,
        app_pass: process.env.APP_PASS,
    },
};
