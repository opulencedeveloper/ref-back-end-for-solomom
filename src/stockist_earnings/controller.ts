import { Response } from "express";

import { CustomRequest } from "../utils/interface";
import { MessageResponse } from "../utils/enum";
import { stockistEarningsService } from "./service";

class StockistEarningsController {
  public async getStockistEarnings(req: CustomRequest, res: Response) {
    const stockistId = req.auth.user_id;

    const stockistEarnings =
      await stockistEarningsService.getStockistEarningsById(stockistId);

    return res.json({
      message: MessageResponse.Success,
      description: "Earnings retrieved successfully",
      data: stockistEarnings,
    });
  }
}

export const stockistEarningsController = new StockistEarningsController();
