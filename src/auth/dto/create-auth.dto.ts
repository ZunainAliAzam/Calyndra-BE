import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class CreateAuthDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' })
  password: string;
}

export class CreateLoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

// Response DTOs for type safety
export class AuthResponseDto {
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  };
}
