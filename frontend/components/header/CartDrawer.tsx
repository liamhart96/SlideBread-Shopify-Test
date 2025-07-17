"use client";

import { useState, useEffect } from "react";
import { twMerge } from "tailwind-merge";

import { ReactCustomElement } from "@/components/base/ReactCustomElement";
import { CartItemList } from "@/components/cart/CartItemList";
import { CloseIcon, ShieldIcon } from "@/components/icons";
import { cartDrawerService } from "@/services/CartDrawerService";
import { cartService } from "@/services/CartService";
import { NumberUtils } from "@/utils/NumberUtils";

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isGuaranteeDialogOpen, setIsGuaranteeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const openUnsubscribe = cartDrawerService.subscribe("cart:open", () => {
      setIsOpen(true);
    });

    const closeUnsubscribe = cartDrawerService.subscribe("cart:close", () => {
      setIsOpen(false);
    });

    const toggleUnsubscribe = cartDrawerService.subscribe("cart:toggle", () => {
      setIsOpen(cartDrawerService.isCartOpen());
    });

    const cartUpdateUnsubscribe = cartService.subscribe("cart:updated", () => {
      forceUpdate((n) => n + 1);
    });

    const cartLoadingUnsubscribe = cartService.subscribe("cart:loading", (data) => {
      setLoading(data.loading);
    });

    return () => {
      openUnsubscribe();
      closeUnsubscribe();
      toggleUnsubscribe();
      cartUpdateUnsubscribe();
      cartLoadingUnsubscribe();
    };
  }, []);

  const handleClose = () => {
    cartDrawerService.closeCart();
  };

  const handleOverlayClick = () => {
    cartDrawerService.closeCart();
  };

  const handleUpdateQuantity = async (id: string, quantity: number) => {
    // @ts-expect-error - CartService type definition expects number, but runtime requires string key
    await cartService.updateItem(id, quantity);
  };

  const handleRemoveItem = async (id: string) => {
    // @ts-expect-error - CartService type definition expects number, but runtime requires string key
    await cartService.removeItem(id);
  };

  const handleGuaranteeClick = () => {
    setIsGuaranteeDialogOpen(true);
  };

  const handleGuaranteeClose = () => {
    setIsGuaranteeDialogOpen(false);
  };

  const cart = cartService.getState();

  return (
    <>
      {/* Guarantee Dialog */}
      <dialog
        open={isGuaranteeDialogOpen}
        className="fixed inset-0 z-[60] m-0 h-full w-full bg-transparent p-0"
        onClick={handleGuaranteeClose}
      >
        <div className="fixed inset-0 bg-white/70" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="m-6 flex min-h-full items-center justify-center">
            <div
              className="relative w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6 flex items-center justify-center">
                <h2 className="text-primary text-xl font-medium">12-month guarantee</h2>
                <button
                  type="button"
                  className="text-primary hover:text-primary-light absolute right-4 top-6 cursor-pointer"
                  onClick={handleGuaranteeClose}
                >
                  <CloseIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </dialog>

      {/* Overlay */}
      <div
        className={twMerge(
          "fixed inset-0 z-50 transition-opacity duration-300",
          isOpen ? "bg-white/70" : "pointer-events-none opacity-0"
        )}
        onClick={handleOverlayClick}
      ></div>

      {/* Cart Drawer */}
      <div
        className={twMerge(
          "fixed inset-y-0 right-0 z-50 w-full max-w-xl transform overflow-y-auto bg-white shadow-xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white px-4 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-primary text-lg font-medium">Your Bag</h2>
              <button
                type="button"
                className="cursor-pointer text-gray-400 hover:text-gray-500"
                onClick={handleClose}
              >
                <span className="sr-only">Close</span>
                <CloseIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Cart Content */}
          <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <div className="border-t-primary h-8 w-8 animate-spin rounded-full border-2 border-gray-300"></div>
              </div>
            ) : !cart || cart.items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center">
                <p className="text-primary mb-4 text-center text-lg font-medium">
                  Your bag is empty
                </p>
                <button onClick={handleClose} className="btn btn-secondary">
                  Continue Shopping
                </button>
              </div>
            ) : (
              <CartItemList
                items={cart.items}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
              />
            )}
          </div>

          {/* Footer */}
          {cart && cart.items.length > 0 && !loading && (
            <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
              <div className="text-primary flex justify-between text-base font-medium">
                <p>Subtotal</p>
                <p>{NumberUtils.formatCurrency(cart.original_total_price)}</p>
              </div>
              {cart.total_discount > 0 && (
                <div className="text-primary flex justify-between text-base font-medium">
                  <p>Discount</p>
                  <p>-{NumberUtils.formatCurrency(cart.total_discount)}</p>
                </div>
              )}
              <div className="text-primary mt-2 flex justify-between text-base font-medium">
                <p>Total</p>
                <p>{NumberUtils.formatCurrency(cart.total_price)}</p>
              </div>
              <p className="mt-0.5 text-sm text-gray-500">
                Shipping and taxes calculated at checkout.
              </p>
              <div className="mt-6">
                <a
                  href="/cart"
                  className="btn btn-secondary flex w-full items-center justify-center"
                >
                  Go To Bag
                </a>
              </div>
              <div className="mt-6 flex justify-center text-center text-sm text-gray-500">
                <p>
                  or{" "}
                  <button
                    type="button"
                    className="text-primary hover:text-primary-light cursor-pointer font-medium"
                    onClick={handleClose}
                  >
                    Continue Shopping
                    <span aria-hidden="true"> &rarr;</span>
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Register the custom element
class CartDrawerElement extends ReactCustomElement {
  static elementName = "cart-drawer";

  connectedCallback() {
    super.connectedCallback();
    this.renderReact(<CartDrawer />);
  }
}

customElements.define(CartDrawerElement.elementName, CartDrawerElement);
