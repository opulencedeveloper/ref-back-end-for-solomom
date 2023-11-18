import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { IAdmin } from "./interface";

class AdminValidator {
  public async create(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object<IAdmin>({
      firstname: Joi.string().required().messages({
        "string.base": "Firstname must be text",
        "any.required": "Firstname is required.",
        'string.empty': 'Firstname should not be empty.',
      }),
      lastname: Joi.string().required().messages({
        "string.base": "Lastname must be text",
        "any.required": "Lastname is required.",
        'string.empty': 'Lastname should not be empty.',
      }),
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text",
        "string.email": "Invalid email format",
        "any.required": "Email is required.",
        'string.empty': 'Email should not be empty.',
      }),
      password: Joi.string().required().messages({
        "string.base": "Password must be text",
        "any.required": "Password is required.",
        'string.empty': 'Password should not be empty.',
      }),
      role: Joi.string().required().messages({
        "string.base": "Role was must be text",
        "any.required": "Role is required.",
        'string.empty': 'Role should not be empty.',
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

  public async createMatchingLevelBonus(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      amount: Joi.number().required().messages({
        "number.base": "Firstname must be text",
        "any.required": "Firstname is required.",
      }).min(1),
      level: Joi.number().required().messages({
        "number.base": "Lastname must be text",
        "any.required": "Lastname is required.",
      }).min(1),
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

  public async login(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text",
        "strig.email": "Invalid email format",
        "any.required": "Email is required.",
      }),
      password: Joi.string().required().messages({
        "string.base": "Password must be text",
        "any.required": "Password is required.",
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

  public async makeUserStockist(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      user_id: Joi.string().required().messages({
        "string.base": "User id must be text",
        "any.required": "User id is required.",
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

export const adminValidator = new AdminValidator();
