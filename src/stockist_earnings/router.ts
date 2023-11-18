import { Router } from "express";
import { wrapAsync } from "../utils";
import { requireSignIn } from "../utils/auth";
import { stockistEarningsController } from "./controller";

export const StockistEarningsRouter = Router();

StockistEarningsRouter.get(
  "/get-stockist-earnings",
  [requireSignIn],
  wrapAsync(stockistEarningsController.getStockistEarnings)
);
