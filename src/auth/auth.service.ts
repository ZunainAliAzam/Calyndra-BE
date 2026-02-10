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
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { RefreshToken } from './entities/auth.entity';
import { randomBytes, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userData: AuthResponseDto;
}

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  private generateAccessToken(user: any): string {
    const payload = { sub: user.id, email: user.email };
    return this.jwtService.sign(payload);
  }

  private async generateTokens(user: any): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);

    // Generate opaque refresh token
    const rawRefreshToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawRefreshToken).digest('hex');

    // Save hashed refresh token to DB
    const refreshToken = this.refreshTokenRepository.create({
      token: hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      user: { id: user.id },
    });
    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      userData: {
        user: {
          id: user.id,
          username: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role,
        },
      },
    };
  }

  async signup(createAuthDto: CreateAuthDto): Promise<AuthTokens> {
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
    return this.generateTokens(user);
  }

  async login(createLoginDto: CreateLoginDto): Promise<AuthTokens> {
    const { email, password } = createLoginDto;
    const user = await this.userService.findByEmailWithPassword(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const hashedToken = createHash('sha256').update(rawRefreshToken).digest('hex');

    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: hashedToken, expiresAt: MoreThan(new Date()) },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete old refresh token (rotation)
    await this.refreshTokenRepository.remove(storedToken);

    // Fetch full user for token generation
    const user = await this.userService.findOne(storedToken.user.id);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return this.generateTokens(user);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const hashedToken = createHash('sha256').update(rawRefreshToken).digest('hex');
    await this.refreshTokenRepository.delete({ token: hashedToken });
  }
}
