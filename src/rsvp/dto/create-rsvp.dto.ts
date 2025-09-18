import { IsNotEmpty, IsString, IsOptional } from "class-validator";

export class CreateRsvpDto {
  // For guests
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  // Always required
  @IsNotEmpty()
  @IsString()
  eventId: string;
}
