import { NextFunction, Request, Response } from "express";
import { userService } from "./service";
import { v2 as cloudinary } from "cloudinary";
const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
import {
  CustomRequest,
  IUpdateUser,
  IUser,
  IUserInput,
  IEditUser,
} from "./interface";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { comparePassword } from "../utils/auth";
import { MessageResponse } from "../utils/enum";
import Crypto from "crypto";
import { packageService } from "../package/service";
import { User } from "./entity";
import { Payment } from "../payment/entity";
import { UserRole } from "./enum";
import { BonusType } from "../bonus/enum";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

class UserController {
  public async create(req: Request, res: Response) {
    const body: IUserInput = req.body;

    const userExists = await userService.readUserByEmail(body.email);

    if (userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Someone with this email already exists",
        data: null,
      });
    }

    let newReferralLevel = 0;

    let user: IUser;

    const referralCode = Crypto.randomBytes(8).toString("hex");

    if (body.referredCode) {
      const userExistsWithReferralCode =
        await userService.readUserByReferralCode(body.referredCode);

      if (userExistsWithReferralCode) {
        const person = await userService.findIncompleteLevelUser(
          body.referredCode
        );

        console.log("The person found with incomplete level is: ", person);

        if (person) {
          newReferralLevel = person.referralLevel + 1;

          user = {
            ...body,
            referralLevel: newReferralLevel,
            referralCode,
            referredCode: person.referralCode,
            referrer: person,
            rootReferredCode: body.referredCode,
          };
        } else {
          user = {
            ...body,
            referralLevel: newReferralLevel,
            referralCode,
            referredCode: userExistsWithReferralCode.referralCode,
            referrer: userExistsWithReferralCode,
            rootReferredCode: body.referredCode,
          };
        }
      } else {
        return res.json({
          message: MessageResponse.Error,
          description: "Referredcode does not exists",
          data: null,
        });
      }
    } else {
      user = {
        ...body,
        referralLevel: newReferralLevel,
        referralCode,
      };
    }

    const newUser = await userService.saveUser(user);

    const token = jwt.sign({ user_id: newUser.id }, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });

    return res.json({
      message: MessageResponse.Success,
      description: "Account successfully created",
      data: {
        token,
        user: newUser,
        package: [],
      },
    });
  }

  public async currentUser(req: CustomRequest, res: Response) {
    const { user_id } = req.auth;

    if (!user_id) {
      return res.sendStatus(400);
    }

    try {
      const user = await userService.readUserPayments(user_id);

      if (user) {
        let currentPackage = "None";
        let paymentStatus = false;

        if (user.payments.length > 0) {
          currentPackage = user.payments[user.payments.length - 1].packageName;
          paymentStatus = user.payments[user.payments.length - 1].paid;
        }
        return res.json({
          ok: true,
          package: currentPackage,
          status: paymentStatus,
        });
      }

      return res.sendStatus(400);
    } catch (error) {
      console.log(error);
      return res.sendStatus(400);
    }
  }

  public async readUsers(req: CustomRequest, res: Response) {
    const users = await userService.readUsers();

    interface modifiedUsers extends User {
      totalAmountPaidIn?: number;
      totalCommissions?: number;
      totalPoints?: number;
      totalMatchingLevel?: number;
    }

    const newUsers: modifiedUsers[] = [...users];

    if (newUsers.length > 0) {
      for (const user of newUsers) {
        const userPayments = await userService.readUserPayments(user.id);

        if (userPayments) {
          const paymentsMade = userPayments.payments.filter(
            (pay) => pay.paid === true
          );

          let totalAmountPaidIn = 0;

          paymentsMade.forEach((item) => (totalAmountPaidIn += item.price));

          user.totalAmountPaidIn = totalAmountPaidIn;
        }

        const totalCommissions = await userService.readUserBonuses(user.id);

        if (totalCommissions) {
          const commissionsMade = totalCommissions.bonuses.filter(
            (bn) => bn.type === BonusType.Commission
          );

          let totalCommissionsSum = 0;

          commissionsMade.forEach(
            (item) => (totalCommissionsSum += item.amount)
          );

          user.totalCommissions = totalCommissionsSum;
        }

        const totalPoints = await userService.readUserBonuses(user.id);

        if (totalPoints) {
          const Pointsmade = totalPoints.bonuses.filter(
            (bn) => bn.type === BonusType.Point
          );

          let totalPointsSum = 0;

          Pointsmade.forEach((item) => (totalPointsSum += item.amount));

          user.totalPoints = totalPointsSum;
        }

        const matchingLevel = await userService.readUserMatchingLevelsByUser(
          user.id
        );

        if (matchingLevel) {
          let totalMatchingLevel = 0;

          matchingLevel.matchingLevels.forEach(
            (item) => (totalMatchingLevel += item.amount)
          );

          user.totalMatchingLevel = totalMatchingLevel;
        }
      }
    }

    return res.json({
      message: MessageResponse.Success,
      description: "Users in the system",
      data: {
        users: newUsers,
      },
    });
  }

  public async readPackagesAvailableForUser(req: CustomRequest, res: Response) {
    const { user_id } = req.auth;

    const user = await userService.readUserPayments(user_id);

    if (!user) {
      return res.json({
        message: MessageResponse.Error,
        description: "User not found",
        data: null,
      });
    }

    const packages = await packageService.readPackages();

    // if (user.payments.length > 0) {
    //   const packagesNotFoundInUserPayments = packages.filter((packageItem) => {
    //     return !user.payments.find((paymentItem) => {
    //       return paymentItem.packageName === packageItem.name;
    //     });
    //   });

    //   // packages.filter((packageItem) => {
    //   //   return (
    //   //     packageItem.name !==
    //   //     user.payments[user.payments.length - 1].packageName
    //   //   );
    //   // });

    //   return res.json({
    //     message: MessageResponse.Success,
    //     description: "Packages in the system for user",
    //     data: {
    //       package: packagesNotFoundInUserPayments,
    //     },
    //   });
    // }

    return res.json({
      message: MessageResponse.Success,
      description: "Packages in the system for user",
      data: {
        package: packages,
      },
    });
  }

  public async readPackagesUserHasPaidFor(req: CustomRequest, res: Response) {
    const { user_id } = req.auth;

    const user = await userService.readUserPayments(user_id);

    if (!user) {
      return res.json({
        message: MessageResponse.Error,
        description: "User not found",
        data: null,
      });
    }

    const packages = await packageService.readPackages();

    if (user.payments.length > 0) {
      const packagesFoundInUserPayments = packages.filter((packageItem) => {
        return user.payments.find((paymentItem) => {
          return paymentItem.packageName === packageItem.name;
        });
      });

      const packagesWithPaymentStatus = packagesFoundInUserPayments.map(
        (packageItem) => {
          return {
            ...packageItem,
            status: user.payments.find((paymentItem) => {
              return paymentItem.packageName === packageItem.name;
            })?.paid,
            current:
              user.payments[user.payments.length - 1].packageName ===
              packageItem.name,
          };
        }
      );

      return res.json({
        message: MessageResponse.Success,
        description: "Packages in the system for user",
        data: {
          package: packagesWithPaymentStatus,
        },
      });
    }

    return res.json({
      message: MessageResponse.Success,
      description: "Packages in the system for user",
      data: {
        package: [],
      },
    });
  }

  public async checkIfUserHasBoughtPackage(
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) {
    const { user_id } = req.auth;

    const user = await userService.readUserPayments(user_id);

    if (!user) {
      return res.json({
        message: MessageResponse.Error,
        description: "User not found",
        data: null,
      });
    }

    const packages = await packageService.readPackages();

    if (user.payments.length > 0) {
      const packagesFoundInUserPayments = packages.filter((packageItem) => {
        return user.payments.find((paymentItem) => {
          return paymentItem.packageName === packageItem.name;
        });
      });

      const packagesWithPaymentStatus = packagesFoundInUserPayments.map(
        (packageItem) => {
          return {
            ...packageItem,
            status: user.payments.find((paymentItem) => {
              return paymentItem.packageName === packageItem.name;
            })?.paid,
            current:
              user.payments[user.payments.length - 1].packageName ===
              packageItem.name,
          };
        }
      );

      // check if there is atleast row in packagesWithPaymentStatus with status: true
      const hasPaidPackage = packagesWithPaymentStatus.some(
        (packageItem) => packageItem.status === true
      );

      if (hasPaidPackage) {
        return next();
      }

      return res.json({
        message: MessageResponse.Error,
        description: "Your payment is undergoing review",
        data: null,
      });
    }

    return res.json({
      message: MessageResponse.Error,
      description: "Buy a package to gain access to the system",
      data: null,
    });
  }

  public async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const userExists = await userService.readUserByEmail(email);

    if (!userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    const match = await comparePassword(password, userExists.password);

    if (!match) {
      return res.json({
        message: MessageResponse.Error,
        description: "Wrong password",
        data: null,
      });
    }

    const user = await userService.readUserPayments(userExists.id);

    if (!user) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    const packages = await packageService.readPackages();

    let packagesWithPaymentStatus: {
      status: boolean | undefined;
      current: boolean;
      id: string;
      name: string;
      commission: number;
      point: number;
      amount: number;
      payments: Payment[];
      createdAt: Date;
      updatedAt: Date;
    }[] = [];

    if (user.payments.length > 0) {
      const packagesFoundInUserPayments = packages.filter((packageItem) => {
        return user.payments.find((paymentItem) => {
          return paymentItem.packageName === packageItem.name;
        });
      });

      packagesWithPaymentStatus = packagesFoundInUserPayments.map(
        (packageItem) => {
          return {
            ...packageItem,
            status: user.payments.find((paymentItem) => {
              return paymentItem.packageName === packageItem.name;
            })?.paid,
            current:
              user.payments[user.payments.length - 1].packageName ===
              packageItem.name,
          };
        }
      );
    }

    const token = jwt.sign(
      { user_id: userExists.id },
      process.env.JWT_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    return res.json({
      message: MessageResponse.Success,
      description: "Logged in successfully",
      data: {
        token,
        user: userExists,
        package: packagesWithPaymentStatus,
      },
    });
  }

  public async getUserReferrals(req: CustomRequest, res: Response) {
    const { user_id } = req.auth;

    const user = await userService.readUser(user_id);

    if (user) {
      const userExistsWithReferralCode =
        await userService.readUserByReferralCode(user.referralCode);

      return res.json({
        message: MessageResponse.Success,
        description: "Get User Referrals",
        data: userExistsWithReferralCode,
      });
    }

    return res.json({
      message: MessageResponse.Error,
      description: "Invalid User",
      data: null,
    });
  }

  public async getStockistUserInfo(req: Request, res: Response) {

    const stockistUsers = await userService.getAllStockistUser();
    const stockistUserAddress = stockistUsers.map(stockistUsersObj => stockistUsersObj.stockistAddress);

    return res.json({
      message: MessageResponse.Success,
      description: "Pickup Address fetched successfully", 
      data:  stockistUserAddress
    });
  
  }

  public async edit(req: CustomRequest, res: Response) {
    const user_id = req.auth.user_id;

    const body: IEditUser = req.body;

    const userExists = await userService.readUser(user_id);
    

    if (!userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    if (body.email) {
      const anotherUserExistsWithEmail = await userService.readUserByEmail(
        body.email
      );

      if (anotherUserExistsWithEmail) {
        if (anotherUserExistsWithEmail.id != user_id) {
          return res.json({
            message: MessageResponse.Error,
            description: "Email already exists",
            data: null,
          });
        }
      }
    }

    if (req.file) {
      const tempFileName = `${uuidv4()}.jpg`;

      await fs.writeFile(tempFileName, req.file.buffer);

      const result = await cloudinary.uploader.upload(tempFileName);

      await fs.unlink(tempFileName);

      body.profilePicture = result.secure_url;
    }

    await userService.updateUser(user_id, body);
    const stockistUsers = await userService.getAllStockistUser();
    const updatedUserData = await userService.readUser(user_id);

    return res.json({
      message: MessageResponse.Success,
      description: "User updated successfully",
      data: updatedUserData,
      stockistUsers: stockistUsers
    });
  }

  // public async getStockistUsers(req: CustomRequest, res: Response) {

  //     const users = await userService.getAllStockistUser();

  //     return res.json({
  //       message: MessageResponse.Success,
  //       description: "Stokish Users",
  //       data: users,
  //     });

  // }

  public async update(req: CustomRequest, res: Response) {
    const user_id = req.auth.user_id;

    const body: IUpdateUser = req.body;

    if (Object.getOwnPropertyNames(body).length < 1) {
      return res.json({
        message: MessageResponse.Error,
        description: "Update atleast one field",
        data: null,
      });
    }

    const userExists = await userService.readUser(user_id);

    if (!userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    if (
      body.pick_up_address !== undefined &&
      userExists.role !== UserRole.Stockist
    ) {
      return res.json({
        message: MessageResponse.Error,
        description: "You are not a stockist",
        data: null,
      });
    }

    if (body.email) {
      const anotherUserExistsWithEmail = await userService.readUserByEmail(
        body.email
      );

      if (anotherUserExistsWithEmail) {
        if (anotherUserExistsWithEmail.id != user_id) {
          return res.json({
            message: MessageResponse.Error,
            description: "Email already exists",
            data: null,
          });
        }
      }
    }

    await userService.updateUser(user_id, body);

    return res.json({
      message: MessageResponse.Success,
      description: "User updated successfully",
      data: null,
    });
  }

  public async refreshToken(req: Request, res: Response) {
    const user_id = req.body.user_id;

    const userExists = await userService.readUser(user_id);

    if (!userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    // create signed token
    const token = jwt.sign(
      { user_id: userExists.id },
      process.env.JWT_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    return res.json({
      message: MessageResponse.Success,
      description: "Refresh token API",
      data: {
        token,
      },
    });
  }

  public async updatePassword(req: CustomRequest, res: Response) {
    const user_id = req.auth.user_id;

    const { oldPassword, newPassword } = req.body;

    const userExists = await userService.readUser(user_id);

    if (!userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    const match = await comparePassword(oldPassword, userExists.password);

    if (!match) {
      return res.json({
        message: MessageResponse.Error,
        description: "Wrong password",
        data: null,
      });
    }

    await userService.updateUserPassword(user_id, newPassword);

    return res.json({
      message: MessageResponse.Success,
      description: "Password has been updated successfully",
      data: null,
    });
  }

  public async getUserProfile(req: CustomRequest, res: Response) {
    const user_id = req.auth.user_id;

    const userExists = await userService.readUser(user_id);

    if (!userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    const stockistUsers = await userService.getAllStockistUser(); 

    return res.json({
      message: MessageResponse.Success,
      description: "Account retrieved successfully",
      data: userExists,
      stockistUsers: stockistUsers,
    });
  }

  public async getUserBonuses(req: CustomRequest, res: Response) {
    const user_id = req.auth.user_id;

    const userExists = await userService.readUser(user_id);

    if (!userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    const userBonuses = await userService.readUserBonuses(userExists.id);

    return res.json({
      message: MessageResponse.Success,
      description: "User Bonuses retrieved successfully",
      data: userBonuses ? userBonuses.bonuses : [],
    });
  }

  public async getUserMatchingLevels(req: CustomRequest, res: Response) {
    const user_id = req.auth.user_id;

    const userExists = await userService.readUser(user_id);

    if (!userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    const userBonuses = await userService.readUserMatchingLevelsByUser(
      userExists.id
    );

    return res.json({
      message: MessageResponse.Success,
      description: "User Matching levels retrieved successfully",
      data: userBonuses ? userBonuses.matchingLevels : [],
    });
  }

  public async getUserPoints(req: CustomRequest, res: Response) {
    const user_id = req.auth.user_id;

    const userExists = await userService.readUser(user_id);

    if (!userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    const userBonuses = await userService.readUserBonuses(userExists.id);

    return res.json({
      message: MessageResponse.Success,
      description: "User Bonuses retrieved successfully",
      data: userBonuses ? userBonuses.bonuses : [],
    });
  }

  public async getUserNetwork(req: CustomRequest, res: Response) {
    const userId = req.params.userId; // You should provide the user's ID as a parameter

    try {
      const userExists = await userService.readUserPayments(userId);

      if (!userExists) {
        return res.json({
          message: MessageResponse.Error,
          description: "User not found",
          data: null,
        });
      }

      console.log(userExists);

      const user = await userService.readUserByReferralCode(
        userExists.referralCode
      );

      if (!user) {
        return res.json({
          message: MessageResponse.Error,
          description: "Account does not exist",
          data: null,
        });
      }

      // Create a function to convert the user tree into the desired format
      const convertUserTreeToFormat = (user: User, level: number): any => {
        const userData = {
          key: user.id,
          label: `level ${level}: ${" "}${user.firstname} ${" "}${user.lastname} ${" "}${user.email} ${" "}${user.referralCode}`,
          nodes: [] as any[],
        };

        if (level < 12) {
          // Increase the level limit to 12
          for (const referral of user.referrals) {
            userData.nodes.push(convertUserTreeToFormat(referral, level + 1));
          }
        }

        return userData;
      };

      // Convert the user tree into the desired format
      const formattedUserTree = convertUserTreeToFormat(user, 1);

      return res.json({
        message: MessageResponse.Success,
        description: "User tree gotten successfully",
        data: formattedUserTree,
      });
    } catch (error) {
      console.error("Error retrieving user network:", error);
      return res.json({
        message: MessageResponse.Error,
        description: "Something went wrong, please try again.",
        data: null,
      });
    }
  }
}

export const userController = new UserController();
