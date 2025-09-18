import { BaseEntity } from 'src/calyndra-shared/entities/base.entity';
import { Event } from 'src/events/entities/event.entity';
import { Rsvp } from 'src/rsvp/entities/rsvp.entity';
import { Column, Entity, OneToMany } from 'typeorm';
@Entity()
export class User extends BaseEntity {
  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Event, (event) => event.createdBy)
  events: Event[];

  @OneToMany(() => Rsvp, (rsvp) => rsvp.user)
  rsvps: Rsvp[];
}
