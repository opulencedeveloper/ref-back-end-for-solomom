import { Router } from "express";
import { authController } from "./controller";
import { wrapAsync } from "../utils";
import { authValidator } from "./validator";

export const AuthRouter = Router();

AuthRouter.post(
  "/verify-email/", [authValidator.create, authController.isUserEmailVerified], wrapAsync(authController.sendOTP)
);

AuthRouter.post(
  "/confirm-otp/", [authValidator.verifyOtp, authController.isUserEmailVerified], wrapAsync(authController.confirmOTP)
);
