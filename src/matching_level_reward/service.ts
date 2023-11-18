import { AppDataSource } from "../../app";
import { User } from "../user/entity";
import { MatchingLevel } from "./entity";
import { IMatchingLevel } from "./interface";

class MatchingLevelService {
  public async create(input: IMatchingLevel) {
    const matchingLevel = new MatchingLevel();

    matchingLevel.amount = input.amount;

    matchingLevel.source_user_fullname = input.source_user_fullname;

    matchingLevel.received_on_level = input.received_on_level;

    matchingLevel.receiver_user_id = input.receiver_user_id;

    matchingLevel.user = input.user;

    const newMatchingLevel = await AppDataSource.getRepository(
      MatchingLevel
    ).save(matchingLevel);

    return newMatchingLevel;
  }

  public async findUserMatchingLevel(user: User) {
    
  }
}

export const matchingLevelService = new MatchingLevelService();
