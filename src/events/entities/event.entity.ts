import { BaseEntity } from 'src/calyndra-shared/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { Rsvp } from 'src/rsvp/entities/rsvp.entity';

@Entity()
export class Event extends BaseEntity {
  @Column()
  title: string;

  @Column()
  dateOfEvent: Date;

  @Column()
  description: string;

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;
  
  @Column()
  location: string;

  @Column()
  type: string;

  @Column({ default: true })
  status: boolean;

  @Column({ nullable: true })
  capacity?: number;

  @ManyToOne(() => User, (user) => user.events, { eager: true })
  createdBy: User;

  @OneToMany(() => Rsvp, (rsvp) => rsvp.event)
  rsvps: Rsvp[];
}
