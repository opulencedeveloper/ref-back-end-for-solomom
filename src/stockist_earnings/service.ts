import { AppDataSource } from "../../app";
import { StockistEarnings } from "./entity";

class StockistEarningsService {
  public async getStockistEarningsById(id: string) {
    const userPickups = await AppDataSource.getRepository(
      StockistEarnings
    ).find({
      where: {
        stockist_id: id,
      },
    });

    return userPickups;
  }
}

export const stockistEarningsService = new StockistEarningsService();
