import { Router } from "express";
import multer from "multer";

import { userController } from "./controller";
import { wrapAsync } from "../utils";
import { userValidator } from "./validator";
import { requireSignIn } from "../utils/auth";
// import { authController } from "../auth/controller";


export const UserRouter = Router();

const storage = multer.memoryStorage();

const upload = multer({ storage: storage }).single("image");

UserRouter.get(
  "/user",
  //   [userValidator.create, authController.ensureUserEmailIsVerified],
  [],
  wrapAsync(userController.readUsers)
);

UserRouter.post(
  "/user",
  //   [userValidator.create, authController.ensureUserEmailIsVerified],
  [userValidator.create],
  wrapAsync(userController.create)
);

UserRouter.post(
  "/login/",
  [userValidator.login],
  wrapAsync(userController.login)
);

UserRouter.get(
  "/current-user",
  [requireSignIn],
  wrapAsync(userController.currentUser)
);

UserRouter.get(
  "/packages-for-user",
  [requireSignIn],
  wrapAsync(userController.readPackagesAvailableForUser)
);

UserRouter.get(
  "/packages-user-has-purchased",
  [requireSignIn, userController.checkIfUserHasBoughtPackage],
  wrapAsync(userController.readPackagesUserHasPaidFor)
);

UserRouter.get(
  "/user-referrals",
  [requireSignIn, userController.checkIfUserHasBoughtPackage],
  wrapAsync(userController.getUserReferrals)
); 

UserRouter.patch(
  "/user/",
  [userValidator.update, requireSignIn, userController.checkIfUserHasBoughtPackage],
  wrapAsync(userController.update)
);

UserRouter.post(
  "/edit",
  [userValidator.edit, requireSignIn,userController.checkIfUserHasBoughtPackage, upload],
  wrapAsync(userController.edit)
);

UserRouter.post(
  "/refresh-token/",
  [userValidator.refreshToken],
  wrapAsync(userController.refreshToken)
);

UserRouter.patch(
  "/user-password/",
  [userValidator.updatePassword, requireSignIn, userController.checkIfUserHasBoughtPackage],
  wrapAsync(userController.updatePassword)
);

UserRouter.get(
  "/user-profile/",
  [requireSignIn, userController.checkIfUserHasBoughtPackage],
  wrapAsync(userController.getUserProfile)
);

UserRouter.get(
  "/user-bonuses/",
  [requireSignIn, userController.checkIfUserHasBoughtPackage],
  wrapAsync(userController.getUserBonuses)
);

UserRouter.get(
  "/user-matchinglevels/",
  [requireSignIn, userController.checkIfUserHasBoughtPackage],
  wrapAsync(userController.getUserMatchingLevels)
);

UserRouter.get(
  "/getUserNetwork/:userId",
  [],
  wrapAsync(userController.getUserNetwork)
);

UserRouter.get(
  "/stokish-user-info",
  [],
  wrapAsync(userController.getStockistUserInfo)
);