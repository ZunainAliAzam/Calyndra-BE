import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Event } from './entities/event.entity';
import {
  ILike,
  Repository,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
} from 'typeorm';
import { QueryEventDto } from './dto/query-event.dto';

@Injectable()
export class EventsService {
  constructor(@InjectRepository(Event) private eventsRepo: Repository<Event>) {}

  create(createEventDto: CreateEventDto) {
    const event = this.eventsRepo.create(createEventDto);
    return this.eventsRepo.save(event);
  }

  async findAll(queryEventDto: QueryEventDto) {
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

    const where: any = {};

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
