import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Payment } from "../payment/entity";

@Entity()
export class Package {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  name: string;

  @Column({
    type: "float",
  })
  commission: number;

  @Column({
    type: "float",
  })
  point: number;

  @Column({
    type: "float",
  })
  amount: number;

  @Column({
    type: "float",
    default: 0,
  })
  stockistAmount: number;

  @OneToMany(() => Payment, (payment) => payment.packagePayment)
  payments: Payment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
