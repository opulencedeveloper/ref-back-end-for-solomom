import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { IOTP } from "./interface";

class AuthValidator {
  public async create(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object<IOTP>({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text",
        "strig.email": "Invalid email format",
        "any.required": "Email is required.",
      }),
    });

    const { error } = schema.validate(req.body);

    if (!error) {
      return next();
    } else {
      return res.status(400).json({
        message: "error",
        description: error.details[0].message,
        data: null,
      });
    }
  }

  public async verifyOtp(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object<IOTP>({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text",
        "strig.email": "Invalid email format",
        "any.required": "Email is required.",
      }),
      otp: Joi.string().required().messages({
        "string.base": "OTP must be text",
        "any.required": "OTP is required.",
      }),
    });

    const { error } = schema.validate(req.body);

    if (!error) {
      return next();
    } else {
      return res.status(400).json({
        message: "error",
        description: error.details[0].message,
        data: null,
      });
    }
  }
}

export const authValidator = new AuthValidator();
