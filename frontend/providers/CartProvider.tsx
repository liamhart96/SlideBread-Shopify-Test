import React, { createContext, useContext, useState, useEffect } from "react";

interface CartItem {
  id: number;
  quantity: number;
  // Add other cart item properties you need
}

interface AddToCartItem {
  id: number;
  quantity: number;
}

interface CartContextType {
  cartCount: number;
  items: CartItem[];
  loading: boolean;
  updateCart: () => Promise<void>;
  addToCart: (items: AddToCartItem[]) => Promise<{ success: boolean; error?: string }>;
  // Add other cart methods you'll need
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export function CartProvider({
  children,
  initialCount = 0,
}: {
  children: React.ReactNode;
  initialCount: number;
}) {
  const [cartCount, setCartCount] = useState(initialCount);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const updateCart = async () => {
    setLoading(true);
    try {
      const response = await fetch("/cart.js");
      const cart = await response.json();
      setCartCount(cart.item_count);
      setItems(cart.items);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (
    items: AddToCartItem[]
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const formData = {
        items,
      };

      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || "Error adding item to cart");
      }

      // Update the cart state after adding items
      await updateCart();

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error adding to cart";
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // We'll fetch the cart data on mount, but we won't show loading state
    // since we already have the initial count from Liquid
    const fetchInitialCart = async () => {
      try {
        const response = await fetch("/cart.js");
        const cart = await response.json();
        // Only update if the count has changed from our initial value
        if (cart.item_count !== initialCount) {
          setCartCount(cart.item_count);
        }
        setItems(cart.items);
      } catch (error) {
        console.error("Error fetching initial cart:", error);
      }
    };

    fetchInitialCart();
  }, [initialCount]);

  return (
    <CartContext.Provider value={{ cartCount, items, loading, updateCart, addToCart }}>
      {children}
    </CartContext.Provider>
  );
}
