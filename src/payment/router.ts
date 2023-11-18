import { Router } from "express";
import { requireSignIn } from "../utils/auth";
import { wrapAsync } from "../utils";
import { paymentController } from "./controller";
import multer from "multer";
// import { paymentValidator } from "./validator";

export const PaymentRouter = Router();

const storage = multer.memoryStorage();

const upload = multer({ storage: storage }).single("image");

PaymentRouter.post("/payment", [requireSignIn, upload], wrapAsync(paymentController.createPayment));

PaymentRouter.get("/payments", [requireSignIn], wrapAsync(paymentController.getAllPayments));

PaymentRouter.get("/completed-payments", [requireSignIn], wrapAsync(paymentController.getAllCompletedPayments));

PaymentRouter.get("/pending-payments", [requireSignIn], wrapAsync(paymentController.getAllPendingPayments));

PaymentRouter.put("/confirm-payment/:id", [requireSignIn], wrapAsync(paymentController.confirmPayment));