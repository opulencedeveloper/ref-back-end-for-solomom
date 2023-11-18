import { Package } from "../package/entity";
import { User } from "../user/entity";
import { Request } from "express";

export interface IPaymentService {
    price: number;
    packageName: string;
    receiptImageUrl: string;
    user: User;
    packagePayment: Package;
}

export interface IPaymentController {
    packageName: string;
    // user: User;
    // packagePayment: Package;
}

export interface CustomRequest extends Request {
    // Define the structure of the data here
    file: Express.Multer.File;
    auth?: any;
  }