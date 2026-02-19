import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongoServerError, ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersCollection: any;
  let mockJwtService: any;

  const mockUserId = new ObjectId('507f1f77bcf86cd799439011');
  const mockUser = {
    _id: mockUserId,
    email: 'test@example.com',
    password: '$2b$12$hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockUsersCollection = {
      findOne: vi.fn().mockResolvedValue(null),
      insertOne: vi.fn().mockResolvedValue({ insertedId: mockUserId }),
    };

    mockJwtService = {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: {
            users: vi.fn().mockReturnValue(mockUsersCollection),
          },
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user and return accessToken', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);

      const result = await service.register({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
      expect(mockUsersCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          password: 'hashed-password',
        }),
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUserId.toHexString(),
        email: 'new@example.com',
      });
    });

    it('should throw ConflictException on duplicate email (unique index violation)', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      const duplicateKeyError = new MongoServerError({
        message: 'E11000 duplicate key error',
      });
      duplicateKeyError.code = 11000;
      mockUsersCollection.insertOne.mockRejectedValue(duplicateKeyError);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should re-throw non-duplicate-key errors from insertOne', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);
      const genericError = new Error('Connection lost');
      mockUsersCollection.insertOne.mockRejectedValue(genericError);

      await expect(
        service.register({
          email: 'new@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow('Connection lost');
    });

    it('should hash password with bcrypt', async () => {
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never);

      await service.register({
        email: 'new@example.com',
        password: 'mypassword',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('mypassword', 12);
    });
  });

  describe('login', () => {
    it('should return accessToken for valid credentials', async () => {
      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({ accessToken: 'mock-jwt-token' });
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUserId.toHexString(),
        email: 'test@example.com',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'unknown@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should not reveal whether email exists (same error for both cases)', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);
      const noUserError = service
        .login({ email: 'a@b.com', password: 'x' })
        .catch((e) => e.message);

      mockUsersCollection.findOne.mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
      const wrongPassError = service
        .login({ email: 'test@example.com', password: 'wrong' })
        .catch((e) => e.message);

      expect(await noUserError).toBe(await wrongPassError);
    });
  });

  describe('validateUser', () => {
    it('should return user data for valid payload', async () => {
      mockUsersCollection.findOne.mockResolvedValue({
        _id: mockUserId,
        email: 'test@example.com',
      });

      const result = await service.validateUser({
        sub: mockUserId.toHexString(),
        email: 'test@example.com',
      });

      expect(result).toEqual({
        _id: mockUserId,
        email: 'test@example.com',
      });
    });

    it('should return null for invalid ObjectId', async () => {
      const result = await service.validateUser({
        sub: 'invalid-id',
        email: 'test@example.com',
      });

      expect(result).toBeNull();
      expect(mockUsersCollection.findOne).not.toHaveBeenCalled();
    });

    it('should return null if user not found', async () => {
      mockUsersCollection.findOne.mockResolvedValue(null);

      const result = await service.validateUser({
        sub: mockUserId.toHexString(),
        email: 'test@example.com',
      });

      expect(result).toBeNull();
    });

    it('should not include password in returned user', async () => {
      mockUsersCollection.findOne.mockResolvedValue({
        _id: mockUserId,
        email: 'test@example.com',
      });

      await service.validateUser({
        sub: mockUserId.toHexString(),
        email: 'test@example.com',
      });

      expect(mockUsersCollection.findOne).toHaveBeenCalledWith(
        { _id: expect.any(ObjectId) },
        { projection: { password: 0 } },
      );
    });
  });
});
