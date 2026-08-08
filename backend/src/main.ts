import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap(): Promise<void> {
  const logger = new Logger("Bootstrap");
  // ------------------------------------------------------------------
  // App setup
  // ------------------------------------------------------------------
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  // ------------------------------------------------------------------
  // Listen
  // ------------------------------------------------------------------
  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);

  const server = app.getHttpServer();
  const address = server.address();
  const url =
    typeof address === "object" && address !== null
      ? `http://localhost:${address.port}`
      : `http://localhost:${port}`;

  // ------------------------------------------------------------------
  // Startup summary
  // ------------------------------------------------------------------
  logger.log("============================================================");
  logger.log(`  Listening on ${url}`);
  logger.log("============================================================");

  // ------------------------------------------------------------------
  // Graceful shutdown
  // ------------------------------------------------------------------
  const shutdown = async (signal: string): Promise<void> => {
    logger.log("============================================================");
    logger.log(`  Received ${signal} - shutting down gracefully`);
    logger.log("============================================================");
    await app.close();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void bootstrap();
