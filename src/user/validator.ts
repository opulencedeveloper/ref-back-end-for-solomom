import Joi from "joi";
import { Request, Response, NextFunction } from "express";
import { IUpdateUser, IUserInput, IEditUser } from "./interface";

class UserValidator {
  public async create(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object<IUserInput>({
      firstname: Joi.string().required().messages({
        "string.base": "Firstname must be text",
        "any.required": "Firstname is required.",
      }),
      lastname: Joi.string().required().messages({
        "string.base": "Lastname must be text",
        "any.required": "Lastname is required.",
      }),
      email: Joi.string().email().required().messages({
        "string.base": "Email must be text",
        "string.email": "Invalid email format",
        "any.required": "Email is required.",
      }),
      password: Joi.string().required().messages({
        "string.base": "Password must be text",
        "any.required": "Password is required.",
      }),
      pick_up_address: Joi.string().messages({
        "string.base": "Pickup Address must be text",
      }),
      referredCode: Joi.string().messages({
        "string.base": "Referred code must be text",
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
  // public async currentUser(req: Request, res: Response, next: NextFunction) {
  //   const schema = Joi.object({
  //     user_id: Joi.string().required().messages({
  //       "string.base": "User id must be text",
  //       "any.required": "User id is required.",
  //     }),
  //   });
  //   const { error } = schema.validate(req.auth);
  //   if (!error) {
  //     return next();
  //   } else {
  //     return res.json({
  //       message: "error",
  //       description: error.details[0].message,
  //       data: null,
  //     });
  //   }
  // }
  public async refreshToken(req: Request, res: Response, next: NextFunction) {
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
  public async update(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object<IUpdateUser>({
      firstname: Joi.string().messages({
        "string.base": "First name must be text",
      }),
      lastname: Joi.string().messages({
        "string.base": "Last name must be text",
      }),
      email: Joi.string().email().messages({
        "string.base": "Email must be text",
        "string.email": "Invalid email format",
      }),
      country: Joi.string().messages({
        "string.base": "Country must be text",
      }),
      dateOfBirth: Joi.string().messages({
        "string.base": "Date of birth must be text",
      }),
      title: Joi.string().messages({
        "string.base": "Title must be text",
      }),
      mini_bio: Joi.string().messages({
        "string.base": "Mini bio must be text",
      }),
      postal_code: Joi.string().length(6).messages({
        "string.base": "Postal code must be text",
        "string.length": "Postal code must be exactly 6 characters long",
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

  public async edit(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object<IEditUser>({
      firstname: Joi.string().messages({
        "string.base": "First name must be text",
      }),
      lastname: Joi.string().messages({
        "string.base": "Last name must be text",
      }),
      email: Joi.string().email().messages({
        "string.base": "Email must be text",
        "string.email": "Invalid email format",
      }),
      accountNumber: Joi.number().messages({
        "number.base": "Account Number must be number",
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

  public async updatePassword(req: Request, res: Response, next: NextFunction) {
    const schema = Joi.object({
      oldPassword: Joi.string().required().messages({
        "string.base": "Old password must be text",
        "any.required": "Old password is required.",
      }),
      newPassword: Joi.string().required().messages({
        "string.base": "New password must be text",
        "any.required": "New password is required.",
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

export const userValidator = new UserValidator();
