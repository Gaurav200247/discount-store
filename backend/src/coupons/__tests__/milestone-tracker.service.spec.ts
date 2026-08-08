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

  describe("willBreakMilestoneOnNextOrder", () => {
    it("returns true when the next order is the nth order", () => {
      const tracker = makeTracker(3);
      tracker.recordOrder();
      tracker.recordOrder();
      expect(tracker.willBreakMilestoneOnNextOrder()).toBe(true);
    });

    it("returns false when the next order is not a milestone order", () => {
      const tracker = makeTracker(3);
      tracker.recordOrder();
      expect(tracker.willBreakMilestoneOnNextOrder()).toBe(false);
    });

    it("flips every nth order", () => {
      const tracker = makeTracker(3);
      expect(tracker.willBreakMilestoneOnNextOrder()).toBe(false);
      tracker.recordOrder();
      expect(tracker.willBreakMilestoneOnNextOrder()).toBe(false);
      tracker.recordOrder();
      expect(tracker.willBreakMilestoneOnNextOrder()).toBe(true);
      tracker.recordOrder();
      expect(tracker.willBreakMilestoneOnNextOrder()).toBe(false);
      tracker.recordOrder();
      expect(tracker.willBreakMilestoneOnNextOrder()).toBe(false);
      tracker.recordOrder();
      expect(tracker.willBreakMilestoneOnNextOrder()).toBe(true);
    });
  });
});
