import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  CreateAuthDto,
  CreateLoginDto,
  AuthResponseDto,
} from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  signup(@Body() createAuthDto: CreateAuthDto): Promise<AuthResponseDto> {
    return this.authService.signup(createAuthDto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  login(@Body() createLoginDto: CreateLoginDto): Promise<AuthResponseDto> {
    return this.authService.login(createLoginDto);
  }
}
