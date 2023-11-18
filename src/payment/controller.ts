// import { Response } from "express";
import { Response } from "express";
import { CustomRequest, IPaymentController } from "./interface";

import { v2 as cloudinary } from "cloudinary";
import { paymentService } from "./service";
import { MessageResponse } from "../utils/enum";
import { userService } from "../user/service";
import { packageService } from "../package/service";
import { bonusService } from "../bonus/service";
import { IBonus } from "../bonus/interface";
import { BonusType } from "../bonus/enum";
import { Payment } from "./entity";
import { IPickup } from "../pickups/interface";
import { pickupService } from "../pickups/service";
import { adminService } from "../admin/service";
import { matchingLevelService } from "../matching_level_reward/service";
import { User } from "../user/entity";
const fs = require("fs").promises;
const { v4: uuidv4 } = require("uuid");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

class PaymentController {
  public async createPayment(req: CustomRequest, res: Response) {
    const body: IPaymentController = req.body;

    const { user_id } = req.auth;

    const user = await userService.readUser(user_id);

    if (!user) {
      return res.json({
        message: MessageResponse.Error,
        description: "User not found",
        data: null,
      });
    }

    const packageInSystem = await packageService.readPackageByName(
      body.packageName
    );

    if (!packageInSystem) {
      return res.json({
        message: MessageResponse.Error,
        description: "Package not found",
        data: null,
      });
    }

    const userHasAnActivePayment = await userService.readUserPayments(user_id);

    if (userHasAnActivePayment) {
      if (userHasAnActivePayment.payments.length > 0) {
        if (
          userHasAnActivePayment.payments[
            userHasAnActivePayment.payments.length - 1
          ].packageName === packageInSystem.name
        ) {
          if (
            userHasAnActivePayment.payments[
              userHasAnActivePayment.payments.length - 1
            ].paid === false
          ) {
            return res.json({
              message: MessageResponse.Error,
              description: "This payment is still pending approval",
              data: null,
            });
          }
        } else if (
          userHasAnActivePayment.payments[
            userHasAnActivePayment.payments.length - 1
          ].paid === false
        ) {
          return res.json({
            message: MessageResponse.Error,
            description: "Your previous payment has not been approved yet",
            data: null,
          });
        }
      }
    }

    // Create a unique file name
    const tempFileName = `${uuidv4()}.jpg`;

    // Write the buffer to a temporary file
    await fs.writeFile(tempFileName, req.file.buffer);

    const result = await cloudinary.uploader.upload(tempFileName);

    // Don't forget to delete the temporary file when you're done
    await fs.unlink(tempFileName);

    const makePayment = await paymentService.create({
      ...body,
      user: user,
      packagePayment: packageInSystem,
      price: packageInSystem.amount,
      receiptImageUrl: result.secure_url,
    });

    return res.json({
      message: MessageResponse.Success,
      description: "Payment successfully uploaded",
      data: makePayment,
    });
  }

  public async confirmPayment(req: CustomRequest, res: Response) {
    const { id } = req.params;

    const paymentExists = await paymentService.readPaymentById(id);

    if (!paymentExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Payment not found",
        data: null,
      });
    }

    if (paymentExists.paid) {
      return res.json({
        message: MessageResponse.Error,
        description: "Payment already confirmed",
        data: null,
      });
    }

    const confirmPayment = await paymentService.confirmPayment(id);

    await paymentController.giveReferralBonus(paymentExists);

    await paymentController.giveDirectUserBonus(paymentExists);

    const stockistAddress = paymentExists.user.pick_up_address;

    const userId = paymentExists.user.id;

    const stockistUser = await userService.getStockistUserId(stockistAddress);

    if (stockistUser) {
      let pickups: IPickup;

      pickups = {
        stockist_id: stockistUser.id,
        user_id: userId,
        package_name: paymentExists.packageName,
      };

      await pickupService.savePickup(pickups);
    }

    // give user referral matching level bonus
    if (paymentExists.user.referredCode) {
      let person = await userService.readUserByReferralCodeByJustDirect(
        paymentExists.user.referredCode
      );

      let currentLevel = 1;

      const matchingLevelBonuses =
        await adminService.readMatchingLevelBonusAmounts();

      while (person) {
        console.log("person ", person);
        console.log("currentLevel ", currentLevel);

        if (currentLevel > 12) {
          break;
        }

        if (currentLevel === 1) {
          if (person.referrals.length > 0) {
            const userMatchungLevels = await userService.readUserMatchingLevels(
              person.id,
              currentLevel
            );

            if (userMatchungLevels.length === 0) {
              if (person.referrals.length % 2 === 0) {
                // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                const matchingLevelBonusForCurrentLevel =
                  matchingLevelBonuses.length > 0
                    ? matchingLevelBonuses.find(
                        (item) => item.level === currentLevel
                      )
                    : undefined;

                const bonus = matchingLevelBonusForCurrentLevel
                  ? matchingLevelBonusForCurrentLevel.amount
                  : 0;

                await matchingLevelService.create({
                  amount: bonus,
                  source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                  received_on_level: currentLevel,
                  receiver_user_id: person.id,
                  user: person,
                });
              }
            }
          }
        } else if (currentLevel === 2) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            for (const innerUser of dynamicArrayOfReferrals) {
              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }
            }

            if (userLastRowOfReferrals.length > 0) {
              const referredCodesArray = userLastRowOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 2) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 2
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        } else if (currentLevel === 3) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            let count = 1;

            for (const [
              index,
              innerUser,
            ] of dynamicArrayOfReferrals.entries()) {
              if (count === 3) {
                break;
              }

              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }

              // Check if this is the last item in the loop
              const isLastItem = index === dynamicArrayOfReferrals.length - 1;

              // Append the values of userLastRowOfReferrals when it's the last item
              if (isLastItem) {
                dynamicArrayOfReferrals = [];

                dynamicArrayOfReferrals.push(...userLastRowOfReferrals);

                // Clear userLastRowOfReferrals for the next iteration
                userLastRowOfReferrals.length = 0;

                count++;
              }
            }

            if (dynamicArrayOfReferrals.length > 0) {
              const referredCodesArray = dynamicArrayOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 4) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 4
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        } else if (currentLevel === 4) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            let count = 1;

            for (const [
              index,
              innerUser,
            ] of dynamicArrayOfReferrals.entries()) {
              if (count === 4) {
                break;
              }

              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }

              // Check if this is the last item in the loop
              const isLastItem = index === dynamicArrayOfReferrals.length - 1;

              // Append the values of userLastRowOfReferrals when it's the last item
              if (isLastItem) {
                dynamicArrayOfReferrals = [];

                dynamicArrayOfReferrals.push(...userLastRowOfReferrals);

                // Clear userLastRowOfReferrals for the next iteration
                userLastRowOfReferrals.length = 0;

                count++;
              }
            }

            if (dynamicArrayOfReferrals.length > 0) {
              const referredCodesArray = dynamicArrayOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 8) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 8
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        } else if (currentLevel === 5) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            let count = 1;

            for (const [
              index,
              innerUser,
            ] of dynamicArrayOfReferrals.entries()) {
              if (count === 5) {
                break;
              }

              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }

              // Check if this is the last item in the loop
              const isLastItem = index === dynamicArrayOfReferrals.length - 1;

              // Append the values of userLastRowOfReferrals when it's the last item
              if (isLastItem) {
                dynamicArrayOfReferrals = [];

                dynamicArrayOfReferrals.push(...userLastRowOfReferrals);

                // Clear userLastRowOfReferrals for the next iteration
                userLastRowOfReferrals.length = 0;

                count++;
              }
            }

            if (dynamicArrayOfReferrals.length > 0) {
              const referredCodesArray = dynamicArrayOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 16) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 16
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        } else if (currentLevel === 6) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            let count = 1;

            for (const [
              index,
              innerUser,
            ] of dynamicArrayOfReferrals.entries()) {
              if (count === 6) {
                break;
              }

              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }

              // Check if this is the last item in the loop
              const isLastItem = index === dynamicArrayOfReferrals.length - 1;

              // Append the values of userLastRowOfReferrals when it's the last item
              if (isLastItem) {
                dynamicArrayOfReferrals = [];

                dynamicArrayOfReferrals.push(...userLastRowOfReferrals);

                // Clear userLastRowOfReferrals for the next iteration
                userLastRowOfReferrals.length = 0;

                count++;
              }
            }

            if (dynamicArrayOfReferrals.length > 0) {
              const referredCodesArray = dynamicArrayOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 32) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 32
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        } else if (currentLevel === 7) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            let count = 1;

            for (const [
              index,
              innerUser,
            ] of dynamicArrayOfReferrals.entries()) {
              if (count === 7) {
                break;
              }

              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }

              // Check if this is the last item in the loop
              const isLastItem = index === dynamicArrayOfReferrals.length - 1;

              // Append the values of userLastRowOfReferrals when it's the last item
              if (isLastItem) {
                dynamicArrayOfReferrals = [];

                dynamicArrayOfReferrals.push(...userLastRowOfReferrals);

                // Clear userLastRowOfReferrals for the next iteration
                userLastRowOfReferrals.length = 0;

                count++;
              }
            }

            if (dynamicArrayOfReferrals.length > 0) {
              const referredCodesArray = dynamicArrayOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 64) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 64
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        } else if (currentLevel === 8) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            let count = 1;

            for (const [
              index,
              innerUser,
            ] of dynamicArrayOfReferrals.entries()) {
              if (count === 8) {
                break;
              }

              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }

              // Check if this is the last item in the loop
              const isLastItem = index === dynamicArrayOfReferrals.length - 1;

              // Append the values of userLastRowOfReferrals when it's the last item
              if (isLastItem) {
                dynamicArrayOfReferrals = [];

                dynamicArrayOfReferrals.push(...userLastRowOfReferrals);

                // Clear userLastRowOfReferrals for the next iteration
                userLastRowOfReferrals.length = 0;

                count++;
              }
            }

            if (dynamicArrayOfReferrals.length > 0) {
              const referredCodesArray = dynamicArrayOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 128) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 128
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        } else if (currentLevel === 9) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            let count = 1;

            for (const [
              index,
              innerUser,
            ] of dynamicArrayOfReferrals.entries()) {
              if (count === 9) {
                break;
              }

              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }

              // Check if this is the last item in the loop
              const isLastItem = index === dynamicArrayOfReferrals.length - 1;

              // Append the values of userLastRowOfReferrals when it's the last item
              if (isLastItem) {
                dynamicArrayOfReferrals = [];

                dynamicArrayOfReferrals.push(...userLastRowOfReferrals);

                // Clear userLastRowOfReferrals for the next iteration
                userLastRowOfReferrals.length = 0;

                count++;
              }
            }

            if (dynamicArrayOfReferrals.length > 0) {
              const referredCodesArray = dynamicArrayOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 256) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 256
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        } else if (currentLevel === 10) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            let count = 1;

            for (const [
              index,
              innerUser,
            ] of dynamicArrayOfReferrals.entries()) {
              if (count === 10) {
                break;
              }

              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }

              // Check if this is the last item in the loop
              const isLastItem = index === dynamicArrayOfReferrals.length - 1;

              // Append the values of userLastRowOfReferrals when it's the last item
              if (isLastItem) {
                dynamicArrayOfReferrals = [];

                dynamicArrayOfReferrals.push(...userLastRowOfReferrals);

                // Clear userLastRowOfReferrals for the next iteration
                userLastRowOfReferrals.length = 0;

                count++;
              }
            }

            if (dynamicArrayOfReferrals.length > 0) {
              const referredCodesArray = dynamicArrayOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 512) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 512
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        } else if (currentLevel === 11) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            let count = 1;

            for (const [
              index,
              innerUser,
            ] of dynamicArrayOfReferrals.entries()) {
              if (count === 11) {
                break;
              }

              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }

              // Check if this is the last item in the loop
              const isLastItem = index === dynamicArrayOfReferrals.length - 1;

              // Append the values of userLastRowOfReferrals when it's the last item
              if (isLastItem) {
                dynamicArrayOfReferrals = [];

                dynamicArrayOfReferrals.push(...userLastRowOfReferrals);

                // Clear userLastRowOfReferrals for the next iteration
                userLastRowOfReferrals.length = 0;

                count++;
              }
            }

            if (dynamicArrayOfReferrals.length > 0) {
              const referredCodesArray = dynamicArrayOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 1024) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 1024
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        } else if (currentLevel === 12) {
          if (person.referrals.length > 0) {
            const userLastRowOfReferrals: User[] = [];

            let dynamicArrayOfReferrals: User[] = [...person.referrals];

            let count = 1;

            for (const [
              index,
              innerUser,
            ] of dynamicArrayOfReferrals.entries()) {
              if (count === 12) {
                break;
              }

              const innerDirectReferrals =
                await userService.readUserByReferredCodeByJustDirect(
                  innerUser.referralCode
                );
              if (innerDirectReferrals.length > 0) {
                userLastRowOfReferrals.push(...innerDirectReferrals);
              }

              // Check if this is the last item in the loop
              const isLastItem = index === dynamicArrayOfReferrals.length - 1;

              // Append the values of userLastRowOfReferrals when it's the last item
              if (isLastItem) {
                dynamicArrayOfReferrals = [];

                dynamicArrayOfReferrals.push(...userLastRowOfReferrals);

                // Clear userLastRowOfReferrals for the next iteration
                userLastRowOfReferrals.length = 0;

                count++;
              }
            }

            if (dynamicArrayOfReferrals.length > 0) {
              const referredCodesArray = dynamicArrayOfReferrals.map(
                (item) => item.referredCode
              );

              const referredCodesSet = new Set(referredCodesArray);

              // Get the number of unique referredCodes in the Set
              const numberOfReferredCodes = referredCodesSet.size;

              if (numberOfReferredCodes % 2 === 0) {
                const userMatchungLevels =
                  await userService.readUserMatchingLevels(
                    person.id,
                    currentLevel
                  );

                if (userMatchungLevels.length !== 2048) {
                  // in this line calculate the bonus of the level divided by the number of people for this level. It comes from what the Admin has set in the database.
                  const matchingLevelBonusForCurrentLevel =
                    matchingLevelBonuses.length > 0
                      ? matchingLevelBonuses.find(
                          (item) => item.level === currentLevel
                        )
                      : undefined;

                  const bonus = matchingLevelBonusForCurrentLevel
                    ? matchingLevelBonusForCurrentLevel.amount / 2048
                    : 0;

                  await matchingLevelService.create({
                    amount: bonus,
                    source_user_fullname: paymentExists.user.firstname + " " + paymentExists.user.lastname,
                    received_on_level: currentLevel,
                    receiver_user_id: person.id,
                    user: person,
                  });
                }
              }
            }
          }
        }

        if (person.referredCode === null) {
          break;
        }

        currentLevel++;

        person = await userService.readUserByReferralCodeByJustDirect(
          person.referredCode
        );
      }
    }

    return res.json({
      message: MessageResponse.Success,
      description: "Payment successfully confirmed",
      data: confirmPayment,
    });
  }

  public async giveReferralBonus(paymentExists: Payment) {
    const userWhoosePaymentIsConfirmedDirectReferral =
      paymentExists.user.rootReferredCode;

    if (userWhoosePaymentIsConfirmedDirectReferral) {
      const referral = await userService.readUserByReferralCode(
        userWhoosePaymentIsConfirmedDirectReferral
      );

      if (referral) {
        const bonusInput: IBonus = {
          type: BonusType.Commission,
          amount: paymentExists.packagePayment.commission,
          packageName: paymentExists.packagePayment.name,
          user: referral,
        };

        await bonusService.saveBonus(bonusInput);

        const bonusInputTwo: IBonus = {
          type: BonusType.Point,
          amount: paymentExists.packagePayment.point,
          packageName: paymentExists.packagePayment.name,
          user: referral,
        };

        await bonusService.saveBonus(bonusInputTwo);

        // Apply bonus points recursively to referrers
        await paymentController.applyBonusPoints(
          referral.rootReferredCode,
          paymentExists
        );
      }
    }
  }

  // Define a recursive function to apply bonus points
  public async applyBonusPoints(referralCode: string, payment: Payment) {
    const referralUser = await userService.readUserByReferralCode(referralCode);

    if (referralUser) {
      const bonusInput: IBonus = {
        type: BonusType.Point,
        amount: payment.packagePayment.point,
        packageName: payment.packagePayment.name,
        user: referralUser,
      };

      await bonusService.saveBonus(bonusInput);

      if (referralUser.rootReferredCode) {
        // Recursively call the function for the next referral
        await paymentController.applyBonusPoints(
          referralUser.rootReferredCode,
          payment
        );
      }
    }
  }

  public async giveDirectUserBonus(paymentExists: Payment) {
    const userWhoosePaymentIsConfirmed = paymentExists.user.referralCode;

    if (userWhoosePaymentIsConfirmed) {
      const user = await userService.readUserByReferralCode(
        userWhoosePaymentIsConfirmed
      );

      if (user) {
        const bonusInputTwo: IBonus = {
          type: BonusType.Point,
          amount: paymentExists.packagePayment.point,
          packageName: paymentExists.packagePayment.name,
          user: user,
        };

        await bonusService.saveBonus(bonusInputTwo);
      }
    }
  }

  public async getAllPayments(req: Request, res: Response) {
    const payments = await paymentService.findAll();

    return res.json({
      message: MessageResponse.Success,
      description: "Payments successfully retrieved",
      data: {
        payments,
      },
    });
  }

  public async getAllCompletedPayments(req: Request, res: Response) {
    const payments = await paymentService.findAllCompleted();

    return res.json({
      message: MessageResponse.Success,
      description: "Completed payments successfully retrieved",
      data: {
        payments,
      },
    });
  }

  public async getAllPendingPayments(req: Request, res: Response) {
    const payments = await paymentService.findAllPending();

    return res.json({
      message: MessageResponse.Success,
      description: "Pending payments successfully retrieved",
      data: {
        payments,
      },
    });
  }
}

export const paymentController = new PaymentController();
