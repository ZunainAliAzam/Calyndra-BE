import { IsNotEmpty, IsString } from "class-validator";

export class CreateRsvpDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  eventId: string;
}
