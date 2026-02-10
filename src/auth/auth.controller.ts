import { Controller, Post, Body, Res, Req, HttpCode, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  CreateAuthDto,
  CreateLoginDto,
} from './dto/create-auth.dto';
import * as express from 'express';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private setAuthCookies(res: express.Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: '/auth', // only sent to auth endpoints
    });
  }

  @Post('signup')
  async signup(
    @Body() createAuthDto: CreateAuthDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { accessToken, refreshToken, userData } = await this.authService.signup(createAuthDto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return userData;
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() createLoginDto: CreateLoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const { accessToken, refreshToken, userData } = await this.authService.login(createLoginDto);
    this.setAuthCookies(res, accessToken, refreshToken);
    return userData;
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const rawRefreshToken = req.cookies?.refresh_token;
    if (!rawRefreshToken) {
      throw new UnauthorizedException('No refresh token');
    }
    const { accessToken, refreshToken, userData } = await this.authService.refresh(rawRefreshToken);
    this.setAuthCookies(res, accessToken, refreshToken);
    return userData;
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ) {
    const rawRefreshToken = req.cookies?.refresh_token;
    if (rawRefreshToken) {
      await this.authService.logout(rawRefreshToken);
    }
    res.clearCookie('access_token');
    res.clearCookie('refresh_token', { path: '/auth' });
    return { message: 'Logged out successfully' };
  }
}
