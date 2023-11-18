import { AdminRole } from "./enum";

export interface IAdmin {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    role: AdminRole;   
}
