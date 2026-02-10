import { Module } from '@nestjs/common';
import { RsvpService } from './rsvp.service';
import { RsvpController } from './rsvp.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rsvp } from './entities/rsvp.entity';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Rsvp]), UsersModule],
  controllers: [RsvpController],
  providers: [RsvpService],
  exports: [RsvpService],
})
export class RsvpModule {}
