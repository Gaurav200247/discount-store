import { request } from "./client";
import type { Order } from "@/lib/types";

export function checkoutApi(cartId: string, couponCode?: string) {
  return request<Order>("/checkout", {
    method: "POST",
    body: JSON.stringify({ cartId, couponCode }),
  });
}
