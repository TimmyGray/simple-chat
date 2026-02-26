import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpService } from './mcp.service';
import { DatabaseService } from '../database/database.service';

vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
  Client: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    listTools: vi.fn().mockResolvedValue({
      tools: [
        {
          name: 'test-tool',
          description: 'A test tool',
          inputSchema: { type: 'object', properties: {} },
        },
      ],
    }),
    callTool: vi.fn().mockResolvedValue({
      content: [{ type: 'text', text: 'result' }],
      isError: false,
    }),
  })),
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
  StdioClientTransport: vi.fn().mockImplementation(() => ({})),
}));

describe('McpService', () => {
  let service: McpService;
  let mockMcpServersCollection: any;

  const mockServerId = new ObjectId('507f1f77bcf86cd799439011');

  const mockServer = {
    _id: mockServerId,
    name: 'Test MCP Server',
    command: 'node',
    args: ['server.js'],
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockMcpServersCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: mockServerId }),
      find: vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue([mockServer]),
      }),
      findOne: vi.fn().mockResolvedValue(mockServer),
      findOneAndUpdate: vi.fn().mockResolvedValue(mockServer),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    };

    const mockDatabaseService = {
      mcpServers: vi.fn().mockReturnValue(mockMcpServersCollection),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        McpService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<McpService>(McpService);
  });

  describe('getServers', () => {
    it('should return all MCP servers', async () => {
      const result = await service.getServers();
      expect(result).toEqual([mockServer]);
    });
  });

  describe('getServer', () => {
    it('should return a server by id', async () => {
      const result = await service.getServer(String(mockServerId));
      expect(result).toEqual(mockServer);
    });

    it('should throw NotFoundException if not found', async () => {
      mockMcpServersCollection.findOne.mockResolvedValue(null);
      await expect(service.getServer(String(mockServerId))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createServer', () => {
    it('should create and connect to a server', async () => {
      const dto = {
        name: 'New Server',
        command: 'node',
        args: ['server.js'],
      };
      const result = await service.createServer(dto);
      expect(result._id).toEqual(mockServerId);
      expect(result.name).toBe('New Server');
      expect(result.enabled).toBe(true);
      expect(mockMcpServersCollection.insertOne).toHaveBeenCalledOnce();
    });

    it('should create a disabled server without connecting', async () => {
      const dto = {
        name: 'Disabled Server',
        command: 'node',
        args: ['server.js'],
        enabled: false,
      };
      const result = await service.createServer(dto);
      expect(result.enabled).toBe(false);
    });
  });

  describe('updateServer', () => {
    it('should update a server', async () => {
      const result = await service.updateServer(String(mockServerId), {
        name: 'Updated',
      });
      expect(result).toEqual(mockServer);
      expect(mockMcpServersCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: mockServerId },
        { $set: expect.objectContaining({ name: 'Updated' }) },
        { returnDocument: 'after' },
      );
    });

    it('should throw NotFoundException if not found', async () => {
      mockMcpServersCollection.findOneAndUpdate.mockResolvedValue(null);
      await expect(
        service.updateServer(String(mockServerId), { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteServer', () => {
    it('should delete a server', async () => {
      await service.deleteServer(String(mockServerId));
      expect(mockMcpServersCollection.deleteOne).toHaveBeenCalledWith({
        _id: mockServerId,
      });
    });

    it('should throw NotFoundException if not found', async () => {
      mockMcpServersCollection.deleteOne.mockResolvedValue({
        deletedCount: 0,
      });
      await expect(service.deleteServer(String(mockServerId))).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getOpenAITools', () => {
    it('should return empty array when no tools cached', () => {
      const tools = service.getOpenAITools();
      expect(tools).toEqual([]);
    });
  });

  describe('callTool', () => {
    it('should return error for unknown tool', async () => {
      const result = await service.callTool('nonexistent', {});
      expect(result.isError).toBe(true);
      expect(result.content).toContain('not found');
    });
  });
});
