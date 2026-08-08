import { request } from "./client";
import type { Order } from "@/lib/types";

export function listOrdersApi() {
  return request<Order[]>("/orders");
}
