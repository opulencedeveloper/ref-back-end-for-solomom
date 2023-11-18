import { Response, Request } from "express";
import { userService } from "../user/service";

import { IWithdrawalRequestBasic } from "./interface";
import { MessageResponse } from "../utils/enum";
import { withdrawalRequestService } from "./service";

class WithdrawalRequestController {
  public async create(req: Request, res: Response) {
    const body: IWithdrawalRequestBasic = req.body;

    if (body.amount < 11000) {
      return res.json({
        message: MessageResponse.Error,
        description: "Withdrawal amount must be up to 11000",
        data: null,
      });
    }

    const user = await userService.readUserByEmail(body.email);

    if (!user) {
      return res.json({
        message: MessageResponse.Error,
        description: "User not found",
        data: null,
      });
    }

    if(user.accountNumber.length === 0){
      return res.json({
        message: MessageResponse.Error,
        description: "Update your account number to proceed with withdrawal",
        data: null,
      });
    }

    const userHasUnApprovedPayment =
      await withdrawalRequestService.readUserUnconfirmedPayment(user.id);

    if (userHasUnApprovedPayment) {
      return res.json({
        message: MessageResponse.Error,
        description: "Your previous withdrawal has not been approved yet",
        data: null,
      });
    }

    await withdrawalRequestService.save({...body, user_id: user.id});

    return res.json({
      message: MessageResponse.Success,
      description: "Withdraw request sent, we will contact you shortly.",
      data: null,
    });
  }

  public async readAll(req: Request, res: Response) {
    const allWithdrawalRequests = await withdrawalRequestService.readAll();

    return res.json({
      message: MessageResponse.Success,
      description: "All withdrawal requests",
      data: allWithdrawalRequests,
    });
  }

  public async approve(req: Request, res: Response) {
    const body = req.body;

    const checkIfExists = await withdrawalRequestService.read(body.id);

    if (!checkIfExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Withdrawal not found",
        data: null,
      });
    }

    if (checkIfExists.approved) {
      return res.json({
        message: MessageResponse.Error,
        description: "Withdrawal already approved",
        data: null,
      });
    }

    await withdrawalRequestService.update(body.id, { approved: true });

    return res.json({
      message: MessageResponse.Success,
      description: "Withdrawal approved successfully",
      data: null,
    });
  }
}

export const withdrawalRequestController = new WithdrawalRequestController();
