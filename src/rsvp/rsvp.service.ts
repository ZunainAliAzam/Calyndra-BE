import { ConflictException, Injectable } from '@nestjs/common';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rsvp } from './entities/rsvp.entity';
import { RsvpStatus } from 'src/calyndra-shared/constants/enum';

@Injectable()
export class RsvpService {
  constructor(
    @InjectRepository(Rsvp) private rsvpRepo: Repository<Rsvp>,
  ) {}

  async createUserRsvp(createRsvpDto: CreateRsvpDto) {
    const { userId, eventId } = createRsvpDto;

    const user = await this.rsvpRepo.manager.findOne('User', {
      where: { id: userId },
    });
    const event = await this.rsvpRepo.manager.findOne('Event', {
      where: { id: eventId },
    });

    if (!event) {
      throw new Error(`Event with ID ${eventId} not found`);
    }
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    const existingRsvp = await this.rsvpRepo.findOne({
      where: { event: { id: eventId }, user: { id: userId } },
    });

    if (existingRsvp) {
      throw new ConflictException(`this user has already RSVP'd to this event`);
    }

    const rsvp = this.rsvpRepo.create({
      event,
      user,
    });
    return this.rsvpRepo.save(rsvp);
  }

  findAll() {
    return this.rsvpRepo.find({
      relations: ['event', 'user', 'approvedBy'],
      order: { rsvpDate: 'DESC' },
    });
  }

  async updateStatus(
    userId: string,
    eventId: string,
    status: RsvpStatus,
    approvedBy?: number,
  ) {
    const rsvp = await this.rsvpRepo.findOne({
      where: { userId, eventId },
    });

    if (!rsvp) {
      throw new Error(`RSVP not found for user ${userId} and event ${eventId}`);
    }

    rsvp.status = status;

    if (status === RsvpStatus.APPROVED) {
      rsvp.approvedAt = new Date();
      if (approvedBy) {
        rsvp.approvedBy = { id: approvedBy } as any;
      }
    }

    await this.rsvpRepo.save(rsvp);

    return {
      message: `RSVP status updated to ${RsvpStatus[status]}`, // converts 2 → 'APPROVED'
      status: rsvp.status,
    };
  }

  findOne(id: string) {
    return `This action returns a #${id} rsvp`;
  }

  update(id: number, updateRsvpDto: UpdateRsvpDto) {
    return `This action updates a #${id} rsvp`;
  }

  async remove(id: string) {
    const rsvp = await this.rsvpRepo.findOne({ where: { id } });
    if (!rsvp) {
      throw new Error(`Rsvp with ID ${id} not found`);
    }
    return this.rsvpRepo.delete(id);
  }
}
