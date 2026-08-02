"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartProduct = {
  id: string;
  slug: string;
  title: string;
  price: string;
  imageUrl: string | null;
  type: string;
};

type CartContextValue = {
  customer: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string | null;
  } | null;
  items: CartProduct[];
  loading: boolean;
  refresh: () => Promise<void>;
  addToCart: (productId: string) => Promise<{ ok: boolean; message?: string; requireAuth?: boolean }>;
  removeFromCart: (productId: string) => Promise<void>;
  claimFree: (productId: string) => Promise<{ ok: boolean; message?: string; requireAuth?: boolean }>;
  logout: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<CartContextValue["customer"]>(null);
  const [items, setItems] = useState<CartProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const meRes = await fetch("/api/auth", { credentials: "include" });
      const meData = await meRes.json();
      setCustomer(meData.customer ?? null);

      if (meData.customer) {
        const cartRes = await fetch("/api/cart", { credentials: "include" });
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setItems(
            (cartData.items ?? []).map(
              (row: { product: CartProduct }) => row.product,
            ),
          );
        } else {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    } catch {
      setCustomer(null);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addToCart = useCallback(
    async (productId: string) => {
      const res = await fetch("/api/cart", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        return { ok: false, requireAuth: true, message: data.message };
      }
      if (!res.ok) {
        return { ok: false, message: data.message ?? "تعذّر الإضافة للسلة" };
      }
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      await refresh();
    },
    [refresh],
  );

  const claimFree = useCallback(
    async (productId: string) => {
      const res = await fetch("/api/shop/claim", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        return { ok: false, requireAuth: true, message: data.message };
      }
      if (!res.ok) {
        return { ok: false, message: data.message ?? "تعذّر الحصول على المنتج" };
      }
      await refresh();
      return { ok: true };
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth", { method: "DELETE", credentials: "include" });
    setCustomer(null);
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      customer,
      items,
      loading,
      refresh,
      addToCart,
      removeFromCart,
      claimFree,
      logout,
    }),
    [
      customer,
      items,
      loading,
      refresh,
      addToCart,
      removeFromCart,
      claimFree,
      logout,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useShop() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}
