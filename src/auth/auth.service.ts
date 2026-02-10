import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import {
  CreateAuthDto,
  CreateLoginDto,
  AuthResponseDto,
} from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  private generateToken(user: any): AuthResponseDto {
    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    return {
      user: {
        id: user.id,
        username: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        token: token,
      },
    };
  }

  async signup(createAuthDto: CreateAuthDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = createAuthDto;
    const existing = await this.userService.findByEmailOrNull(email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const hashedpassword = await bcrypt.hash(password, 10);
    const user = await this.userService.create({
      firstName,
      lastName,
      email,
      password: hashedpassword,
    });
    return this.generateToken(user);
  }

  async login(createLoginDto: CreateLoginDto): Promise<AuthResponseDto> {
    const { email, password } = createLoginDto;
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateToken(user);
  }
}
