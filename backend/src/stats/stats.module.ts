import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { CouponsModule } from "../coupons/coupons.module";
import { OrdersModule } from "../orders/orders.module";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";

@Module({
  imports: [OrdersModule, CouponsModule, ConfigModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
