import { User } from "../user/entity";
import { BonusType } from "./enum";

export interface IBonus{
    type: BonusType;
    amount: number;
    packageName: string;
    user: User;
}