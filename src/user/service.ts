import { AppDataSource } from "../../app";
import { MatchingLevel } from "../matching_level_reward/entity";
import { hashPassword } from "../utils/auth";
import { User } from "./entity";
import { UserRole } from "./enum";
import { IUser } from "./interface";

class UserService {
  public async saveUser(input: IUser) {
    const {
      firstname,
      lastname,
      email,
      password,
      pick_up_address,
      referredCode,
      referralCode,
      referralLevel,
      referrer,
      rootReferredCode,
    } = input;

    const newUser = new User();

    newUser.firstname = firstname;

    newUser.lastname = lastname;

    newUser.email = email;

    const hashedPassword = await hashPassword(password);

    newUser.password = `${hashedPassword}`;

    newUser.referralLevel = referralLevel;

    newUser.referralCode = referralCode;

    if (pick_up_address) {
      newUser.pick_up_address = pick_up_address;
    }

    if (referredCode) {
      newUser.referredCode = referredCode;
    }

    if (rootReferredCode) {
      newUser.rootReferredCode = rootReferredCode;
    }

    if (referrer) {
      newUser.referrer = referrer;
    }

    const user = await AppDataSource.getRepository(User).save(newUser);

    return user;
  }

  public async readUser(id: string) {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id },
    });

    return user;
  }

  public async readUsers() {
    const users = await AppDataSource.getRepository(User).find();

    return users;
  }

  public async readUserByReferralCodeByJustDirect(
    referralCode: string
  ): Promise<User | null> {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { referralCode },
      relations: ["referrals"],
    });

    return user;
  }

  public async readUserByReferredCodeByJustDirect(referralCode: string) {
    const users = await AppDataSource.getRepository(User).find({
      where: { referredCode: referralCode },
      relations: ["referrals"],
    });

    return users;
  }

  public async readUserByReferralCode(
    referralCode: string
  ): Promise<User | null> {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { referralCode },
      relations: ["referrals"],
    });

    if (!user) {
      return null;
    }

    // Recursively fetch referrals for each child
    const referralsPromises = user.referrals.map((referral) =>
      this.readUserByReferralCode(referral.referralCode)
    );

    const referrals = await Promise.all(referralsPromises);

    user.referrals = referrals.filter(
      (referral) => referral !== null
    ) as User[];

    return user;
  }

  public async findIncompleteLevelUser(
    referralCode: string
  ): Promise<User | null> {
    const user = await this.readUserByReferralCode(referralCode);

    if (!user) {
      return null;
    }

    const levels = new Map<number, number>(); // Store the number of referrals per level

    // Count the number of referrals at each level
    const countReferrals = (user: User, level: number) => {
      if (!levels.has(level)) {
        levels.set(level, 0);
      }
      levels.set(level, levels.get(level)! + user.referrals.length);

      for (const referral of user.referrals) {
        countReferrals(referral, level + 1);
      }
    };

    countReferrals(user, 1);

    // Find the incomplete level
    let incompleteLevel: number | undefined;

    for (const [level, count] of levels) {
      const expectedCount = userService.calculateExpectedCount(level);
      if (count !== expectedCount) {
        incompleteLevel = level;
        break;
      }
    }

    // Find the user at the incomplete level without complete direct members
    if (incompleteLevel !== undefined) {
      return userService.findUserWithIncompleteDirectMembers(
        user,
        incompleteLevel
      );
    }

    return null; // All levels are complete
  }

  // Helper function to calculate the expected number of members at a level
  public calculateExpectedCount(level: number): number {
    return level * 2;
  }

  // Recursive function to find the user with incomplete direct members at a level
  public findUserWithIncompleteDirectMembers(
    user: User,
    targetLevel: number
  ): User | null {
    if (
      targetLevel === 1 &&
      user.referrals.length !== userService.calculateExpectedCount(targetLevel)
    ) {
      return user;
    }

    for (const referral of user.referrals) {
      const foundUser = userService.findUserWithIncompleteDirectMembers(
        referral,
        targetLevel - 1
      );
      if (foundUser) {
        return foundUser;
      }
    }

    return null;
  }

  public async readUserByEmail(email: string) {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { email },
    });

    return user;
  }

  public async updateUser(id: string, updateData: Partial<IUser>) {
    const user = await AppDataSource.getRepository(User).update(
      { id },
      { ...updateData }
    );

    return user;
  }

  public async updateUserPassword(id: string, newPassword: string) {
    const hashedPassword = await hashPassword(newPassword);

    await AppDataSource.getRepository(User).update(
      { id },
      { password: `${hashedPassword}` }
    );
  }

  public async readUserPayments(id: string) {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id },
      relations: ["payments"],
    });

    return user;
  }

  public async readUserBonuses(id: string) {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id },
      relations: ["bonuses"],
    });

    return user;
  }

  public async readUserMatchingLevelsByUser(id: string) {
    const user = await AppDataSource.getRepository(User).findOne({
      where: { id },
      relations: ["matchingLevels"],
    });

    return user;
  }

  public async readUserMatchingLevels(id: string, currentLevel: number) {
    const userMatchingLevels = await AppDataSource.getRepository(
      MatchingLevel
    ).find({
      where: {
        receiver_user_id: id,
        received_on_level: currentLevel,
      },
    });

    return userMatchingLevels;
  }

  public async getAllStockistUser() {
    const stockistUsers = await AppDataSource.getRepository(User).find({
      where: {
        role: UserRole.Stockist,
      },
    });

    return stockistUsers;
  }

  public async getStockistUserId(stockistAddress: string) {
    const stockistUsers = await AppDataSource.getRepository(User).findOne({
      where: {
        role: UserRole.Stockist,
        stockistAddress: stockistAddress,
      },
    });

    return stockistUsers;
  }
}

export const userService = new UserService();
