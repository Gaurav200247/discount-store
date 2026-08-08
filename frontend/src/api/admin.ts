import { request } from "./client";
import type { Coupon, DiscountConfig, Stats } from "@/lib/types";

export function getStatsApi() {
  return request<Stats>("/admin/stats");
}

export function generateCouponApi() {
  return request<Coupon>("/admin/coupons", { method: "POST" });
}

export function getDiscountConfigApi() {
  return request<DiscountConfig>("/admin/config");
}

export function updateDiscountConfigApi(input: Partial<DiscountConfig>) {
  return request<DiscountConfig>("/admin/config", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
