import { cartService } from "@/services/CartService";

class CartCounterElement extends HTMLElement {
  static elementName = "cart-counter";
  private unsubscribe?: () => void;

  connectedCallback() {
    this.unsubscribe = cartService.subscribe("cart:updated", (cartState) => {
      const count = cartState.item_count;
      this.textContent = count.toString();

      if (count > 0) {
        this.classList.remove("hidden");
      } else {
        this.classList.add("hidden");
      }
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define(CartCounterElement.elementName, CartCounterElement);
