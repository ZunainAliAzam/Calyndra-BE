import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RsvpService } from './rsvp.service';
import { CreateRsvpDto } from './dto/create-rsvp.dto';
import { UpdateRsvpDto } from './dto/update-rsvp.dto';

@Controller('rsvp')
export class RsvpController {
  constructor(private readonly rsvpService: RsvpService) {}

  @Post()
  create(@Body() createRsvpDto: CreateRsvpDto) {
    return this.rsvpService.create(createRsvpDto);
  }

  @Get()
  findAll() {
    return this.rsvpService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rsvpService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRsvpDto: UpdateRsvpDto) {
    return this.rsvpService.update(+id, updateRsvpDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rsvpService.remove(+id);
  }
}
