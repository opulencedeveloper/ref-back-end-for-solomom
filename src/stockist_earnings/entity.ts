import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity()
  export class StockistEarnings {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
      type: "varchar",
      length: 255,
    })
    stockist_id: string;
  
    @Column({
      type: "varchar",
      length: 255,
    })
    package_name: string;

    @Column({
        type: "float",
      })
    commission: number;
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  