import { Response, Request } from "express";

import { CustomRequest } from "./interface";
import { MessageResponse } from "../utils/enum";
import { pickupService } from "./service";
import { IBonus } from "../bonus/interface";
import { BonusType } from "../bonus/enum";
import { IStockistEarnings } from "../stockist_earnings/interface";

class Pickup {
  public async getPickups(req: CustomRequest, res: Response) {
    const userId = req.auth.user_id;

    const userPickups = await pickupService.getUserPickupsByUserId(userId);
    const stockistPickups = await pickupService.getUserPickupsByStockistId(
      userId
    );

    return res.json({
      message: MessageResponse.Success,
      description: "Pickups retrieved successfully",
      data: [...userPickups, ...stockistPickups],
    });
  }

  // public async userConfirmDelivery(req: CustomRequest, res: Response) {
  //   const { id } = req.params;

  //   const { stockistId, packageName } = req.body;

  //   const deliveryExists = await pickupService.readDeliveryById(id);

  //   if (!deliveryExists) {
  //     return res.json({
  //       message: MessageResponse.Error,
  //       description: "Pickup not found",
  //       data: null,
  //     });
  //   }

  //   if (deliveryExists.received_by_user) {
  //     return res.json({
  //       message: MessageResponse.Error,
  //       description: "Delivery already confirmed",
  //       data: null,
  //     });
  //   }

  //   await pickupService.userDeliveryConfirmation(id);

  //   const deliveryConfirmation = await pickupService.readDeliveryById(id);

  //   if (
  //     deliveryConfirmation!.received_by_user &&
  //     deliveryConfirmation!.delivered_by_stockist
  //   ) {
  //     const stockist = await pickupService.findStockistUserId(stockistId);

  //     if (!stockist) {
  //       return res.json({
  //         message: MessageResponse.Error,
  //         description: "Stockist not found",
  //         data: null,
  //       });
  //     }

  //     const packageInfo = await pickupService.findPackageByName(packageName);

  //     const commissionInput: IBonus = {
  //       type: BonusType.Commission,
  //       amount: (60 / 100) * packageInfo!.stockistAmount,
  //       packageName: packageInfo!.name,
  //       user: stockist,
  //     };
  //     await pickupService.saveCommision(commissionInput);
  //   }

  //   return res.json({
  //     message: MessageResponse.Success,
  //     description: "Delivery successfully confirmed",
  //     data: null,
  //   });
  // }

  private async confirmPickup(
    req: Request,
    res: Response,
    isStokishUser: Boolean
  ) {
    const { id } = req.params;
    const { stockistId, packageName } = req.body;

    const deliveryExists = await pickupService.readPickupById(id);

    if (!deliveryExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Pickup not found",
        data: null,
      });
    }
    const isDelivered = isStokishUser
      ? deliveryExists.delivered_by_stockist
      : deliveryExists.received_by_user;

    if (isDelivered) {
      return res.json({
        message: MessageResponse.Error,
        description: "Pick up already confirmed",
        data: null,
      });
    }

    isStokishUser
      ? await pickupService.stockistPickupConfirmation(id)
      : await pickupService.userPickupConfirmation(id);

    const pickupConfirmation = await pickupService.readPickupById(id);

    if (
      pickupConfirmation!.received_by_user &&
      pickupConfirmation!.delivered_by_stockist
    ) {
      const stockist = await pickupService.findStockistUserId(stockistId);

      if (!stockist) {
        return res.json({
          message: MessageResponse.Error,
          description: "Stockist not found",
          data: null,
        });
      }

      const packageInfo = await pickupService.findPackageByName(packageName);

      const stockistCommission = (6 / 100) * packageInfo!.stockistAmount;

      const commissionInput: IBonus = {
        type: BonusType.Commission,
        amount: stockistCommission,
        packageName,
        user: stockist,
      };
      await pickupService.saveCommision(commissionInput);

      const stockistInput: IStockistEarnings = {
        stockist_id: stockistId,
        package_name: packageName,
        commission: stockistCommission,
      };

      await pickupService.saveStockistEarinigs(stockistInput);
    }

    return res.json({
      message: MessageResponse.Success,
      description: "Pickup confirmed successfully",
      data: null,
    });
  }

  public userConfirmPickup = async (req: Request, res: Response) => {
    await this.confirmPickup(req, res, false);
  };

  public stockistConfirmPickup = async (req: Request, res: Response) => {
    await this.confirmPickup(req, res, true);
  };
}

export const pickupController = new Pickup();
