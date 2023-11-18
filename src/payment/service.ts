import { AppDataSource } from "../../app";
import { Payment } from "./entity";
import { IPaymentService } from "./interface";

class PaymentService {
  public async create(input: IPaymentService) {
    const newPayment = new Payment();

    newPayment.price = input.price;

    newPayment.packageName = input.packageName;

    newPayment.receiptImageUrl = input.receiptImageUrl;

    newPayment.user = input.user;

    newPayment.packagePayment = input.packagePayment;

    newPayment.receiptImageUrl = input.receiptImageUrl;

    const payment = await AppDataSource.getRepository(Payment).save(newPayment);

    return payment;
  }

  public async confirmPayment(id: string) {
    const payment = await AppDataSource.getRepository(Payment).update(
      { id },
      { paid: true }
    );

    return payment;
  }

  public async readPaymentById(id: string) {
    const payment = await AppDataSource.getRepository(Payment).findOne({
      where: { id },
      relations: ["user", "packagePayment"],
    });

    return payment;
  }

  // create service that returns all payments with relation of user and package
  public async findAll() {
    const payments = await AppDataSource.getRepository(Payment).find({
      relations: ["user", "packagePayment"],
      order: {
        createdAt: "DESC" // Sort by createdAt in descending order
      }
    });
    return payments;
  }

  public async findAllCompleted() {
    const payments = await AppDataSource.getRepository(Payment).find({
      where: {paid: true}
    });
    return payments;
  }

  public async findAllPending() {
    const payments = await AppDataSource.getRepository(Payment).find({
      where: {paid: false}
    });
    return payments;
  }
}

export const paymentService = new PaymentService();
