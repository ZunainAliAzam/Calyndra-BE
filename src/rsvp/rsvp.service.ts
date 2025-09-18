import { Injectable } from '@nestjs/common';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rsvp } from './entities/rsvp.entity';

@Injectable()
export class RsvpService {
  constructor(@InjectRepository(Rsvp) private rsvpRepo: Repository<Rsvp>) {}

  create(createRsvpDto: CreateRsvpDto) {
    const { name, email, phone, eventId } = createRsvpDto;
    const rsvp = this.rsvpRepo.create({
      guestName: name,
      guestEmail: email,
      guestPhone: phone,
      event: { id: eventId } as any,
    });
    return this.rsvpRepo.save(rsvp);
  }

  findAll() {
    return this.rsvpRepo.find({
      relations: ['event', 'user', 'approvedBy'],
      order: { rsvpDate: 'DESC' },
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} rsvp`;
  }

  update(id: number, updateRsvpDto: UpdateRsvpDto) {
    return `This action updates a #${id} rsvp`;
  }

  remove(id: number) {
    return `This action removes a #${id} rsvp`;
  }
}
