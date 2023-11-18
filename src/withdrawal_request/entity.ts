import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class WithdrawalRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  user_id: string;

  @Column({
    type: "varchar",
    length: 255,
  })
  fullName: string;

  @Column({
    type: "float",
  })
  amount: number;

  @Column({
    type: "boolean",
    default: false
  })
  approved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
