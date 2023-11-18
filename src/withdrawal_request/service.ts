import { AppDataSource } from "../../app";
import { Bonus } from "../bonus/entity";
import { MatchingLevel } from "../matching_level_reward/entity";
import { userService } from "../user/service";
import { WithdrawalRequest } from "./entity";
import { IWithdrawalRequest, IWithdrawalRequestBasic } from "./interface";

class WithdrawalRequestService {
  public async save(input: IWithdrawalRequestBasic) {
    const newWithdrawalRequest = new WithdrawalRequest();

    newWithdrawalRequest.user_id = input.user_id;

    newWithdrawalRequest.fullName = input.fullName;

    let totalAmount = 0;

    const userBonuses = await userService.readUserBonuses(input.user_id);

    if (userBonuses) {
      if (userBonuses.bonuses.length > 0) {
        for (const bns of userBonuses.bonuses) {
          await AppDataSource.getRepository(Bonus).update(
            { id: bns.id },
            { selectedForWithdrawal: true }
          );
        }
      }
    }

    const userMatchingLevels = await userService.readUserMatchingLevelsByUser(
      input.user_id
    );

    if (userMatchingLevels) {
      if (userMatchingLevels.matchingLevels.length > 0) {
        for (const mchnlvl of userMatchingLevels.matchingLevels) {
          await AppDataSource.getRepository(MatchingLevel).update(
            { id: mchnlvl.id },
            { selectedForWithdrawal: true }
          );
          totalAmount += mchnlvl.amount;
        }
      }
    }

    newWithdrawalRequest.amount = input.amount + totalAmount;

    const savedWithdrawalRequest = await AppDataSource.getRepository(
      WithdrawalRequest
    ).save(newWithdrawalRequest);

    return savedWithdrawalRequest;
  }

  public async read(id: string) {
    const savedWithdrawalRequest = await AppDataSource.getRepository(
      WithdrawalRequest
    ).findOne({
      where: {
        id: id,
      },
    });

    return savedWithdrawalRequest;
  }

  public async readUserUnconfirmedPayment(user_id: string) {
    const savedWithdrawalRequest = await AppDataSource.getRepository(
      WithdrawalRequest
    ).findOne({
      where: {
        user_id,
        approved: false,
      },
    });

    return savedWithdrawalRequest;
  }

  public async readAll() {
    const withdrawalRequests = await AppDataSource.getRepository(
      WithdrawalRequest
    ).find();

    return withdrawalRequests;
  }

  public async update(id: string, updateData: Partial<IWithdrawalRequest>) {
    const withdrawalRequest = await AppDataSource.getRepository(
      WithdrawalRequest
    ).update({ id }, { ...updateData });

    const savedWithdrawalRequest = await AppDataSource.getRepository(
      WithdrawalRequest
    ).findOne({
      where: {
        id: id,
      },
    });

    if (savedWithdrawalRequest) {
      const userBonuses = await userService.readUserBonuses(
        savedWithdrawalRequest?.user_id
      );

      if (userBonuses) {
        if (userBonuses.bonuses.length > 0) {
          for (const bns of userBonuses.bonuses) {
            await AppDataSource.getRepository(Bonus).delete({
              id: bns.id,
              selectedForWithdrawal: true,
            });
          }
        }
      }

      const userMatchingLevels = await userService.readUserMatchingLevelsByUser(
        savedWithdrawalRequest?.user_id
      );

      if (userMatchingLevels) {
        if (userMatchingLevels.matchingLevels.length > 0) {
          for (const mchnlvl of userMatchingLevels.matchingLevels) {
            await AppDataSource.getRepository(MatchingLevel).delete({
              id: mchnlvl.id,
              selectedForWithdrawal: true,
            });
          }
        }
      }
    }

    return withdrawalRequest;
  }
}

export const withdrawalRequestService = new WithdrawalRequestService();
