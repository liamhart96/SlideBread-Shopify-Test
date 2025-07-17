"use client";

import type React from "react";
import { useState, useEffect } from "react";

import { ReactCustomElement } from "@/components/base/ReactCustomElement";
import { cartDrawerService } from "@/services/CartDrawerService";
import { cartService } from "@/services/CartService";

interface AddToCartProps {
  variantId: number;
  available: boolean;
}

export function AddToCart({ variantId, available }: AddToCartProps) {
  // const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(cartService.isLoading());

  useEffect(() => {
    const loadingUnsubscribe = cartService.subscribe("cart:loading", (data) => {
      setIsCartLoading(data.loading);
    });

    const errorUnsubscribe = cartService.subscribe("cart:error", (data) => {
      setError(data.message);
    });

    return () => {
      loadingUnsubscribe();
      errorUnsubscribe();
    };
  }, []);

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!available) {
      setError("This product is currently unavailable");
      return;
    }

    setLoading(true);
    setError("");

    const result = await cartService.addItems([
      {
        id: variantId,
        quantity: 1,
      },
    ]);

    if (!result.success && result.error) {
      setError(result.error);
    } else {
      // Open the cart drawer when item is successfully added
      cartDrawerService.openCart();
    }

    setLoading(false);
  };

  return (
    <div>
      <form onSubmit={handleAddToCart} className="space-y-4">
        <button
          type="submit"
          disabled={loading || isCartLoading || !available}
          className={`btn w-full rounded-xl ${
            !available
              ? "btn-primary cursor-not-allowed"
              : loading || isCartLoading
                ? "btn-primary"
                : "btn-primary"
          }`}
        >
          {loading || isCartLoading ? "Adding..." : !available ? "Sold Out" : "Add to Bag"}
        </button>
      </form>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}

class AddToCartElement extends ReactCustomElement {
  static elementName = "add-to-cart";
  private _handleVariantChange: (event: Event) => void;

  constructor() {
    super();
    this._handleVariantChange = (event: Event) => {
      const customEvent = event as CustomEvent<{
        variantId: number;
        variant: { available: boolean }; // Only need availability here
      }>;
      const { variantId: newVariantId, variant } = customEvent.detail;

      this.setAttribute("data-variant-id", newVariantId.toString());
      this.setAttribute("data-available", variant.available.toString()); // Update available attribute too
      this.renderReact(<AddToCart variantId={newVariantId} available={variant.available} />);
    };
  }

  connectedCallback() {
    super.connectedCallback();

    const variantId = Number.parseInt(this.getAttribute("data-variant-id") || "0", 10);
    const available = this.getAttribute("data-available") === "true";

    // Add the event listener
    document.addEventListener("variant:changed", this._handleVariantChange);

    this.renderReact(<AddToCart variantId={variantId} available={available} />);
  }

  disconnectedCallback() {
    // Remove the event listener on cleanup
    document.removeEventListener("variant:changed", this._handleVariantChange);
    super.disconnectedCallback();
  }
}

customElements.define(AddToCartElement.elementName, AddToCartElement);
