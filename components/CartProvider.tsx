"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  product_id?: string | null;
  variant_id?: string | null;
  name: string;
  slug: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock?: number | null;
  variant_name?: string | null;
  variant_option_label?: string | null;
  variant_option_value?: string | null;
  variant_sku?: string | null;
  product_category?: string | null;
  product_subcategory?: string | null;
  configuration_key?: string | null;
  configuration_quantity?: number | null;
  selected_options?: Record<string, string | number> | null;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = "samora-cart";

function getStockLimit(stock: number | null | undefined) {
  if (stock === null || stock === undefined) return null;

  const normalizedStock = Math.floor(Number(stock));

  if (!Number.isFinite(normalizedStock)) return null;

  return Math.max(normalizedStock, 0);
}

function getSafeQuantity(quantity: number, stock: number | null | undefined) {
  const stockLimit = getStockLimit(stock);
  const safeQuantity = Math.max(1, Math.floor(Number(quantity || 1)));

  if (stockLimit === null) return safeQuantity;
  if (stockLimit <= 0) return 0;

  return Math.min(safeQuantity, stockLimit);
}

function inferProductId(item: CartItem) {
  if (item.product_id) return item.product_id;

  const rawId = String(item.id ?? "");
  return rawId.includes(":") ? rawId.split(":")[0] : rawId;
}

function normalizeSelectedOptions(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      typeof entry === "number" ? entry : String(entry ?? ""),
    ])
  );
}

function normalizeCartItem(item: CartItem) {
  const safeQuantity = getSafeQuantity(item.quantity, item.stock);

  if (safeQuantity <= 0) return null;

  return {
    ...item,
    id: String(item.id),
    product_id: inferProductId(item),
    variant_id: item.variant_id ?? null,
    variant_name: item.variant_name ?? null,
    variant_option_label: item.variant_option_label ?? null,
    variant_option_value: item.variant_option_value ?? null,
    variant_sku: item.variant_sku ?? null,
    product_category: item.product_category ?? null,
    product_subcategory: item.product_subcategory ?? null,
    configuration_key: item.configuration_key ?? null,
    configuration_quantity:
      item.configuration_quantity === null ||
      item.configuration_quantity === undefined
        ? null
        : Number(item.configuration_quantity),
    selected_options: normalizeSelectedOptions(item.selected_options),
    price: Number(item.price ?? 0),
    quantity: safeQuantity,
    stock: item.stock ?? null,
  } satisfies CartItem;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hasLoadedCart, setHasLoadedCart] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as CartItem[];

        if (Array.isArray(parsedCart)) {
          setItems(
            parsedCart
              .filter((item) => item && item.id && item.name)
              .map((item) =>
                normalizeCartItem({
                  ...item,
                  price: Number(item.price ?? 0),
                  quantity: Number(item.quantity ?? 1),
                  stock: item.stock ?? null,
                })
              )
              .filter(Boolean) as CartItem[]
          );
        }
      }
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
    } finally {
      setHasLoadedCart(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedCart) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hasLoadedCart, items]);

  function addItem(item: Omit<CartItem, "quantity">) {
    setItems((currentItems) => {
      const stockLimit = getStockLimit(item.stock);

      if (stockLimit !== null && stockLimit <= 0) {
        return currentItems;
      }

      const existingItem = currentItems.find(
        (cartItem) => cartItem.id === item.id
      );

      if (existingItem) {
        return currentItems.map((cartItem) => {
          if (cartItem.id !== item.id) return cartItem;

          const nextQuantity = getSafeQuantity(
            cartItem.quantity + 1,
            item.stock ?? cartItem.stock
          );

          return {
            ...cartItem,
            ...item,
            quantity: nextQuantity || cartItem.quantity,
          };
        });
      }

      const quantity = getSafeQuantity(1, item.stock);

      if (quantity <= 0) return currentItems;

      return [...currentItems, { ...item, quantity }];
    });
  }

  function removeItem(id: string) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    );
  }

  function updateItemQuantity(id: string, quantity: number) {
    setItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.id !== id) return item;

          const safeQuantity = getSafeQuantity(quantity, item.stock);

          if (safeQuantity <= 0) return null;

          return { ...item, quantity: safeQuantity };
        })
        .filter(Boolean) as CartItem[]
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const totalPrice = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + Number(item.price ?? 0) * item.quantity,
        0
      ),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateItemQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }

  return context;
}
