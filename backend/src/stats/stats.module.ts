import { Module } from "@nestjs/common";
import { CouponsModule } from "../coupons/coupons.module";
import { OrdersModule } from "../orders/orders.module";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";

@Module({
  imports: [OrdersModule, CouponsModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
