import { BaseEntity } from 'src/calyndra-shared/entities/base.entity';
import { Event } from 'src/events/entities/event.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class Rsvp extends BaseEntity {
  @ManyToOne(() => Event, (event) => event.rsvps, { eager: true })
  event: Event;

  @ManyToOne(() => User, (user) => user.rsvps, { eager: true })
  user: User;

  @Column({ nullable: true })
  guestName: string;

  @Column({ nullable: true })
  guestEmail: string;

  @Column({ nullable: true })
  guestPhone: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  rsvpDate: Date;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  approvedBy: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ default: false })
  checkedIn: boolean;

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date;
}
