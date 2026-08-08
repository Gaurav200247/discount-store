import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createProductApi,
  getDiscountConfigApi,
  getStatsApi,
  listOrdersApi,
  listProductsApi,
  updateDiscountConfigApi,
  updateProductApi,
} from "@/api";
import type { Product } from "@/lib/types";

export function useProducts() {
  return useQuery({ queryKey: ["products"], queryFn: listProductsApi });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductApi,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: { id: string } & Partial<
      Pick<Product, "name" | "priceCents" | "stock">
    >) => updateProductApi(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useStats() {
  return useQuery({ queryKey: ["stats"], queryFn: getStatsApi });
}

export function useOrders() {
  return useQuery({ queryKey: ["orders"], queryFn: listOrdersApi });
}

export function useDiscountConfig() {
  return useQuery({
    queryKey: ["discount-config"],
    queryFn: getDiscountConfigApi,
  });
}

export function useUpdateDiscountConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDiscountConfigApi,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["discount-config"] }),
  });
}
