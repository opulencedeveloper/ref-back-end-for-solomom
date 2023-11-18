import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../user/entity";

@Entity()
export class MatchingLevel {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "float",
  })
  amount: number;

  @Column({
    type: "varchar",
    length: 255,
  })
  source_user_fullname: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  receiver_user_id: string;

  @Column({
    type: "integer",
  })
  received_on_level: number;

  @Column({
    type: "boolean",
    default: false
  })
  selectedForWithdrawal: boolean;

  @ManyToOne(() => User, (user) => user.matchingLevels)
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}