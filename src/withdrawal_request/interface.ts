import { WithdrawalRequest } from "./entity";

export interface IWithdrawalRequest extends WithdrawalRequest {}

export interface IWithdrawalRequestBasic {
  user_id: string;
  fullName: string;
  amount: number;
  email: string;
}
