import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from "typeorm";
import { AdminRole } from "./enum";
  
  @Entity()
  export class Admin {
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
        enum: AdminRole
    })
    role: AdminRole
  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  