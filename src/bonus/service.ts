import { AppDataSource } from "../../app";
import { Bonus } from "./entity";
import { BonusType } from "./enum";
import { IBonus } from "./interface";

class BonusService {
  public async saveBonus(input: IBonus) {
    const newBonus = new Bonus();

    newBonus.type = input.type;

    newBonus.amount = input.amount;

    newBonus.packageName = input.packageName;

    newBonus.user = input.user;

    const savedBonus = await AppDataSource.getRepository(Bonus).save(newBonus);

    return savedBonus;
  }

  public async getBonus(id: string) {
    const bonus = await AppDataSource.getRepository(Bonus).findOne({
      where: {
        id: id,
      },
    });

    return bonus;
  }

  public async getAllBonus() {
    const bonus = await AppDataSource.getRepository(Bonus).find();

    return bonus;
  }

  public async getAllBonusPoints() {
    const bonus = await AppDataSource.getRepository(Bonus).find({
      where: {
        type: BonusType.Point
      }
    });

    return bonus;
  }

  public async getAllBonusCommissions() {
    const bonus = await AppDataSource.getRepository(Bonus).find({
      where: {
        type: BonusType.Point
      }
    });

    return bonus;
  }
}

export const bonusService = new BonusService();
