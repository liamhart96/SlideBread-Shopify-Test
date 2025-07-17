type CartDrawerEventType = "cart:open" | "cart:close" | "cart:toggle";
type CartDrawerCallback = () => void;

// Declare the window interface to include our service
declare global {
  interface Window {
    cartDrawerService: CartDrawerService;
  }
}

class CartDrawerService {
  private static instance: CartDrawerService;
  private eventListeners: {
    [K in CartDrawerEventType]?: CartDrawerCallback[];
  } = {};
  private isOpen = false;

  private constructor() {}

  public static getInstance(): CartDrawerService {
    if (!CartDrawerService.instance) {
      CartDrawerService.instance = new CartDrawerService();
    }
    return CartDrawerService.instance;
  }

  public subscribe(event: CartDrawerEventType, callback: CartDrawerCallback): () => void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event]!.push(callback);

    return () => {
      const index = this.eventListeners[event]?.indexOf(callback) ?? -1;
      if (index !== -1) {
        this.eventListeners[event]?.splice(index, 1);
      }
    };
  }

  private publish(event: CartDrawerEventType): void {
    const callbacks = this.eventListeners[event] || [];
    callbacks.forEach((callback) => {
      callback();
    });
  }

  public isCartOpen(): boolean {
    return this.isOpen;
  }

  public openCart(): void {
    this.isOpen = true;
    this.publish("cart:open");
    document.body.classList.add("overflow-hidden");
  }

  public closeCart(): void {
    this.isOpen = false;
    this.publish("cart:close");
    document.body.classList.remove("overflow-hidden");
  }

  public toggleCart(): void {
    if (this.isOpen) {
      this.closeCart();
    } else {
      this.openCart();
    }
    this.publish("cart:toggle");
  }
}

export const cartDrawerService = CartDrawerService.getInstance();

// Expose the service to the window object
window.cartDrawerService = cartDrawerService;
