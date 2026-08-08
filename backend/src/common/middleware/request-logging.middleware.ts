import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

function formatTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

  return `${day} ${time}`;
}

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(req: Request, _res: Response, next: NextFunction): void {
    const host = req.get("host") ?? "localhost";

    const fullUrl = `${req.protocol}://${host}${req.originalUrl}`;

    this.logger.log(
      `[${formatTimestamp(new Date())}]:[${req.method}]:${fullUrl}`,
    );

    next();
  }
}
