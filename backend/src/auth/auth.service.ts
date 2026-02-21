import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { MongoServerError, ObjectId } from 'mongodb';
import { DatabaseService } from '../database/database.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserDoc } from './interfaces/user.interface';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ accessToken: string }> {
    const hashedPassword = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const now = new Date();

    let insertedId: ObjectId;
    try {
      const result = await this.databaseService.users().insertOne({
        email: dto.email,
        password: hashedPassword,
        totalTokensUsed: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        createdAt: now,
        updatedAt: now,
      });
      insertedId = result.insertedId;
    } catch (err: unknown) {
      if (err instanceof MongoServerError && err.code === 11000) {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }

    this.logger.log('User registered successfully');

    const payload: JwtPayload = {
      sub: insertedId.toHexString(),
      email: dto.email,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.databaseService
      .users()
      .findOne({ email: dto.email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log('User logged in successfully');

    const payload: JwtPayload = {
      sub: user._id.toHexString(),
      email: user.email,
    };

    return { accessToken: this.jwtService.sign(payload) };
  }

  async validateUser(
    payload: JwtPayload,
  ): Promise<Pick<
    UserDoc,
    | '_id'
    | 'email'
    | 'totalTokensUsed'
    | 'totalPromptTokens'
    | 'totalCompletionTokens'
  > | null> {
    if (!ObjectId.isValid(payload.sub)) {
      return null;
    }

    const user = await this.databaseService
      .users()
      .findOne(
        { _id: new ObjectId(payload.sub) },
        { projection: { password: 0 } },
      );

    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      totalTokensUsed: user.totalTokensUsed ?? 0,
      totalPromptTokens: user.totalPromptTokens ?? 0,
      totalCompletionTokens: user.totalCompletionTokens ?? 0,
    };
  }
}
