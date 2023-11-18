import { Router } from "express";
import { wrapAsync } from "../utils";
import { requireSignIn } from "../utils/auth";
import { adminValidator } from "./validator";
import { adminController } from "./controller";
// import { authController } from "../auth/controller";

export const AdminRouter = Router();

AdminRouter.post(
  "/admin",
  //   [userValidator.create, authController.ensureUserEmailIsVerified],
  [adminValidator.create],
  wrapAsync(adminController.create)
);

AdminRouter.get(
  "/admin",
  //   [userValidator.create, authController.ensureUserEmailIsVerified],
  [],
  wrapAsync(adminController.getAdmins)
);

AdminRouter.get(
  "/admin/current-user",
  [requireSignIn],
  wrapAsync(adminController.currentUser)
);

AdminRouter.post(
  "/admin/login",
  [adminValidator.login],
  wrapAsync(adminController.login)
);

AdminRouter.post(
  "/makeUserStockist",
  [adminValidator.makeUserStockist],
  wrapAsync(adminController.makeUserStockist)
);

AdminRouter.post(
  "/createMatchingLevelBonus",
  [adminValidator.createMatchingLevelBonus],
  wrapAsync(adminController.createMatchingLevelBonus)
);

AdminRouter.get(
  "/getAllMatchingLevelBonus",
  [],
  wrapAsync(adminController.getAllMatchingLevelBonus)
);
AdminRouter.put(
  "/matchingLevelBonus",
  [],
  wrapAsync(adminController.updateMatchingLevelBonusByLevel)
);
AdminRouter.put(
  "/channgePassword",
  [],
  wrapAsync(adminController.channgePassword)
);

