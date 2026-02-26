import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { McpService } from './mcp.service';
import { CreateMcpServerDto } from './dto/create-mcp-server.dto';
import { UpdateMcpServerDto } from './dto/update-mcp-server.dto';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('api/mcp-servers')
@UseGuards(JwtAuthGuard)
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly mcpService: McpService) {}

  @Get()
  getServers() {
    this.logger.debug('GET /api/mcp-servers');
    return this.mcpService.getServers();
  }

  @Get('tools')
  getTools() {
    this.logger.debug('GET /api/mcp-servers/tools');
    return this.mcpService.getAvailableTools();
  }

  @Get(':id')
  getServer(@Param('id', ParseObjectIdPipe) id: string) {
    this.logger.debug(`GET /api/mcp-servers/${id}`);
    return this.mcpService.getServer(id);
  }

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  createServer(@Body() dto: CreateMcpServerDto) {
    this.logger.log(`Creating MCP server: name="${dto.name}"`);
    return this.mcpService.createServer(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  updateServer(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateMcpServerDto,
  ) {
    this.logger.log(`Updating MCP server ${id}`);
    return this.mcpService.updateServer(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  deleteServer(@Param('id', ParseObjectIdPipe) id: string) {
    this.logger.log(`Deleting MCP server ${id}`);
    return this.mcpService.deleteServer(id);
  }
}
