import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRole } from "./enum";
import { Payment } from "../payment/entity";
import { Bonus } from "../bonus/entity";
import { MatchingLevel } from "../matching_level_reward/entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  firstname: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  lastname: string;

  @Column({
    type: "varchar",
    length: 255,
    unique: true,
  })
  email: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.Normal
  })
  role: UserRole

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
  })
  pick_up_address: string;

  @Column({ type: "varchar", length: 255, unique: true })
  referralCode: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  referredCode: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  rootReferredCode: string;
  
  @Column({
    type: "integer"
  })
  referralLevel: number;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true
  })
  accountNumber: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true
  })
  accountName: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true
  })
  bankName: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true
  })
  stockistAddress: string;

  @Column({
    type: "varchar",
    length: 255,
    nullable: true
  })
  profilePicture: string;

  @ManyToOne(() => User, (user) => user.referrals)
  @JoinColumn({ name: "referredCode", referencedColumnName: "referralCode" })
  referrer: User;

  @OneToMany(() => User, (user) => user.referrer)
  referrals: User[];

  @OneToMany(() => Payment, payment => payment.user)
  payments: Payment[];

  @OneToMany(() => MatchingLevel, matchingLevel => matchingLevel.user)
  matchingLevels: MatchingLevel[];

  @OneToMany(() => Bonus, bonus => bonus.user)
  bonuses: Bonus[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
