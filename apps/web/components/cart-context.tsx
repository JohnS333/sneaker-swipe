"use client";

import React from "react";

export interface CartItemInput {
  id: string | number;
  brand: string;
  name: string;
  size: number;
  type: string;
  image: string;
  price: number;
}

export interface CartItem extends CartItemInput {
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: CartItemInput) => void;
  removeItem: (itemId: string | number) => void;
  setQuantity: (itemId: string | number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);

  const addItem = React.useCallback((item: CartItemInput) => {
    setItems((prev) => {
      const existing = prev.find((entry) => entry.id === item.id);
      if (!existing) {
        return [...prev, { ...item, quantity: 1 }];
      }

      return prev.map((entry) =>
        entry.id === item.id
          ? { ...entry, quantity: entry.quantity + 1 }
          : entry
      );
    });
  }, []);

  const removeItem = React.useCallback((itemId: string | number) => {
    setItems((prev) => prev.filter((entry) => entry.id !== itemId));
  }, []);

  const setQuantity = React.useCallback((itemId: string | number, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) {
        return prev.filter((entry) => entry.id !== itemId);
      }

      return prev.map((entry) =>
        entry.id === itemId ? { ...entry, quantity } : entry
      );
    });
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = React.useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const subtotal = React.useMemo(
    () => items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );

  const value = React.useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      setQuantity,
      clearCart,
    }),
    [items, itemCount, subtotal, addItem, removeItem, setQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider.");
  }

  return context;
}
