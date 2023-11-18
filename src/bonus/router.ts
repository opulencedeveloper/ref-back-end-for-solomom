import { Router } from "express";
import { wrapAsync } from "../utils";
import { requireSignIn } from "../utils/auth";
import { bonusController } from "./controller";

export const BonusRouter = Router();

BonusRouter.get(
  "/bonus-points",
  [requireSignIn],
  wrapAsync(bonusController.getTotalPoints)
);

BonusRouter.get(
  "/bonus-commissions",
  [requireSignIn],
  wrapAsync(bonusController.getTotalCommissions)
);