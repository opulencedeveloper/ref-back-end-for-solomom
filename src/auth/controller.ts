import { NextFunction, Request, Response } from "express";
import { userService } from "../user/service";
import Crypto from "crypto";
import { authService } from "./service";
import { sendVerificationEmail } from "../utils/auth";
import { MessageResponse } from "../utils/enum";
import { IVerifiedEmail } from "./interface";

class AuthController {
  public async sendOTP(req: Request, res: Response) {
    const { email } = req.body;

    const userExists = await userService.readUserByEmail(email);

    if (!userExists) {
      const otp = Crypto.randomBytes(4).toString("hex");

      await authService.saveOTP({ email, otp });

      await sendVerificationEmail({
        email,
        otp,
      });

      return res.status(201).json({
        message: MessageResponse.Success,
        description: "An OTP has been sent to your email address",
        data: null,
      });
    }

    return res.status(400).json({
      message: MessageResponse.Error,
      description: "Account already exists",
      data: null,
    });
  }

  public async confirmOTP(req: Request, res: Response) {
    const { email, otp } = req.body;

    const auth = await authService.readOTP(email, otp);

    if (!auth) {
      return res.status(400).json({
        message: MessageResponse.Error,
        description: "Invalid otp",
        data: null,
      });
    }

    const nn: any = auth.createdAt;

    // check expiration status
    let diff: number = Math.abs(Date.now() - nn);

    let hours = diff / (1000 * 60);

    if (hours > 2) {
      return res.status(400).json({
        message: MessageResponse.Error,
        description: "Verification token expired",
        data: null,
      });
    }

    await authService.deleteOTP(email, otp);

    const verifiedEmail: IVerifiedEmail = {
      email: email,
    };

    await authService.saveVerifiedEmail(verifiedEmail);

    return res.status(201).json({
      message: MessageResponse.Success,
      description: "Verification successful",
      data: null,
    });
  }

  public async isUserEmailVerified(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { email } = req.body;

    const isEmailVerified = await authService.readVerifiedEmail(email);

    if (isEmailVerified) {
      return res.status(400).json({
        message: MessageResponse.Error,
        description: "Email is already verified",
        data: null,
      });
    }

    return next();
  }

  public async ensureUserEmailIsVerified(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { email } = req.body;

    const isEmailVerified = await authService.readVerifiedEmail(email);

    if (!isEmailVerified) {
      return res.status(400).json({
        message: MessageResponse.Error,
        description: "Email is not verified",
        data: null,
      });
    }

    return next();
  }
}

export const authController = new AuthController();
