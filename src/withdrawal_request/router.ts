import { requireSignIn } from './../utils/auth';
import { Router } from "express";
import { withdrawalRequestController } from "./controller";
import { wrapAsync } from "../utils";
import { userController } from "../user/controller";
// import { authController } from "../auth/controller";

export const WithdrawalRequestRouter = Router();

WithdrawalRequestRouter.post(
  "/withdrawalrequest",
  [requireSignIn, userController.checkIfUserHasBoughtPackage],
  wrapAsync(withdrawalRequestController.create)
);

WithdrawalRequestRouter.get(
  "/withdrawalrequest",
  [],
  wrapAsync(withdrawalRequestController.readAll)
);

WithdrawalRequestRouter.post(
  "/approve-withdrawalrequest",
  [],
  wrapAsync(withdrawalRequestController.approve)
);
