import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  addToCartApi,
  ApiError,
  checkoutApi,
  clearCartApi,
  removeFromCartApi,
  setCartQuantityApi,
} from "@/api";
import type { Order } from "@/lib/types";

type QuantityMap = Record<string, number>;

// ---- Local cart state reducers ----
function addQuantity(quantities: QuantityMap, productId: string, quantity: number): QuantityMap {
  return { ...quantities, [productId]: (quantities[productId] ?? 0) + quantity };
}

function setQuantity(quantities: QuantityMap, productId: string, quantity: number): QuantityMap {
  const updated = { ...quantities };
  if (quantity <= 0) delete updated[productId];
  else updated[productId] = quantity;
  return updated;
}

function removeQuantity(quantities: QuantityMap, productId: string): QuantityMap {
  const updated = { ...quantities };
  delete updated[productId];
  return updated;
}

// ---- Server cart sync ----
async function syncAddToCart(
  currentCartId: string | undefined,
  productId: string,
  quantity: number,
  setCartId: (cartId: string | undefined) => void,
): Promise<void> {
  if (currentCartId) {
    await addToCartApi(currentCartId, productId, quantity);
  } else {
    const cart = await addToCartApi(undefined, productId, quantity);
    setCartId(cart.id);
  }
}

async function syncSetQuantity(
  currentCartId: string | undefined,
  productId: string,
  quantity: number,
): Promise<void> {
  if (!currentCartId) return;
  if (quantity <= 0) {
    await removeFromCartApi(currentCartId, productId);
  } else {
    await setCartQuantityApi(currentCartId, productId, quantity);
  }
}

async function syncRemoveFromCart(
  currentCartId: string | undefined,
  productId: string,
): Promise<void> {
  if (!currentCartId) return;
  await removeFromCartApi(currentCartId, productId);
}

async function syncClearCart(
  currentCartId: string | undefined,
  setCartId: (cartId: string | undefined) => void,
): Promise<void> {
  if (!currentCartId) return;
  setCartId(undefined);
  await clearCartApi(currentCartId);
}

async function createCartFromEntries(
  entries: [string, number][],
  setCartId: (cartId: string | undefined) => void,
): Promise<string> {
  const [[firstProductId, firstQuantity], ...rest] = entries;
  const cart = await addToCartApi(undefined, firstProductId, firstQuantity);
  setCartId(cart.id);
  for (const [productId, quantity] of rest) {
    await addToCartApi(cart.id, productId, quantity);
  }
  return cart.id;
}

interface CartContextValue {
  quantitiesByProductId: QuantityMap;
  itemCount: number;
  cartId: string | undefined;

  addProduct: (productId: string, quantity?: number) => void;
  setProductQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;

  checkout: (couponCode?: string) => Promise<Order>;

  syncError: string | null;
  clearSyncError: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const ITEMS_KEY = "discount-store-cart";
const CART_ID_KEY = "discount-store-cart-id";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function CartProvider({ children }: { children: ReactNode }) {
  // ---- State ----
  const [cartId, setCartId] = useState<string | undefined>(() =>
    readStorage<string | undefined>(CART_ID_KEY, undefined),
  );

  const [quantitiesByProductId, setQuantitiesByProductId] = useState<QuantityMap>(() =>
    readStorage<QuantityMap>(ITEMS_KEY, {}),
  );

  const [syncError, setSyncError] = useState<string | null>(null);

  // ---- Refs ----
  const quantitiesByProductRef = useRef(quantitiesByProductId);
  const cartIdRef = useRef(cartId);
  const mutationQueueRef = useRef<Promise<unknown>>(Promise.resolve());

  // ---- Persist to localStorage ----
  useEffect(() => {
    quantitiesByProductRef.current = quantitiesByProductId;
    writeStorage(ITEMS_KEY, quantitiesByProductId);
  }, [quantitiesByProductId]);

  useEffect(() => {
    cartIdRef.current = cartId;
    writeStorage(CART_ID_KEY, cartId);
  }, [cartId]);

  // ---- Error handling ----
  const reportSyncError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 0) {
      setSyncError(
        "Could not reach the store server. Your cart is saved on this device and will sync once the server is back.",
      );
    } else if (err instanceof Error && err.message) {
      setSyncError(err.message);
    } else {
      setSyncError("Could not sync your cart. Please try again.");
    }
  }, []);

  // ---- Backend sync queue ----
  /**
   * Serializes backend cart mutations so they apply in order, even before a
   * cart id exists. `mutation(currentCartId)` receives the current cart id (or
   * undefined) and may create the cart itself. On failure the local cart is
   * rolled back.
   */
  const enqueueMutation = useCallback(
    (
      mutation: (currentCartId: string | undefined) => Promise<void>,
      previousQuantities: QuantityMap,
    ) => {
      mutationQueueRef.current = mutationQueueRef.current.then(async () => {
        try {
          await mutation(cartIdRef.current);
        } catch (err) {
          setQuantitiesByProductId(previousQuantities);
          reportSyncError(err);
        }
      });
    },
    [reportSyncError],
  );

  // ---- Cart mutations ----
  /**
   * Applies an optimistic local update and queues the matching server mutation,
   * rolling back the local cart if the server call fails.
   */
  const applyCartUpdate = useCallback(
    (
      localUpdate: (prev: QuantityMap) => QuantityMap,
      serverMutation: (currentCartId: string | undefined) => Promise<void>,
    ) => {
      const previousQuantities = quantitiesByProductRef.current;
      setQuantitiesByProductId(localUpdate);
      enqueueMutation(serverMutation, previousQuantities);
    },
    [enqueueMutation],
  );

  const addProduct = useCallback(
    (productId: string, quantity = 1) => {
      applyCartUpdate(
        (prev) => addQuantity(prev, productId, quantity),
        (currentCartId) => syncAddToCart(currentCartId, productId, quantity, setCartId),
      );
    },
    [applyCartUpdate],
  );

  const setProductQuantity = useCallback(
    (productId: string, quantity: number) => {
      applyCartUpdate(
        (prev) => setQuantity(prev, productId, quantity),
        (currentCartId) => syncSetQuantity(currentCartId, productId, quantity),
      );
    },
    [applyCartUpdate],
  );

  const removeProduct = useCallback(
    (productId: string) => {
      applyCartUpdate(
        (prev) => removeQuantity(prev, productId),
        (currentCartId) => syncRemoveFromCart(currentCartId, productId),
      );
    },
    [applyCartUpdate],
  );

  const clearCart = useCallback(() => {
    applyCartUpdate(
      () => ({}),
      (currentCartId) => syncClearCart(currentCartId, setCartId),
    );
  }, [applyCartUpdate]);

  const clearSyncError = useCallback(() => setSyncError(null), []);

  // ---- Checkout ----
  /**
   * Returns the existing server cart id, or creates a cart from the local
   * quantities when none was ever created.
   */
  const ensureServerCart = useCallback(async (): Promise<string | undefined> => {
    let currentCartId = cartIdRef.current;
    if (!currentCartId) {
      const productEntries = Object.entries(quantitiesByProductRef.current);
      if (productEntries.length > 0) {
        currentCartId = await createCartFromEntries(productEntries, setCartId);
      }
    }
    return currentCartId;
  }, []);

  /**
   * Runs after any pending cart mutations, ensuring a server-side cart exists.
   * On success the order is returned and local cart state is reset; on failure
   * the error is rethrown for the caller to surface (cart is left intact).
   */
  const checkout = useCallback(
    async (couponCode?: string): Promise<Order> => {
      const checkoutTask = mutationQueueRef.current.then(async () => {
        const currentCartId = await ensureServerCart();
        if (!currentCartId) {
          throw new Error("Your cart is empty");
        }
        const order = await checkoutApi(currentCartId, couponCode);
        setQuantitiesByProductId({});
        setCartId(undefined);
        return order;
      });
      mutationQueueRef.current = checkoutTask.catch(() => undefined);
      return checkoutTask;
    },
    [ensureServerCart],
  );

  // ---- Context value ----
  const value = useMemo(
    () => ({
      quantitiesByProductId,
      itemCount: Object.values(quantitiesByProductId).reduce(
        (sum, quantity) => sum + quantity,
        0,
      ),
      cartId,
      addProduct,
      setProductQuantity,
      removeProduct,
      clearCart,
      checkout,
      syncError,
      clearSyncError,
    }),
    [
      quantitiesByProductId,
      cartId,
      syncError,
      addProduct,
      setProductQuantity,
      removeProduct,
      clearCart,
      clearSyncError,
      checkout,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }

  return ctx;
}
