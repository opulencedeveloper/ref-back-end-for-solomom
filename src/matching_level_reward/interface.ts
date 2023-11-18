import { User } from "../user/entity";

export interface IMatchingLevel {
    amount: number;
    source_user_fullname: string;
    received_on_level: number;
    receiver_user_id: string;
    user: User;
}