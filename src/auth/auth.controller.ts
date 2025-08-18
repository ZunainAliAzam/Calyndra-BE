import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateAuthDto,
  CreateLoginDto,
  AuthResponseDto,
} from './dto/create-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() createAuthDto: CreateAuthDto): Promise<AuthResponseDto> {
    return this.authService.signup(createAuthDto);
  }

  @Post('login')
  login(@Body() createLoginDto: CreateLoginDto): Promise<AuthResponseDto> {
    return this.authService.login(createLoginDto);
  }
}
