import { Module } from "@nestjs/common";
import { ConfigController } from "./config.controller";
import { DiscountConfigService, ENV } from "./discount.config";

@Module({
  controllers: [ConfigController],
  providers: [
    DiscountConfigService,
    {
      provide: ENV,
      useValue: process.env,
    },
  ],
  exports: [DiscountConfigService],
})
export class ConfigModule {}
