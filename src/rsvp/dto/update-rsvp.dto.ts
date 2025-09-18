import { PartialType } from '@nestjs/mapped-types';
import { CreateRsvpDto } from './create-rsvp.dto';

export class UpdateRsvpDto extends PartialType(CreateRsvpDto) {}
