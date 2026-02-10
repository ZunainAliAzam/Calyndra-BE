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
import { Repository, LessThan, MoreThan } from 'typeorm';
import { RefreshToken } from './entities/auth.entity';
import { randomBytes, createHash, randomUUID } from 'crypto';
import { Cron, CronExpression } from '@nestjs/schedule';
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

  private async generateTokens(user: any, family?: string): Promise<AuthTokens> {
    const accessToken = this.generateAccessToken(user);

    // Generate opaque refresh token
    const rawRefreshToken = randomBytes(32).toString('hex');
    const hashedToken = createHash('sha256').update(rawRefreshToken).digest('hex');

    // Use existing family or create a new one
    const tokenFamily = family ?? randomUUID();

    // Save hashed refresh token to DB
    const refreshToken = this.refreshTokenRepository.create({
      token: hashedToken,
      family: tokenFamily,
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

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  async signup(createAuthDto: CreateAuthDto): Promise<AuthTokens> {
    const { password, firstName, lastName } = createAuthDto;
    const email = this.normalizeEmail(createAuthDto.email);

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
    const { password } = createLoginDto;
    const email = this.normalizeEmail(createLoginDto.email);

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

    // Reuse detection: if the token was already revoked, the family is compromised
    if (storedToken.isRevoked) {
      // Revoke all tokens in this family
      await this.refreshTokenRepository.delete({ family: storedToken.family });
      throw new UnauthorizedException('Refresh token reuse detected — all sessions revoked');
    }

    // Revoke the current token (instead of deleting, mark as revoked for reuse detection)
    storedToken.isRevoked = true;
    await this.refreshTokenRepository.save(storedToken);

    // Fetch full user for token generation
    const user = await this.userService.findOne(storedToken.user.id);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Issue new tokens in the same family
    return this.generateTokens(user, storedToken.family);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const hashedToken = createHash('sha256').update(rawRefreshToken).digest('hex');
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: hashedToken },
    });
    if (storedToken) {
      // Delete all tokens in this family to fully log out
      await this.refreshTokenRepository.delete({ family: storedToken.family });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async purgeStaleTokens(): Promise<void> {
    // Remove expired tokens
    await this.refreshTokenRepository.delete({
      expiresAt: LessThan(new Date()),
    });

    // Remove revoked tokens older than 24h (reuse detection window)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.refreshTokenRepository.delete({
      isRevoked: true,
      createdAt: LessThan(oneDayAgo),
    });
  }
}
