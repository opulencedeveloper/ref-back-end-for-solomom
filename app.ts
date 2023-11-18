import { User } from './src/user/entity';
import express, { NextFunction, Request, Response, Express } from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { DataSource } from "typeorm";
import Logging from "./src/utils/loggin";
import { MessageResponse } from "./src/utils/enum";
import { EmailVerify } from "./src/auth/entity";
import { UserRouter } from "./src/user/router";
import { AdminRouter } from './src/admin/router';
import { PickupRouter } from "./src/pickups/router";
import { Admin } from './src/admin/entity';
import { Package } from './src/package/entity';
import { PackageRouter } from './src/package/router';
import { Payment } from './src/payment/entity';
import { PaymentRouter } from './src/payment/router';
import { Bonus } from './src/bonus/entity';
import { MatchingLevel } from './src/matching_level_reward/entity';
import { BonusRouter } from './src/bonus/router';
import { MatchingLevelBonusAmount } from './src/MatchingLevelBonusAmount/entity';
import { WithdrawalRequest } from './src/withdrawal_request/entity';
import { WithdrawalRequestRouter } from './src/withdrawal_request/router';
import {Pickup} from './src/pickups/entity';
import { StockistEarnings } from './src/stockist_earnings/entity';
import { StockistEarningsRouter } from './src/stockist_earnings/router';

const app: Express = express();

dotenv.config();

// entry point
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.HOST,
  port: parseInt(`${process.env.PG_PORT}`),
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DB,
  entities: [User, EmailVerify, Admin, Package, Payment, Bonus, MatchingLevel, MatchingLevelBonusAmount, WithdrawalRequest, Pickup, StockistEarnings],
  synchronize: true,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

const port = process.env.PORT || 8080;

const StartServer = () => {
  app.use((req: Request, res: Response, next: NextFunction) => {
    Logging.info(
      `Incomming ==> Method : [${req.method}] - IP: [${req.socket.remoteAddress}]`
    );
    res.on("finish", () => {
      // Log the Response
      Logging.info(
        `Incomming ==> Method : [${req.method}] - Url: [${req.url}] - IP: [${req.socket.remoteAddress}] - status: [${res.statusCode}]`
      );
    });
    next();
  });

  app.use(express.json());

  app.use(express.urlencoded({ extended: true }));

  // Cors
  app.use(cors({
    origin: ["https://outstandingdot.vercel.app", "http://localhost:3000", "https://outstandingdotadmin.vercel.app", "https://ref-frontend-zrac.vercel.app", "https://iridescent-clafoutis-58776e.netlify.app", "https://ref-frontend.vercel.app"],
    credentials: true
  }));
  // app.use(cors());

  // Routes
  app.use("/api", UserRouter, AdminRouter, PackageRouter, PaymentRouter, BonusRouter, WithdrawalRequestRouter, PickupRouter, StockistEarningsRouter);

  // Health check
  app.get("/api/healthcheck", (_req: Request, res: Response) => {
    res.json({ status: "UP 🔥🔧🎂" }).status(200);
  });

  // Invalid url error handling
  app.use((_req: Request, res: Response) => {
    const _error = new Error("Url not found 😟");
    Logging.error(_error);
    return res.json({ message: _error.message }).status(400);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err) {
      console.error(err);
      if (err.name === "UnauthorizedError") {
        if (err.inner.name === "JsonWebTokenError") {
          res.status(401).json({
            message: MessageResponse.Error,
            description: "Invalid token",
            data: null,
          });
        } else if (err.inner.name === "TokenExpiredError") {
          res.status(401).json({
            message: MessageResponse.Error,
            description: "Token expired",
            data: null,
          });
        } else {
          res.status(401).json({
            message: MessageResponse.Error,
            description: err.name,
            data: null,
          });
        }
      }
    }
  });

  http
    .createServer(app)
    .listen(port, () => Logging.info(`Server is running on port ${port} 🔥🔧`));
};

AppDataSource.initialize()
  .then(() => {
    Logging.info(`Database connected 🎂`);
    StartServer();
  })
  .catch((_error) => {
    Logging.error("Error while connecting to Database ===> ");
    Logging.error(_error);
  });