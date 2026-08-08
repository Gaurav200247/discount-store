import { Injectable, Logger } from "@nestjs/common";
import { DiscountConfigService } from "../config/discount.config";

@Injectable()
export class MilestoneTrackerService {
  private readonly logger = new Logger(MilestoneTrackerService.name);

  private orderCount = 0;
  private lastIssuedMilestone = 0;

  constructor(private readonly config: DiscountConfigService) {}

  recordOrder(): void {
    this.orderCount += 1;

    if (this.orderCount % this.config.n === 0) {
      this.logger.log(
        `Order counter at ${this.orderCount}: milestone ${this.orderCount / this.config.n} is now pending`,
      );
    }
  }

  claimNextMilestone(): number | null {
    const currentMilestone = Math.floor(this.orderCount / this.config.n);

    if (this.lastIssuedMilestone < currentMilestone) {
      this.lastIssuedMilestone += 1;
      this.logger.log(`Claimed milestone ${this.lastIssuedMilestone}`);
      return this.lastIssuedMilestone;
    }

    this.logger.verbose("No milestone pending to claim");

    return null;
  }

  currentMilestone(): number {
    return Math.floor(this.orderCount / this.config.n);
  }
}
