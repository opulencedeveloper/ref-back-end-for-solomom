import { MessageResponse } from "../utils/enum";
import { bonusService } from "./service";
import { Request, Response } from "express";

class BonusController {
  public async getTotalPoints(req: Request, res: Response) {
    const bonusPoints = await bonusService.getAllBonusPoints();

    return res.json({
      message: MessageResponse.Success,
      description: "Bonus points successfully retrieved",
      data: bonusPoints,
    });
  }

  public async getTotalCommissions(req: Request, res: Response) {
    const bonusCommissions = await bonusService.getAllBonusCommissions();

    return res.json({
      message: MessageResponse.Success,
      description: "Bonus commissions successfully retreived",
      data: bonusCommissions,
    });
  }
}

export const bonusController = new BonusController();
