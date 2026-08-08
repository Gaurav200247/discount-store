import { Injectable, Logger } from "@nestjs/common";
import { DiscountConfigService } from "../config/discount.config";

@Injectable()
export class MilestoneTrackerService {
  private readonly logger = new Logger(MilestoneTrackerService.name);

  private orderCount = 0;

  constructor(private readonly config: DiscountConfigService) {}

  recordOrder(): void {
    this.orderCount += 1;

    if (this.orderCount % this.config.n === 0) {
      this.logger.log(
        `Order counter at ${this.orderCount}: milestone ${this.orderCount / this.config.n} reached`,
      );
    }
  }

  currentMilestone(): number {
    return Math.floor(this.orderCount / this.config.n);
  }

  /** True when the very next checkout will break a milestone (order #n, #2n, ...). */
  willBreakMilestoneOnNextOrder(): boolean {
    return (this.orderCount + 1) % this.config.n === 0;
  }
}
