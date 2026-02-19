import { Test, TestingModule } from '@nestjs/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  const mockAccessToken = { accessToken: 'mock-jwt-token' };

  beforeEach(async () => {
    authService = {
      register: vi.fn().mockResolvedValue(mockAccessToken),
      login: vi.fn().mockResolvedValue(mockAccessToken),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('register', () => {
    it('should register a user and return accessToken', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const result = await controller.register(dto);

      expect(result).toEqual(mockAccessToken);
      expect(authService.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('should login a user and return accessToken', async () => {
      const dto = { email: 'test@example.com', password: 'password123' };
      const result = await controller.login(dto);

      expect(result).toEqual(mockAccessToken);
      expect(authService.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('getProfile', () => {
    it('should return user from request', () => {
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      };
      const mockReq = { user: mockUser } as any;

      const result = controller.getProfile(mockReq);
      expect(result).toEqual(mockUser);
    });
  });
});
