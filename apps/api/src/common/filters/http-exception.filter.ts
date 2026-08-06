import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '../../../generated/prisma';

interface ErrorBody {
  message: string;
  errors?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, body } = this.resolve(exception);
    const internalErrorThreshold: number = HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= internalErrorThreshold) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...body,
    });
  }

  private resolve(exception: unknown): { status: number; body: ErrorBody } {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const raw =
        typeof response === 'string'
          ? { message: response }
          : (response as { message: string | string[] });
      const isValidationErrors = Array.isArray(raw.message);

      return {
        status: exception.getStatus(),
        body: {
          message: isValidationErrors
            ? (raw.message as string[]).join(', ')
            : (raw.message as string),
          ...(isValidationErrors ? { errors: raw.message } : {}),
        },
      };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { message: 'Internal server error' },
    };
  }

  private resolvePrismaError(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    body: ErrorBody;
  } {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Prisma re-exports this error class via `export import`, which TS can't fully resolve for lint purposes.
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          body: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            message: `A record with this ${(exception.meta?.target as string[])?.join(', ') ?? 'value'} already exists`,
          },
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          body: { message: 'Record not found' },
        };
      default:
        return {
          status: HttpStatus.BAD_REQUEST,
          body: { message: 'Database request error' },
        };
    }
  }
}
