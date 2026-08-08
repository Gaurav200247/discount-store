import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { EmptyCartException } from "../exceptions/empty-cart.exception";
import { InsufficientStockException } from "../exceptions/insufficient-stock.exception";
import { InvalidCouponException } from "../exceptions/invalid-coupon.exception";
import { NoMilestonePendingException } from "../exceptions/no-milestone-pending.exception";
import { ProductNotFoundException } from "../exceptions/product-not-found.exception";

const STATUS_BY_EXCEPTION: Record<string, HttpStatus> = {
  EmptyCartException: HttpStatus.BAD_REQUEST,
  InsufficientStockException: HttpStatus.CONFLICT,
  InvalidCouponException: HttpStatus.BAD_REQUEST,
  NoMilestonePendingException: HttpStatus.CONFLICT,
  ProductNotFoundException: HttpStatus.NOT_FOUND,
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const path = request?.url ?? "unknown";

    if (exception instanceof HttpException) {
      this.logger.warn(
        `${exception.getStatus()} on ${path}: ${exception.message}`,
      );
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    if (exception instanceof Error) {
      const status = STATUS_BY_EXCEPTION[exception.constructor.name];
      if (status !== undefined) {
        this.logger.warn(`${status} on ${path}: ${exception.message}`);
        response.status(status).json({
          statusCode: status,
          message: exception.message,
        });
        return;
      }
    }

    this.logger.error(
      `Unhandled exception on ${path}`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      statusCode: status,
      message: "Internal server error",
    });
  }
}
