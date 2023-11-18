import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../user/entity";
import { Package } from "../package/entity";

@Entity()
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "float",
  })
  price: number;

  @Column({
    type: "varchar",
    length: 255,
  })
  packageName: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  receiptImageUrl: string;

  @Column({
    type: "boolean",
    default: false,
  })
  paid: boolean;

  @ManyToOne(() => User, (user) => user.payments)
  user: User;

  @ManyToOne(() => Package, (packagePayment) => packagePayment.payments)
  packagePayment: Package;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
