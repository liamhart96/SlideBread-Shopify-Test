import React, { useState, useEffect, useRef } from "react";

import { ReactCustomElement } from "@/components/base/ReactCustomElement";
import { ShieldIcon } from "@/components/icons";
import { cartService, CartItem, CartState } from "@/services/CartService";
import { NumberUtils } from "@/utils/NumberUtils";

interface CartItemListProps {
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
}

export function CartItemList({ items, onUpdateQuantity, onRemoveItem }: CartItemListProps) {
  return (
    <div className="flow-root">
      <ul className="-my-6 divide-y divide-gray-200">
        {items.map((item) => (
          <li key={item.key} className="flex py-6">
            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100">
                  <span className="text-sm text-gray-400">No image</span>
                </div>
              )}
            </div>

            <div className="ml-4 flex flex-1 flex-col">
              <div>
                <div className="text-primary flex justify-between text-base font-medium">
                  <h3>
                    <a href={item.url}>{item.title}</a>
                  </h3>
                  {/* Use item.final_price which likely represents the price * quantity */}
                  <p className="ml-4">{NumberUtils.formatCurrency(item.final_price)}</p>
                </div>
                <div className="text-primary flex justify-between text-base font-medium">
                  {item.variant_title && (
                    <p className="mt-1 text-sm text-gray-500">{item.variant_title}</p>
                  )}
                </div>
              </div>
              <div className="flex flex-1 items-end justify-between text-sm">
                <div className="flex items-center">
                  <button
                    type="button"
                    className="cursor-pointer rounded-l-md border border-r-0 border-gray-300 px-2 py-1 text-gray-500 hover:bg-gray-50"
                    onClick={() => onUpdateQuantity(item.key, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="w-10 border-y border-gray-300 py-1 text-center">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    className="cursor-pointer rounded-r-md border border-l-0 border-gray-300 px-2 py-1 text-gray-500 hover:bg-gray-50"
                    onClick={() => onUpdateQuantity(item.key, item.quantity + 1)}
                  >
                    +
                  </button>
                </div>

                <div className="flex">
                  <button
                    type="button"
                    className="text-primary hover:text-primary-light cursor-pointer font-medium"
                    onClick={() => onRemoveItem(item.key)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Function to safely parse initial cart state from embedded JSON
const getInitialCartState = (): CartState | null => {
  try {
    const scriptElement = document.getElementById("initial-cart-state");
    if (scriptElement?.textContent) {
      const parsedState = JSON.parse(scriptElement.textContent);
      // Basic validation to ensure it looks like a cart state object
      if (parsedState && typeof parsedState === "object" && Array.isArray(parsedState.items)) {
        return parsedState as CartState;
      }
    }
  } catch {
    // Silent error handling
  }
  return null;
};

function CartItemListWrapper() {
  const [cartState, setCartState] = useState<CartState | null>(() => getInitialCartState());
  const [loading, setLoading] = useState(false);
  const initialLoadComplete = useRef(cartState !== null);

  const updateExternalPrice = (price: number) => {
    const priceElement = document.querySelector("[data-cart-price]");
    if (priceElement) {
      priceElement.textContent = NumberUtils.formatCurrency(price);
    }
  };

  const updateCheckoutButtonState = (isEmpty: boolean) => {
    const checkoutButton = document.querySelector(
      "[data-cart-checkout-button]"
    ) as HTMLButtonElement | null;
    if (checkoutButton) {
      checkoutButton.disabled = isEmpty;
    }
  };

  useEffect(() => {
    if (!initialLoadComplete.current) {
      const currentCartServiceState = cartService.getState();
      if (currentCartServiceState && currentCartServiceState.items.length > 0) {
        setCartState(currentCartServiceState);
        updateExternalPrice(currentCartServiceState.total_price);
        updateCheckoutButtonState(currentCartServiceState.items.length === 0);
        initialLoadComplete.current = true;
      } else {
        setLoading(true);
        updateCheckoutButtonState(true);
        cartService.fetchCart().then((fetchedCart) => {
          if (fetchedCart) {
            setCartState(fetchedCart);
            updateExternalPrice(fetchedCart.total_price);
            updateCheckoutButtonState(fetchedCart.items.length === 0);
          } else {
            // If fetch also fails or returns empty, set to empty state
            setCartState({
              items: [],
              item_count: 0,
              total_price: 0,
              original_total_price: 0,
              total_discount: 0,
              currency: "",
              note: null,
              attributes: {},
            });
            updateExternalPrice(0);
            updateCheckoutButtonState(true);
          }
          setLoading(false);
          initialLoadComplete.current = true;
        });
      }
    } else {
      cartService.fetchCart();
    }

    // Subscribe to future updates from cartService
    const cartUpdateUnsubscribe = cartService.subscribe("cart:updated", (newState) => {
      setCartState(newState);
      updateExternalPrice(newState.total_price);
      updateCheckoutButtonState(newState.items.length === 0);
    });

    const cartLoadingUnsubscribe = cartService.subscribe("cart:loading", (data) => {
      if (!initialLoadComplete.current) {
        setLoading(data.loading);
      }
    });

    return () => {
      cartUpdateUnsubscribe();
      cartLoadingUnsubscribe();
    };
  }, []);

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    // @ts-expect-error - CartService type definition expects number, but runtime requires string key
    await cartService.updateItem(id, quantity);
  };

  const handleRemoveItem = async (id: string) => {
    // @ts-expect-error - CartService type definition expects number, but runtime requires string key
    await cartService.removeItem(id);
  };

  // Render logic adjustments:
  if (loading && !initialLoadComplete.current) {
    return <div className="p-6 text-center">Loading cart items...</div>;
  }

  if (!cartState || cartState.items.length === 0) {
    updateExternalPrice(0);
    updateCheckoutButtonState(true);
    return <div className="p-6 text-center">Your cart is empty.</div>;
  }

  return (
    <CartItemList
      items={cartState.items}
      onUpdateQuantity={handleUpdateQuantity}
      onRemoveItem={handleRemoveItem}
    />
  );
}

// Register the custom element using the wrapper
class CartItemListElement extends ReactCustomElement {
  static elementName = "cart-item-list";

  connectedCallback() {
    super.connectedCallback();
    // Render the wrapper component which handles state
    this.renderReact(<CartItemListWrapper />);
  }
}

customElements.define(CartItemListElement.elementName, CartItemListElement);
