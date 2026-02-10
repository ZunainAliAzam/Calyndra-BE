import { Controller, Post, Body, Res, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  CreateAuthDto,
  CreateLoginDto,
} from './dto/create-auth.dto';
import * as express from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('signup')
  async signup(
    @Body() createAuthDto: CreateAuthDto, 
    @Res({ passthrough: true}) res: express.Response,
  ) {
    const {token, userData} = await this.authService.signup(createAuthDto);
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return userData;
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() createLoginDto: CreateLoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { token, userData } = await this.authService.login(createLoginDto);
    res.cookie('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return userData;
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: express.Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }
}
