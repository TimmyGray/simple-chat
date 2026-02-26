import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { DatabaseService } from '../database/database.service';
import { CreateMcpServerDto } from './dto/create-mcp-server.dto';
import { UpdateMcpServerDto } from './dto/update-mcp-server.dto';
import type { McpServerDoc } from '../types/documents';
import {
  getErrorMessage,
  getErrorStack,
} from '../common/utils/get-error-message';

interface McpConnection {
  client: Client;
  transport: StdioClientTransport;
  serverId: string;
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
}

export interface McpToolResult {
  content: string;
  isError: boolean;
}

@Injectable()
export class McpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpService.name);
  private readonly connections = new Map<string, McpConnection>();
  private cachedTools: McpTool[] = [];

  private static readonly TOOL_CALL_TIMEOUT_MS = 30_000;

  constructor(private readonly databaseService: DatabaseService) {}

  async onModuleInit(): Promise<void> {
    await this.connectEnabledServers();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnectAll();
  }

  async getServers(): Promise<McpServerDoc[]> {
    return this.databaseService.mcpServers().find().toArray();
  }

  async getServer(id: string): Promise<McpServerDoc> {
    const server = await this.databaseService
      .mcpServers()
      .findOne({ _id: new ObjectId(id) });
    if (!server) throw new NotFoundException('MCP server not found');
    return server;
  }

  async createServer(dto: CreateMcpServerDto): Promise<McpServerDoc> {
    const now = new Date();
    const doc = {
      name: dto.name,
      command: dto.command,
      args: dto.args,
      ...(dto.env ? { env: dto.env } : {}),
      enabled: dto.enabled ?? true,
      createdAt: now,
      updatedAt: now,
    };
    const result = await this.databaseService.mcpServers().insertOne(doc);
    this.logger.log(`MCP server created: ${dto.name}`);
    if (doc.enabled) {
      await this.connectServer(String(result.insertedId), doc);
    }
    return { _id: result.insertedId, ...doc };
  }

  async updateServer(
    id: string,
    dto: UpdateMcpServerDto,
  ): Promise<McpServerDoc> {
    const server = await this.databaseService
      .mcpServers()
      .findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: { ...dto, updatedAt: new Date() } },
        { returnDocument: 'after' },
      );
    if (!server) throw new NotFoundException('MCP server not found');
    await this.disconnectServer(id);
    if (server.enabled) {
      await this.connectServer(id, server);
    }
    this.logger.log(`MCP server updated: ${server.name}`);
    return server;
  }

  async deleteServer(id: string): Promise<void> {
    await this.disconnectServer(id);
    const result = await this.databaseService
      .mcpServers()
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      throw new NotFoundException('MCP server not found');
    }
    this.logger.log(`MCP server deleted: ${id}`);
  }

  async connectEnabledServers(): Promise<void> {
    const servers = await this.databaseService
      .mcpServers()
      .find({ enabled: true })
      .toArray();
    for (const server of servers) {
      await this.connectServer(String(server._id), server);
    }
    this.logger.log(`Connected to ${this.connections.size} MCP server(s)`);
  }

  async getAvailableTools(): Promise<McpTool[]> {
    if (this.connections.size === 0) return [];
    const tools: McpTool[] = [];
    for (const [serverId, conn] of this.connections) {
      try {
        const result = await conn.client.listTools();
        for (const tool of result.tools) {
          tools.push({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema as Record<string, unknown>,
            serverId,
          });
        }
      } catch (error) {
        this.logger.warn(
          `Failed to list tools from server ${serverId}: ${getErrorMessage(error)}`,
        );
      }
    }
    this.cachedTools = tools;
    return tools;
  }

  getOpenAITools(): Array<{
    type: 'function';
    function: {
      name: string;
      description?: string;
      parameters: Record<string, unknown>;
    };
  }> {
    return this.cachedTools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<McpToolResult> {
    const tool = this.cachedTools.find((t) => t.name === name);
    if (!tool) {
      return { content: `Tool "${name}" not found`, isError: true };
    }
    const conn = this.connections.get(tool.serverId);
    if (!conn) {
      return {
        content: `Server for tool "${name}" is disconnected`,
        isError: true,
      };
    }
    try {
      const result = await Promise.race([
        conn.client.callTool({ name, arguments: args }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `Tool "${name}" timed out after ${McpService.TOOL_CALL_TIMEOUT_MS}ms`,
                ),
              ),
            McpService.TOOL_CALL_TIMEOUT_MS,
          ),
        ),
      ]);
      const textParts = (
        result.content as Array<{ type: string; text?: string }>
      )
        .filter((c) => c.type === 'text' && c.text)
        .map((c) => c.text!);
      return {
        content: textParts.join('\n') || JSON.stringify(result.content),
        isError: (result.isError as boolean | undefined) ?? false,
      };
    } catch (error) {
      this.logger.error(
        `Tool call failed: ${name}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
      return { content: getErrorMessage(error), isError: true };
    }
  }

  private buildSafeEnv(
    serverEnv?: Record<string, string>,
  ): Record<string, string> {
    const safeEnv: Record<string, string> = {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      NODE_ENV: process.env.NODE_ENV ?? 'production',
      LANG: process.env.LANG ?? 'en_US.UTF-8',
    };
    if (serverEnv) {
      Object.assign(safeEnv, serverEnv);
    }
    return safeEnv;
  }

  private async connectServer(id: string, server: McpServerDoc): Promise<void> {
    try {
      const transport = new StdioClientTransport({
        command: server.command,
        args: server.args,
        env: this.buildSafeEnv(server.env),
      });
      const client = new Client({
        name: 'simple-chat',
        version: '1.0.0',
      });
      await client.connect(transport);
      this.connections.set(id, { client, transport, serverId: id });
      this.logger.log(`Connected to MCP server: ${server.name}`);
      await this.getAvailableTools();
    } catch (error) {
      this.logger.error(
        `Failed to connect to MCP server ${server.name}: ${getErrorMessage(error)}`,
        getErrorStack(error),
      );
    }
  }

  private async disconnectServer(id: string): Promise<void> {
    const conn = this.connections.get(id);
    if (!conn) return;
    try {
      await conn.client.close();
    } catch (error) {
      this.logger.warn(
        `Error disconnecting MCP server ${id}: ${getErrorMessage(error)}`,
      );
    }
    this.connections.delete(id);
    this.cachedTools = this.cachedTools.filter((t) => t.serverId !== id);
  }

  private async disconnectAll(): Promise<void> {
    const ids = [...this.connections.keys()];
    for (const id of ids) {
      await this.disconnectServer(id);
    }
  }
}
