import { MessageResponse } from "../utils/enum";
import { Request } from "express";
import { User } from "./entity";
export interface IUser {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  pick_up_address?: string;
  referralLevel: number;
  referralCode: string;
  referredCode?: string;
  referrer?: User;
  rootReferredCode?: string;
  stockistAddress?: string;
}

export interface IUserInput {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  pick_up_address?: string;
  referredCode?: string;
}

export interface IUpdateUser {
  firstname?: string;
  lastname?: string;
  email?: string;
  password?: string;
  country?: string;
  dateOfBirth?: string;
  title?: string;
  mini_bio?: string;
  postal_code?: string;
  pick_up_address?: string;
}

export interface IEditUser {
  firstname: string;
  lastname: string;
  email: string;
  accountNumber: number;
  profilePicture: string;
}

export interface IResponseSchema {
  message: MessageResponse;
  description: string;
  data: any;
}

export interface CustomRequest extends Request {
  auth?: any;
}
