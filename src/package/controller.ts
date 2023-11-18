import { Request, Response } from "express";
import { MessageResponse } from "../utils/enum";
import { packageService } from "./service";
import { IPackage, IUpdatePackage } from "./interface";

class PackageController {
  public async readPackages(req: Request, res: Response) {
    const packages = await packageService.readPackages();

    return res.json({
      message: MessageResponse.Success,
      description: "Packages in the system",
      data: {
        package: packages,
      },
    });
  }

  public async updatePackage(req: Request, res: Response) {
    const body: IUpdatePackage = req.body;

    if (Object.getOwnPropertyNames(body).length < 1) {
      return res.json({
        message: MessageResponse.Error,
        description: "Update atleast one field",
        data: null,
      });
    }

    const packageExists = await packageService.readPackage(body.id);

    if (!packageExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Package does not exist",
        data: null,
      });
    }

    if (body.name) {
      const packageNameExists = await packageService.readPackageByName(
        body.name
      );

      if (packageNameExists) {
        return res.json({
          message: MessageResponse.Error,
          description: "Package name already exists",
          data: null,
        });
      }
    }

    await packageService.updatePackage(body.id, body);

    return res.json({
      message: MessageResponse.Success,
      description: "Package updated successfully",
      data: null,
    });
  }

  public async createPackage(req: Request, res: Response) {
    const body: IPackage = req.body;

    const packageExists = await packageService.readPackageByName(body.name);

    if (packageExists) {
      return res.json({
        message: MessageResponse.Error,
        description: "Package already exists",
        data: null,
      });
    }

    const newPackage = await packageService.savePackage(body);

    return res.json({
      message: MessageResponse.Success,
      description: "Package successfully created",
      data: {
        package: newPackage,
      },
    });
  }
}

export const packageController = new PackageController();
