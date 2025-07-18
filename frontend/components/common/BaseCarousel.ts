import { Swiper } from "swiper";
import type { SwiperOptions } from "swiper/types";

interface SwiperElement extends HTMLElement {
  swiper?: Swiper;
}

export abstract class BaseCarousel {
  protected selector: string;
  protected config: SwiperOptions;

  constructor(selector: string, config: SwiperOptions) {
    this.selector = selector;
    this.config = config;
  }

  init(): void {
    const element = document.querySelector(this.selector);
    if (element) {
      new Swiper(element as HTMLElement, this.config);
    }
  }

  destroy(): void {
    const element = document.querySelector(this.selector) as SwiperElement;
    if (element && element.swiper) {
      element.swiper.destroy();
    }
  }

  protected getInstance(): Swiper | null {
    const element = document.querySelector(this.selector) as SwiperElement;
    return element?.swiper || null;
  }

  select(index: number): void {
    const instance = this.getInstance();
    if (instance) {
      instance.slideTo(index);
    }
  }
}
