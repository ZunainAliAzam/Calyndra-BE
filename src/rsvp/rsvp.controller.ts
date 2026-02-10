import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { RsvpService } from './rsvp.service';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';

@Controller('rsvps')
export class RsvpController {
  constructor(private readonly rsvpService: RsvpService) {}

  @Get()
  findAll() {
    return this.rsvpService.findAll();
  }

  @Put('/status/:id')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: number,
    @Body('eventId') eventId: string,
    @Body('approvedBy') approvedBy: number,
  ) {
    return this.rsvpService.updateStatus(id, eventId, status, approvedBy);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rsvpService.findOne(id);
  }


  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRsvpDto: UpdateRsvpDto) {
    return this.rsvpService.update(+id, updateRsvpDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rsvpService.remove(id);
  }

  @Post('/user')
  createRsvpByUser(@Body() createRsvpDto: CreateRsvpDto) {
    return this.rsvpService.createUserRsvp(createRsvpDto);
  }
}
