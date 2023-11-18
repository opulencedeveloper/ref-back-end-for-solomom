import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { IPaymentController } from "./interface";

class PaymentValidator {
  public async create(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object<IPaymentController>({
      packageName: Joi.string().required().messages({
        "string.base": "Package name must be text",
        "any.required": "Package name is required.",
      }),
    });
    const { error } = schema.validate(req.body);
    if (!error) {
      return next();
    } else {
      return res.json({
        message: "error",
        description: error.details[0].message,
        data: null,
      });
    }
  }
}

export const paymentValidator = new PaymentValidator();
