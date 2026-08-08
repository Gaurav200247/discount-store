import { Module } from "@nestjs/common";
import { ConfigModule } from "../config/config.module";
import { CouponsRepository } from "./repo/coupons.repository";
import { CouponsService } from "./coupons.service";
import { MilestoneTrackerService } from "./milestone-tracker.service";

@Module({
  imports: [ConfigModule],
  providers: [CouponsService, CouponsRepository, MilestoneTrackerService],
  exports: [CouponsService, CouponsRepository, MilestoneTrackerService],
})
export class CouponsModule {}
