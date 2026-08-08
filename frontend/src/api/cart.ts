import { request } from "./client";
import type { Cart } from "@/lib/types";

export function addToCartApi(
  cartId: string | undefined,
  productId: string,
  quantity: number,
) {
  return request<Cart>("/cart/items", {
    method: "POST",
    body: JSON.stringify({ cartId, productId, quantity }),
  });
}

export function getCartApi(cartId: string) {
  return request<Cart>(`/cart/${cartId}`);
}

export function setCartQuantityApi(
  cartId: string,
  productId: string,
  quantity: number,
) {
  return request<Cart>(`/cart/${cartId}/items/${productId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
}

export function removeFromCartApi(cartId: string, productId: string) {
  return request<Cart>(`/cart/${cartId}/items/${productId}`, {
    method: "DELETE",
  });
}

export function clearCartApi(cartId: string) {
  return request<void>(`/cart/${cartId}`, { method: "DELETE" });
}
