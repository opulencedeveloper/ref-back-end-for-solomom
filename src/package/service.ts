import { AppDataSource } from "../../app";
import { Package } from "./entity";
import { IPackage } from "./interface";

class PackageService {
  public async savePackage(input: IPackage) {
    const newPackage = new Package();

    newPackage.name = input.name;

    newPackage.commission = input.commission;

    newPackage.point = input.point;

    newPackage.amount = input.amount;

    newPackage.stockistAmount = input.stockistAmount;

    const packageInDb = await AppDataSource.getRepository(Package).save(newPackage);

    return packageInDb;
  }

  public async readPackages() {
    const packageInDb = await AppDataSource.getRepository(Package).find();

    return packageInDb;
  }

  public async readPackage(id: string) {
    const packageInDb = await AppDataSource.getRepository(Package).findOne({
      where: { id },
    });

    return packageInDb;
  }

  public async updatePackage(id: string, updateData: Partial<IPackage>) {
    const updatedPackage = await AppDataSource.getRepository(Package).update(
      { id },
      { ...updateData }
    );

    return updatedPackage;
  }

  public async readPackageByName(name: string) {
    const packageInDb = await AppDataSource.getRepository(Package).findOne({
      where: { name },
    });

    return packageInDb;
  }
}

export const packageService = new PackageService();