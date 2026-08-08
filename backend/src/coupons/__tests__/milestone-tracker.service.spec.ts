import { DiscountConfigService } from "../../config/discount.config";
import { MilestoneTrackerService } from "../milestone-tracker.service";

function makeTracker(n = 5): MilestoneTrackerService {
  const config = new DiscountConfigService({ DISCOUNT_N: String(n) });
  return new MilestoneTrackerService(config);
}

describe("MilestoneTrackerService", () => {
  describe("recordOrder", () => {
    it("starts with no milestones reached", () => {
      const tracker = makeTracker();
      expect(tracker.currentMilestone()).toBe(0);
    });

    it("reaches a milestone on every nth order", () => {
      const tracker = makeTracker(3);
      tracker.recordOrder();
      tracker.recordOrder();
      expect(tracker.currentMilestone()).toBe(0);

      tracker.recordOrder();
      expect(tracker.currentMilestone()).toBe(1);
    });
  });

  describe("claimNextMilestone", () => {
    it("returns null when no milestone is pending", () => {
      const tracker = makeTracker();
      expect(tracker.claimNextMilestone()).toBeNull();
    });

    it("claims the milestone after the nth order", () => {
      const tracker = makeTracker(3);
      for (let i = 0; i < 3; i += 1) {
        tracker.recordOrder();
      }
      expect(tracker.claimNextMilestone()).toBe(1);
    });

    it("claims milestones sequentially, never skipping ahead", () => {
      const tracker = makeTracker(3);
      for (let i = 0; i < 6; i += 1) {
        tracker.recordOrder();
      }
      expect(tracker.claimNextMilestone()).toBe(1);
      expect(tracker.claimNextMilestone()).toBe(2);
      expect(tracker.claimNextMilestone()).toBeNull();
    });
  });
});
