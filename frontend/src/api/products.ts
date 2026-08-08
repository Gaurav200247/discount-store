import { request } from "./client";
import type { Product } from "@/lib/types";

export function listProductsApi() {
  return request<Product[]>("/products");
}

export function createProductApi(input: {
  name: string;
  priceCents: number;
  stock: number;
}) {
  return request<Product>("/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateProductApi(
  id: string,
  input: Partial<Pick<Product, "name" | "priceCents" | "stock">>,
) {
  return request<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
