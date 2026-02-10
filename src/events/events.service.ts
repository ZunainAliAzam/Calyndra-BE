import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import { Rsvp } from 'src/rsvp/entities/rsvp.entity';
import {
  ILike,
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  IsNull,
} from 'typeorm';
import { QueryEventDto } from './dto/query-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event) private eventsRepo: Repository<Event>,
    @InjectRepository(Rsvp) private rsvpRepo: Repository<Rsvp>,
  ) {}

  private generateRandomCode(length = 8): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return result;
  }

  private async generateUniquePublicCode(): Promise<string> {
    // Retry a few times to avoid rare collisions
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = this.generateRandomCode(8);
      const existing = await this.eventsRepo.findOne({
        where: { publicCode: candidate },
      });
      if (!existing) return candidate;
    }
    // Fall back to longer code if repeated collisions
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = this.generateRandomCode(10);
      const existing = await this.eventsRepo.findOne({
        where: { publicCode: candidate },
      });
      if (!existing) return candidate;
    }
    // As a last resort, use timestamp based suffix
    return `${this.generateRandomCode(6)}${Date.now().toString(36).toUpperCase()}`;
  }

  async create(createEventDto: CreateEventDto, userId: string) {
    const event = this.eventsRepo.create({
      ...createEventDto,
      createdBy: { id: userId } as any,
    });
    return await this.generateUniquePublicCode().then((code) => {
      event.publicCode = code;
      return this.eventsRepo.save(event);
    });
  }

  async findAll(queryEventDto: QueryEventDto, userId: string) {
    const {
      search,
      status,
      type,
      location,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = queryEventDto;

    const where: any = {
      createdBy: { id: userId },
    };

    if (status !== undefined) {
      where.status = status;
    }

    if (search) {
      where.title = ILike(`%${search}%`);
    }

    if (type) {
      where.type = ILike(`%${type}%`);
    }

    if (location) {
      where.location = ILike(`%${location}%`);
    }

    if (startDate && endDate) {
      // If both dates are provided, filter events within the date range
      where.dateOfEvent = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      // If only startDate is provided, filter events from that date onwards
      where.dateOfEvent = MoreThanOrEqual(new Date(startDate));
    } else if (endDate) {
      // If only endDate is provided, filter events up to that date
      where.dateOfEvent = LessThanOrEqual(new Date(endDate));
    }

    const [events, total] = await this.eventsRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { dateOfEvent: 'ASC' },
    });

    return {
      events,
      total,
    };
  }

  findOne(id: string) {
    return this.eventsRepo.findOne({ where: { id } });
  }

  async findByPublicCode(publicCode: string, userId?: string) {
    const event = await this.eventsRepo.findOne({
      where: { publicCode },
      relations: ['rsvps', 'rsvps.user'],
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return event;
  }

  async findUserRsvpByPublicCode(publicCode: string, userId: string) {
    const event = await this.eventsRepo
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.rsvps', 'rsvp', 'rsvp.userId = :userId', {
        userId,
      })
      .leftJoinAndSelect('rsvp.user', 'user')
      .where('event.publicCode = :publicCode', { publicCode })
      .getOne();

    if (!event) {
      throw new NotFoundException('Event not found');
    }
    const userRsvp = event.rsvps?.[0] ?? null;

    return { event, userRsvp };
  }

  async findRsvpsByEvent(eventId: string) {
    const event = await this.eventsRepo.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return this.rsvpRepo.find({
      where: { event: { id: eventId } },
      order: { rsvpDate: 'DESC' },
    });
  }

  async update(id: string, updateEventDto: UpdateEventDto) {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    Object.assign(event, updateEventDto);
    return await this.eventsRepo.save(event);
  }

  async remove(id: string) {
    const event = await this.eventsRepo.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return this.eventsRepo.delete(id);
  }
}
