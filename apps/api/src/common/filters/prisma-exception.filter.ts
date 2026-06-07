import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Response } from "express";

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientValidationError,
    host: ArgumentsHost
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Database error";
    let code = "DB_ERROR";

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case "P2002":
          status = HttpStatus.CONFLICT;
          message = "A record with this value already exists";
          code = "DUPLICATE_RECORD";
          break;
        case "P2025":
          status = HttpStatus.NOT_FOUND;
          message = "Record not found";
          code = "NOT_FOUND";
          break;
        case "P2003":
          status = HttpStatus.BAD_REQUEST;
          message = "Foreign key constraint violation";
          code = "FK_CONSTRAINT";
          break;
        default:
          this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);
      }
    } else {
      this.logger.error(`Prisma validation error: ${exception.message}`);
      status = HttpStatus.BAD_REQUEST;
      message = "Invalid data provided";
      code = "VALIDATION_ERROR";
    }

    response.status(status).json({
      success: false,
      error: { code, message },
    });
  }
}
