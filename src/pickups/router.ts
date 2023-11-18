import { Router } from "express";
import { wrapAsync } from "../utils";
import { requireSignIn } from "../utils/auth";
import { pickupController } from "./controller";

export const PickupRouter = Router();

PickupRouter.get(
  "/get-pickups",
  [requireSignIn],
  wrapAsync(pickupController.getPickups)
);

PickupRouter.put(
  "/user-confirm-pickup/:id",
  [requireSignIn],
  wrapAsync(pickupController.userConfirmPickup)
);

PickupRouter.put(
  "/stockist-confirm-pickup/:id",
  [requireSignIn],
  wrapAsync(pickupController.stockistConfirmPickup)
);
