import { AppDataSource } from "../../app";
import { Pickup } from "./entity";
import { IPickup } from "./interface";
import { UserRole } from "../user/enum";
import { User } from "../user/entity";
import { Package } from "../package/entity";
import { IBonus } from "../bonus/interface";
import { Bonus } from "../bonus/entity";
import { IStockistEarnings } from "../stockist_earnings/interface";
import { StockistEarnings } from "../stockist_earnings/entity";

class PickupService {
  public async savePickup(input: IPickup) {
    const { stockist_id, user_id, package_name } = input;

    const newPickup = new Pickup();

    newPickup.stockist_id = stockist_id;

    newPickup.user_id = user_id;

    newPickup.package_name = package_name;

    const user = await AppDataSource.getRepository(Pickup).save(newPickup);

    return user;
  }

  public async getUserPickupsByUserId(id: string) {
    const userPickups = await AppDataSource.getRepository(Pickup).find({
      where: {
        user_id: id,
      },
    });

    return userPickups;
  }

  public async getUserPickupsByStockistId(id: string) {
    const userPickups = await AppDataSource.getRepository(Pickup).find({
      where: {
        stockist_id: id,
      },
    });

    return userPickups;
  }

  public async readPickupById(id: string) {
    const payment = await AppDataSource.getRepository(Pickup).findOne({
      where: { id }
    });

    return payment;
  }

  public async userPickupConfirmation(id: string) {
    const payment = await AppDataSource.getRepository(Pickup).update(
      { id },
      { received_by_user: true }
    );

    return payment;
  }

  public async stockistPickupConfirmation(id: string) {
    const payment = await AppDataSource.getRepository(Pickup).update(
      { id },
      { delivered_by_stockist: true }
    );

    return payment;
  }

  public async findStockistUserId(id: string) {
    const stockistUsers = await AppDataSource.getRepository(User).findOne({
      where: {
        id,
        role: UserRole.Stockist,
      },
    });

    return stockistUsers;
  }

  public async findPackageByName(name: string) {
    const stockistUsers = await AppDataSource.getRepository(Package).findOne({
      where: {
        name
      },
    });

    return stockistUsers;
  }

  public async saveCommision(input: IBonus) {
    const newCommision = new Bonus();

    newCommision.type = input.type;

    newCommision.amount = input.amount;

    newCommision.packageName = input.packageName;

    newCommision.user = input.user;

    const savedCommision = await AppDataSource.getRepository(Bonus).save(newCommision);

    return savedCommision;
  }

  public async saveStockistEarinigs(input: IStockistEarnings) {
    const newStockistEarnings = new StockistEarnings();

    newStockistEarnings.stockist_id = input.stockist_id;

    newStockistEarnings.package_name = input.package_name;

    newStockistEarnings.commission = input.commission;

    const savedCommision = await AppDataSource.getRepository(StockistEarnings).save(newStockistEarnings);

    return savedCommision;
  }

}

export const pickupService = new PickupService();
