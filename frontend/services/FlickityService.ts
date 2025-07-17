import Flickity from "flickity";
import "flickity-as-nav-for";
import "flickity-imagesloaded";

export class FlickityService {
  private static instances: Map<string, Flickity> = new Map();

  static init(selector: string, options: Flickity.Options = {}): Flickity | null {
    try {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }

      this.destroy(selector);

      const instance = new Flickity(element, options);
      this.instances.set(selector, instance);
      return instance;
    } catch {
      return null;
    }
  }

  static destroy(selector: string): void {
    try {
      const instance = this.instances.get(selector);
      if (instance) {
        instance.destroy?.();
        this.instances.delete(selector);
      }
    } catch {
      // Silent error handling
    }
  }

  static getInstance(selector: string): Flickity | null {
    return this.instances.get(selector) ?? null;
  }

  static destroyAll(): void {
    this.instances.forEach((instance, selector) => {
      this.destroy(selector);
    });
  }
}

declare global {
  interface Window {
    Flickity: typeof Flickity;
  }
}

window.Flickity = Flickity;
