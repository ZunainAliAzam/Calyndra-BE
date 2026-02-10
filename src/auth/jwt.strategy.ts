import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService, private userService: UsersService) {
    super({
      jwtFromRequest: (req) => {
        return req?.cookies?.access_token ?? null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'secret'),
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }
    return { id: payload.sub, email: payload.email, role: user.role };
  }
}
