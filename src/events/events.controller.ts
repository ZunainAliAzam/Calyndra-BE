import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventDto } from './dto/query-event.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('events')
@UseGuards(JwtAuthGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('create')
  create(@Body() createEventDto: CreateEventDto, @Request() req) {
    return this.eventsService.create(createEventDto, req.user.id);
  }

  @Get()
  findAll(@Query() queryEventDto: QueryEventDto, @Request() req) {
    return this.eventsService.findAll(queryEventDto, req.user.id);
  }

  @Get('url/:publicCode')
  findByPublicCode(
    @Param('publicCode') publicCode: string,
    @Query('userId') userId?: string,
  ) {
    if (userId) {
      return this.eventsService.findUserRsvpByPublicCode(publicCode, userId);
    }
    return this.eventsService.findByPublicCode(publicCode);
  }

  @Get('rsvps/:eventId')
  findRsvpsByEvent(@Param('eventId') eventId: string) {
    return this.eventsService.findRsvpsByEvent(eventId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }
  
  @Put('update/:id')
  update(@Param('id') id: string, @Body() updateEventDto: UpdateEventDto) {
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id);
  }
}
