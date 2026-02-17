"use client";

import { Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useCart } from "./cart_context";

export function AppSidebar() {
  const { items, itemCount, subtotal, setQuantity, removeItem, clearCart } = useCart();

  return (
    <Sidebar side="left">
      <SidebarHeader className="border-sidebar-border border-b px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-5" />
            <p className="text-sm font-semibold">Cart</p>
          </div>
          <span className="bg-sidebar-accent text-sidebar-accent-foreground rounded-full px-2 py-0.5 text-xs font-medium">
            {itemCount}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="p-3">
          {items.length === 0 ? (
            <div className="border-sidebar-border bg-sidebar-accent/40 rounded-lg border p-4 text-sm">
              Your cart is empty.
            </div>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="border-sidebar-border bg-sidebar-accent/40 rounded-lg border p-2"
                >
                  <div className="flex items-start gap-2">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-14 w-14 rounded-md object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-xs">
                        ${item.price.toFixed(2)} each
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon-xs"
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <X />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-sidebar-border border-t px-4 py-3">
        <div className="text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold">${subtotal.toFixed(2)}</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={items.length === 0}
          onClick={clearCart}
          className="w-full"
        >
          <Trash2 />
          Clear cart
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
