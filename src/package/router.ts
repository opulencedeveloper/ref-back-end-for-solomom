import { Router } from "express";
import { wrapAsync } from "../utils";
import { requireSignIn } from "../utils/auth";
import { packageValidator } from "./validator";
import { packageController } from "./controller";

export const PackageRouter = Router();

PackageRouter.get("/packages", [requireSignIn], wrapAsync(packageController.readPackages));

PackageRouter.post(
  "/createpackage",
  [requireSignIn, packageValidator.createPackage],
  wrapAsync(packageController.createPackage)
);

PackageRouter.post(
  "/editpackage",
  [requireSignIn, packageValidator.updatePackage],
  wrapAsync(packageController.updatePackage)
);
