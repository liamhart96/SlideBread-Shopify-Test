import React from "react";
import { createRoot, type Root } from "react-dom/client";

/**
 * Minimal base class for creating custom elements that render React components
 *
 * @example
 * // Usage:
 * class MyElement extends ReactCustomElement {
 *   connectedCallback() {
 *     super.connectedCallback()
 *     this.renderReact(<MyComponent myProp={this.getAttribute('my-prop')} />)
 *   }
 * }
 */
export class ReactCustomElement extends HTMLElement {
  protected root: Root | null = null;

  constructor() {
    super();
    this.registerElement();
  }

  private registerElement() {
    const constructor = this.constructor as CustomElementConstructor;
    const elementClass = constructor as typeof ReactCustomElement & { elementName: string };
    const elementName = elementClass.elementName;

    if (elementName && !customElements.get(elementName)) {
      customElements.define(elementName, constructor);
    }
  }

  static elementName: string;

  connectedCallback() {
    this.root = createRoot(this);
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  protected renderReact(element: React.ReactNode) {
    if (!this.root) return;
    this.root.render(element);
  }
}
