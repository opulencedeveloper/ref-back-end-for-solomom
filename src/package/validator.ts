import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { IPackage, IUpdatePackage } from "./interface";

class PackageValidator {
  public async createPackage(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object<IPackage>({
      name: Joi.string().required().messages({
        "string.base": "Name must be text",
        "any.required": "Name is required.",
      }),
      commission: Joi.number().required().messages({
        "number.base": "Commission must be number",
        "any.required": "Commission is required.",
      }),
      point: Joi.number().required().messages({
        "number.base": "Point must be number",
        "any.required": "Point is required.",
      }),
      amount: Joi.number().required().messages({
        "number.base": "Amount must be number",
        "any.required": "Amount is required.",
      }),
      stockistAmount: Joi.number().required().messages({
        "number.base": "Stockist Amount must be number",
        "any.required": "Stockist Amount is required.",
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

  public async updatePackage(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object<IUpdatePackage>({
      id: Joi.string().required().messages({
        "string.base": "Id must be text",
        "any.required": "Id is required.",
      }),
      name: Joi.string().messages({
        "string.base": "Name must be text",
      }),
      commission: Joi.number().messages({
        "number.base": "Commission must be text",
      }),
      point: Joi.number().messages({
        "number.base": "Point must be text",
      }),
      amount: Joi.number().messages({
        "number.base": "Amount be number",
      }),
      stockistAmount: Joi.number().messages({
        "number.base": "Stockist Amount must be number",
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

export const packageValidator = new PackageValidator();
