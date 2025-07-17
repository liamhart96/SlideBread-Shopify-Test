export type CartEventType =
  | "cart:updated"
  | "cart:error"
  | "cart:loading"
  | "item:added"
  | "item:removed"
  | "item:updated";

export interface CartItem {
  id: number;
  quantity: number;
  key: string;
  title: string;
  price: number;
  line_price: number;
  final_price: number;
  variant_id: number;
  product_id: number;
  image: string | null;
  handle: string;
  product_title: string;
  variant_title: string | null;
  properties: Record<string, string | null> | null;
  discounts: Array<{ amount: number; title: string }> | [];
  url: string;
}

export interface CartState {
  items: CartItem[];
  item_count: number;
  total_price: number;
  original_total_price: number;
  total_discount: number;
  currency: string;
  note: string | null;
  attributes: Record<string, string | null>;
}

export interface CartErrorData {
  message: string;
  error: Error | unknown;
}

export interface CartLoadingData {
  loading: boolean;
}

export interface ItemAddedData {
  items: Array<{ id: number; quantity: number }>;
  result: unknown;
}

export interface ItemUpdatedData {
  id: number;
  quantity: number;
  cart: CartState;
}

export interface EventDataMap {
  "cart:updated": CartState;
  "cart:error": CartErrorData;
  "cart:loading": CartLoadingData;
  "item:added": ItemAddedData;
  "item:updated": ItemUpdatedData;
  "item:removed": ItemUpdatedData;
}

export type CartEventCallback<T extends CartEventType> = (data: EventDataMap[T]) => void;

class CartService {
  private static instance: CartService;
  private eventListeners: {
    [K in CartEventType]?: Array<CartEventCallback<K>>;
  } = {};
  private cartState: CartState = {
    items: [],
    item_count: 0,
    total_price: 0,
    original_total_price: 0,
    total_discount: 0,
    currency: "",
    note: null,
    attributes: {},
  };
  private loading = false;

  private constructor() {
    const cartCountElement = document.querySelector("[data-cart-count]");
    if (cartCountElement) {
      this.cartState.item_count = parseInt(
        cartCountElement.getAttribute("data-cart-count") || "0",
        10
      );
    }

    this.fetchCart();
  }

  public static getInstance(): CartService {
    if (!CartService.instance) {
      CartService.instance = new CartService();
    }
    return CartService.instance;
  }

  private getTypedListeners<T extends CartEventType>(event: T): Array<CartEventCallback<T>> {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    return this.eventListeners[event]!;
  }

  public subscribe<T extends CartEventType>(event: T, callback: CartEventCallback<T>): () => void {
    const callbacks = this.getTypedListeners(event);
    callbacks.push(callback);

    return () => {
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  private publish<T extends CartEventType>(event: T, data: EventDataMap[T]): void {
    const callbacks = this.getTypedListeners(event);
    callbacks.forEach((callback) => {
      callback(data);
    });
  }

  public getState(): CartState {
    return { ...this.cartState };
  }

  public isLoading(): boolean {
    return this.loading;
  }

  public async fetchCart(): Promise<CartState> {
    this.setLoading(true);

    try {
      const response = await fetch("/cart.js");
      const cart = await response.json();

      this.updateCartState(cart);
      return this.cartState;
    } catch (error) {
      this.publish("cart:error", { message: "Error fetching cart", error });
      console.error("Error fetching cart:", error);
      return this.cartState;
    } finally {
      this.setLoading(false);
    }
  }

  public async addItems(
    items: { id: number; quantity: number }[]
  ): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true);

    try {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || "Error adding items to cart");
      }

      const result = await response.json();

      await this.fetchCart();

      this.publish("item:added", { items, result });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error adding to cart";
      this.publish("cart:error", { message: errorMessage, error });
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this.setLoading(false);
    }
  }

  public async updateItem(
    id: number,
    quantity: number
  ): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true);

    try {
      const response = await fetch("/cart/change.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, quantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || "Error updating cart item");
      }

      const cart = await response.json();
      this.updateCartState(cart);

      this.publish("item:updated", { id, quantity, cart });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error updating cart item";
      this.publish("cart:error", { message: errorMessage, error });
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this.setLoading(false);
    }
  }

  public async removeItem(id: number): Promise<{ success: boolean; error?: string }> {
    return this.updateItem(id, 0);
  }

  public async updateNote(note: string): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true);

    try {
      const response = await fetch("/cart/update.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || "Error updating cart note");
      }

      const cart = await response.json();
      this.updateCartState(cart);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error updating cart note";
      this.publish("cart:error", { message: errorMessage, error });
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this.setLoading(false);
    }
  }

  public async clearCart(): Promise<{ success: boolean; error?: string }> {
    this.setLoading(true);

    try {
      const response = await fetch("/cart/clear.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || "Error clearing cart");
      }

      const cart = await response.json();
      this.updateCartState(cart);

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error clearing cart";
      this.publish("cart:error", { message: errorMessage, error });
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      this.setLoading(false);
    }
  }

  private updateCartState(cart: CartState): void {
    this.cartState = cart;
    this.publish("cart:updated", cart);

    const cartCountElements = document.querySelectorAll("[data-cart-count]");
    cartCountElements.forEach((element) => {
      element.textContent = String(cart.item_count);
      element.setAttribute("data-cart-count", String(cart.item_count));
    });
  }

  private setLoading(isLoading: boolean): void {
    this.loading = isLoading;
    this.publish("cart:loading", { loading: isLoading });
  }
}

export const cartService = CartService.getInstance();
