import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { IAdmin } from "./interface";
import { adminService } from "./service";
import { MessageResponse } from "../utils/enum";
import { comparePassword } from "../utils/auth";
import { CustomRequest } from "../utils/interface";
import { userService } from "../user/service";

class AdminController {
  public async create(req: Request, res: Response) {
    const body: IAdmin = req.body;

    const adminExists = await adminService.readAdminByEmail(body.email);

    if (adminExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Admin with this email already exists",
        data: null,
      });
    }

    const newAdmin = await adminService.saveAdmin(body);

    const token = jwt.sign({ admin_id: newAdmin.id }, process.env.JWT_SECRET!, {
      expiresIn: "30d",
    });

    return res.json({
      message: MessageResponse.Success,
      description: "Account successfully created",
      data: {
        token,
        admin: newAdmin,
      },
    });
  }

  public async getAdmins(req: Request, res: Response) {
    const admins = await adminService.readAllAdmins();

    return res.json({
      message: MessageResponse.Success,
      description: "All Admins API",
      data: {
        admins,
      },
    });
  }

  public async currentUser(req: CustomRequest, res: Response) {
    const { admin_id } = req.auth;

    try {
      const admin = await adminService.readAdmin(admin_id);

      if (admin) {
        return res.json({ ok: true });
      }

      return res.sendStatus(400);
    } catch (error) {
      return res.sendStatus(400);
    }
  }

  public async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const adminExists = await adminService.readAdminByEmail(email);

    if (!adminExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    const match = await comparePassword(password, adminExists.password);

    if (!match) {
      return res.json({
        message: MessageResponse.Error,
        description: "Wrong password",
        data: null,
      });
    }

    const token = jwt.sign(
      { admin_id: adminExists.id },
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
        admin: adminExists,
      },
    });
  }

  public async makeUserStockist(req: Request, res: Response) {
    const { user_id } = req.body;

    const updatedUser = await adminService.makeUserStockist(user_id);

    return res.json({
      message: MessageResponse.Success,
      description: "User is now a stockist",
      data: {
        user: updatedUser,
      },
    });
  }

  public async getStatistics(req: Request, res: Response) {
    const statistics = await adminService.readBonusses();

    const totalMoney = await adminService.readTotalMoney();

    return res.json({
      message: MessageResponse.Success,
      description: "Total statistics fetched successfully",
      data: {
        totalCommissions: statistics.totalCommissions,
        totalPoints: statistics.totalPoints,
        totalMatchingLevelBonusses: statistics.totalMatchingLevelBonusses,
        totalMoney,
      },
    });
  }

  public async createMatchingLevelBonus(req: Request, res: Response) {
    const { amount, level } = req.body;

    const readMatchingLevelBonusAmounts =
      await adminService.readMatchingLevelBonusAmounts();

    if (readMatchingLevelBonusAmounts.length === 12) {
      return res.json({
        message: MessageResponse.Success,
        description: "Matching Level Bonus already has 12 levels",
        data: null,
      });
    }

    const matchingLevelBonusAmountExists =
      await adminService.readMatchingLevelBonusByLevel(level);

    if (matchingLevelBonusAmountExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Matching Level Bonus Amount already exists",
        data: null,
      });
    }

    await adminService.createMatchingLevelBonusAmount(amount, level);

    return res.json({
      message: MessageResponse.Success,
      description: "Matching Level Bonus Amount created successfully",
      data: null,
    });
  }

  public async getAllMatchingLevelBonus(req: Request, res: Response) {
    const readMatchingLevelBonusAmounts =
      await adminService.readMatchingLevelBonusAmounts();

    return res.json({
      message: MessageResponse.Success,
      description: "Matching Level Bonus Amount retrieved successfully",
      data: readMatchingLevelBonusAmounts,
    });
  }

  public async updateMatchingLevelBonusByLevel(req: Request, res: Response) {
    const { amount, level } = req.body;

    const matchingLevelBonusAmountExists =
      await adminService.readMatchingLevelBonusByLevel(level);

    if (!matchingLevelBonusAmountExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Matching Level Bonus Amount does not exists",
        data: null,
      });
    }

    await adminService.updateMatchingLevelBonusByLevel(level, amount);

    return res.json({
      message: MessageResponse.Success,
      description: "Matching Level Bonus Amount updated successfully",
      data: null,
    });
  }

  public async sendUserMessage(req: Request, res: Response) {
    // TODO: Work on User Message
  }

  public async channgePassword(req: Request, res: Response) {
    const { email, password } = req.body;

    const userExists = await userService.readUserByEmail(email);

    if (!userExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Account does not exist",
        data: null,
      });
    }

    await userService.updateUserPassword(userExists.id, password);

    return res.json({
      message: MessageResponse.Success,
      description: "User password changed successfully",
      data: null,
    });
  }
}

export const adminController = new AdminController();
