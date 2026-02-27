import type { Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import {
  SSE_ERROR_CODE,
  type StreamEvent,
} from './interfaces/stream-event.interface';
import { getErrorMessage } from '../common/utils/get-error-message';

const STREAM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export async function handleSseStream(
  req: Request,
  res: Response,
  logger: Logger,
  logContext: string,
  createStream: (signal: AbortSignal) => AsyncGenerator<StreamEvent>,
): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const abortController = new AbortController();
  req.on('close', () => abortController.abort());

  const streamTimeout = setTimeout(() => {
    logger.warn(`Stream timeout for ${logContext}`);
    if (!res.writableEnded) {
      writeSseError(res, 'Stream timeout', SSE_ERROR_CODE.STREAM_TIMEOUT);
      res.end();
    }
    abortController.abort();
  }, STREAM_TIMEOUT_MS);

  try {
    const stream = createStream(abortController.signal);
    await consumeStreamAsSSE(stream, res);
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    logger.error(`SSE stream failed for ${logContext}: ${errorMessage}`);
    if (!res.writableEnded) {
      writeSseError(res, errorMessage, SSE_ERROR_CODE.INTERNAL_ERROR);
    }
  } finally {
    clearTimeout(streamTimeout);
    if (!res.writableEnded) {
      res.end();
    }
  }
}

async function consumeStreamAsSSE(
  stream: AsyncGenerator<StreamEvent>,
  res: Response,
): Promise<void> {
  for await (const event of stream) {
    if (res.writableEnded) break;

    switch (event.type) {
      case 'content':
        res.write(`data: ${JSON.stringify({ content: event.content })}\n\n`);
        break;
      case 'tool_call':
        res.write(
          `data: ${JSON.stringify({ tool_call: { name: event.name, arguments: event.arguments } })}\n\n`,
        );
        break;
      case 'tool_result':
        res.write(
          `data: ${JSON.stringify({ tool_result: { name: event.name, content: event.content, isError: event.isError } })}\n\n`,
        );
        break;
      case 'done':
        if (event.usage) {
          res.write(`data: ${JSON.stringify({ usage: event.usage })}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        break;
      case 'error':
        writeSseError(res, event.message, event.code);
        break;
    }
  }
}

function writeSseError(res: Response, msg: string, code: string): void {
  const payload = { error: msg, code };
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}
