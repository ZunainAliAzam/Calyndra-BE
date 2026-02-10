import { RsvpStatus } from 'src/calyndra-shared/constants/enum';
import { BaseEntity } from 'src/calyndra-shared/entities/base.entity';
import { Event } from 'src/events/entities/event.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

@Entity()
export class Rsvp extends BaseEntity {
  @Column({ type: 'enum', enum: RsvpStatus, default: RsvpStatus.PENDING })
  status: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  rsvpDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ default: false })
  checkedIn: boolean;

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date;

  @ManyToOne(() => User, (user) => user.id, { eager: true })
  approvedBy: User;

  @ManyToOne(() => Event, (event) => event.rsvps, { eager: false })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column()
  eventId: string;

  @ManyToOne(() => User, (user) => user.rsvps, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;
}
