import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class MatchingLevelBonusAmount {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "float",
  })
  amount: number;

  @Column({
    type: "integer",
  })
  level: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}