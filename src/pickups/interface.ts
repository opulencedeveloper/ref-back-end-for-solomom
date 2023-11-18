import { Request } from "express";

export interface IPickup {
  stockist_id: string;
  user_id: string;
  package_name: string;
  received_by_user?: Boolean;
  delivered_by_stockist?: Boolean;
}

export interface CustomRequest extends Request {
  auth?: any;
}
