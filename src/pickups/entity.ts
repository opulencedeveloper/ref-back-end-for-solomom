import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from "typeorm";
  
  @Entity()
  export class Pickup {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({
      type: "varchar",
      length: 255,
    })
    package_name: string;
  
    @Column({
      type: "varchar",
      length: 255,
    })
    stockist_id: string;

    @Column({
        type: "varchar",
        length: 255,
      })
      user_id: string;
    
    @Column({
        type: "boolean",
        default: false,
      })
      received_by_user: Boolean;
    
    @Column({
        type: "boolean",
        default: false,
      })
      delivered_by_stockist: Boolean;

  
    @CreateDateColumn()
    createdAt: Date;
  
    @UpdateDateColumn()
    updatedAt: Date;
  }
  