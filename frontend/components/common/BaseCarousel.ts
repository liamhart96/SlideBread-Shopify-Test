import type Flickity from "flickity";

import { FlickityService } from "@/services/FlickityService";

export abstract class BaseCarousel {
  protected selector: string;
  protected config: Flickity.Options;

  constructor(selector: string, config: Flickity.Options) {
    this.selector = selector;
    this.config = config;
  }

  init(): void {
    FlickityService.init(this.selector, this.config);
  }

  destroy(): void {
    FlickityService.destroy(this.selector);
  }

  protected getInstance(): Flickity | null {
    return FlickityService.getInstance(this.selector);
  }

  select(index: number): void {
    const instance = this.getInstance();
    if (instance) {
      instance.select(index);
    }
  }

  getSelectedIndex(): number {
    const instance = this.getInstance();
    return instance?.selectedIndex ?? 0;
  }

  getTotalSlides(): number {
    const instance = this.getInstance();
    return instance?.slides?.length ?? 0;
  }
}
