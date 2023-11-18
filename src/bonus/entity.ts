import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../user/entity";
import { BonusType } from "./enum";

@Entity()
export class Bonus {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "enum",
    enum: BonusType
  })
  type: BonusType;

  @Column({
    type: "float",
  })
  amount: number;

  @Column({
    type: "varchar",
    length: 255,
  })
  packageName: string;

  @Column({
    type: "boolean",
    default: false
  })
  selectedForWithdrawal: boolean;

  @ManyToOne(() => User, (user) => user.bonuses)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
