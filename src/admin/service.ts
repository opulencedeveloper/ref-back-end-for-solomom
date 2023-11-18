import { AppDataSource } from "../../app";
import { MatchingLevelBonusAmount } from "../MatchingLevelBonusAmount/entity";
import { Bonus } from "../bonus/entity";
import { BonusType } from "../bonus/enum";
import { MatchingLevel } from "../matching_level_reward/entity";
import { Payment } from "../payment/entity";
import { User } from "../user/entity";
import { UserRole } from "../user/enum";
import { hashPassword } from "../utils/auth";
import { Admin } from "./entity";
import { IAdmin } from "./interface";

class AdminService {
  public async saveAdmin(input: IAdmin) {
    const newAdmin = new Admin();

    newAdmin.firstname = input.firstname;

    newAdmin.lastname = input.lastname;

    newAdmin.email = input.email;

    const hashedPassword = await hashPassword(input.password);

    newAdmin.password = `${hashedPassword}`;

    newAdmin.role = input.role;

    const admin = await AppDataSource.getRepository(Admin).save(newAdmin);

    return admin;
  }

  public async readAdmin(id: string) {
    const admin = await AppDataSource.getRepository(Admin).findOne({
      where: { id },
    });

    return admin;
  }

  public async readAllAdmins() {
    const admins = await AppDataSource.getRepository(Admin).find();

    return admins;
  }

  public async readAdminByEmail(email: string) {
    const admin = await AppDataSource.getRepository(Admin).findOne({
      where: { email },
    });

    return admin;
  }

  public async makeUserStockist(user_id: string) {
    const user = await AppDataSource.getRepository(User).update(
      { id: user_id },
      { role: UserRole.Stockist }
    );

    return user;
  }

  public async readBonusses(){
    const bonuses = await AppDataSource.getRepository(Bonus).find();

    const matchingLevelBonusses = await AppDataSource.getRepository(MatchingLevel).find();

    let totalCommissions = 0;

    let totalPoints = 0;

    let totalMatchingLevelBonusses = 0;

    for(const bonus of bonuses){
      if(bonus.type === BonusType.Commission){
        totalCommissions += bonus.amount
      }else if(bonus.type === BonusType.Point){
        totalPoints += bonus.amount
      }
    }

    for(const matchingLevelBonus of matchingLevelBonusses){
      totalMatchingLevelBonusses += matchingLevelBonus.amount
    }

    return {
      totalCommissions,
      totalPoints,
      totalMatchingLevelBonusses
    }
  }

  public async readTotalMoney(){
    const payments = await AppDataSource.getRepository(Payment).find({
      where: { paid: true }
    });

    let totalMoney = 0;

    for(const payment of payments){
      totalMoney += payment.price
    }

    return totalMoney
  }

  public async createMatchingLevelBonusAmount(amount: number, level: number){
    const matchingLevelBonusAmount = new MatchingLevelBonusAmount();

    matchingLevelBonusAmount.amount = amount;

    matchingLevelBonusAmount.level = level;

    const matchingLevelBonusAmountSaved = await AppDataSource.getRepository(MatchingLevelBonusAmount).save(matchingLevelBonusAmount);

    return matchingLevelBonusAmountSaved;
  }

  public async readMatchingLevelBonusAmounts(){
    const matchingLevelBonusAmounts = await AppDataSource.getRepository(MatchingLevelBonusAmount).find();

    return matchingLevelBonusAmounts;
  }

  public async readMatchingLevelBonusByLevel(level: number){
    const matchingLevelBonusAmount = await AppDataSource.getRepository(MatchingLevelBonusAmount).findOne({
      where: {
        level
      }
    });

    return matchingLevelBonusAmount;
  }

  public async updateMatchingLevelBonusByLevel(level: number, amount: number){
    const matchingLevelBonusAmount = await AppDataSource.getRepository(MatchingLevelBonusAmount).update(
      {level},
      {amount}
    );

    return matchingLevelBonusAmount;
  }
}

export const adminService = new AdminService();
