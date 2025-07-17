import "inner-image-zoom/lib/styles.min.css";
import Flickity from "flickity";

import { BaseCarousel } from "@/components/common/BaseCarousel";

interface VariantImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export class Gallery extends BaseCarousel {
  private static instance: Gallery;
  private modal: HTMLDialogElement | null = null;
  private mainGallery: Flickity | null = null;
  private navGallery: Flickity | null = null;
  private originalImages: VariantImage[] = [];
  private currentImages: VariantImage[] = [];

  constructor(selector: string) {
    const config: Flickity.Options = {
      prevNextButtons: false,
      pageDots: false,
      imagesLoaded: true,
      cellAlign: "left",
      contain: true,
      groupCells: "100%",
    };
    super(selector, config);

    this.storeOriginalImages();
    this.initializeGalleries();
    this.initializeModal();
    this.initializeVariantListener();
    window.addEventListener("beforeunload", () => this.destroy());
  }

  private storeOriginalImages(): void {
    const imageElements = document.querySelectorAll(".product-gallery-carousel-main img");
    this.originalImages = Array.from(imageElements).map((img) => ({
      src: (img as HTMLImageElement).src,
      alt: (img as HTMLImageElement).alt,
      width: (img as HTMLImageElement).width,
      height: (img as HTMLImageElement).height,
    }));
    this.currentImages = [...this.originalImages];
  }

  private initializeVariantListener(): void {
    // Listen for variant changes from the variant selector
    document.addEventListener("variant:changed", (event: Event) => {
      const customEvent = event as CustomEvent;
      const { variant } = customEvent.detail;

      if (variant.images && variant.images.length > 0) {
        this.updateGalleryImages(variant.images);
      }
    });

    // Listen for custom image changes
    document.addEventListener("gallery:updateImages", (event: Event) => {
      const customEvent = event as CustomEvent;
      const { images } = customEvent.detail;
      if (images && images.length > 0) {
        this.updateGalleryImages(images);
      }
    });
  }

  private updateGalleryImages(imageUrls: string[]): void {
    // Filter out empty or invalid URLs
    const validUrls = imageUrls.filter(
      (url) => url && url.trim() !== "" && url !== "null" && url !== "undefined"
    );

    if (validUrls.length === 0) {
      return;
    }

    const newImages: VariantImage[] = validUrls.map((url, index) => ({
      src: url,
      alt: `Product image ${index + 1}`,
      width: 800,
      height: 800,
    }));

    this.currentImages = newImages;
    this.refreshGalleryWithImages(newImages);
  }

  private resetToOriginalImages(): void {
    // Show all original images
    this.showAllImages(".product-gallery-carousel-main");
    this.showAllImages(".product-gallery-carousel-nav");
    this.showAllImages(".gallery-modal-carousel");

    this.currentImages = [...this.originalImages];
  }

  private showAllImages(selector: string): void {
    const carousel = document.querySelector(selector);
    if (!carousel) return;

    const existingCells = carousel.querySelectorAll(".carousel-cell");
    const existingImages = carousel.querySelectorAll("img");

    // Show all cells and restore original image sources
    existingCells.forEach((cell, index) => {
      (cell as HTMLElement).style.display = "";

      if (index < this.originalImages.length) {
        const img = existingImages[index] as HTMLImageElement;
        let size = "large";
        if (selector.includes("nav")) {
          size = "small";
        } else if (selector.includes("modal")) {
          size = "2048x";
        }
        const imageUrl = this.getImageUrl(this.originalImages[index].src, size);
        img.src = imageUrl;
        img.alt = this.originalImages[index].alt;
      }
    });

    // Refresh Flickity to recalculate positions
    if (selector === ".product-gallery-carousel-main" && this.mainGallery) {
      setTimeout(() => {
        this.mainGallery?.reposition();
      }, 100);
    }

    if (selector === ".product-gallery-carousel-nav" && this.navGallery) {
      setTimeout(() => {
        this.navGallery?.reposition();
      }, 100);
    }
  }

  private refreshGalleryWithImages(images: VariantImage[]): void {
    // Safety check: if no images or empty array, don't update
    if (!images || images.length === 0) {
      return;
    }

    // Filter out invalid images
    const validImages = images.filter((img) => img.src && img.src.trim() !== "");
    if (validImages.length === 0) {
      return;
    }

    try {
      // Instead of rebuilding, just update existing image sources
      this.updateExistingImages(".product-gallery-carousel-main", validImages, "large");
      this.updateExistingImages(".product-gallery-carousel-nav", validImages, "small");
      this.updateExistingImages(".gallery-modal-carousel", validImages, "2048x");
    } catch {
      // Silent error handling
    }
  }

  private updateExistingImages(selector: string, images: VariantImage[], size: string): void {
    const carousel = document.querySelector(selector);
    if (!carousel) {
      return;
    }

    const existingCells = carousel.querySelectorAll(".carousel-cell");
    const existingImages = carousel.querySelectorAll("img");

    // Hide all cells first
    existingCells.forEach((cell) => {
      (cell as HTMLElement).style.display = "none";
    });

    // Show and update only the cells that match our variant images
    images.forEach((variantImage, index) => {
      if (index < existingCells.length) {
        const cell = existingCells[index] as HTMLElement;
        const img = existingImages[index] as HTMLImageElement;

        // Show the cell
        cell.style.display = "";

        // Update the image source
        const imageUrl = this.getImageUrl(variantImage.src, size);
        img.src = imageUrl;
        img.alt = variantImage.alt || `Product image ${index + 1}`;
      }
    });

    // Refresh Flickity to recalculate positions
    if (selector === ".product-gallery-carousel-main" && this.mainGallery) {
      setTimeout(() => {
        this.mainGallery?.reposition();
      }, 100);
    }

    if (selector === ".product-gallery-carousel-nav" && this.navGallery) {
      setTimeout(() => {
        this.navGallery?.reposition();
      }, 100);
    }
  }

  private addGalleryButtons(cell: HTMLElement): void {
    // Zoom button
    const zoomButton = document.createElement("button");
    zoomButton.className =
      "gallery-zoom-button absolute bottom-16 right-4 flex cursor-pointer items-center justify-center rounded-full bg-white/50 p-2 transition-colors duration-200 hover:bg-white/70";
    zoomButton.setAttribute("aria-label", "Enlarge image");
    zoomButton.innerHTML = `<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
    </svg>`;

    // Heart button
    const heartButton = document.createElement("button");
    heartButton.className =
      "absolute bottom-4 right-4 flex cursor-pointer items-center justify-center rounded-full bg-white/50 p-2 transition-colors duration-200 hover:bg-white/70";
    heartButton.setAttribute("aria-label", "Add to favorites");
    heartButton.innerHTML = `<svg class="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
    </svg>`;

    cell.appendChild(zoomButton);
    cell.appendChild(heartButton);

    // Add click event for zoom button
    zoomButton.addEventListener("click", () => {
      this.modal?.showModal();
      this.init();
      if (this.mainGallery) {
        this.select(this.mainGallery.selectedIndex);
      }
    });
  }

  private getImageUrl(src: string, size: string): string {
    // Handle Shopify image URLs
    if (src.includes("shopify")) {
      // Extract the base URL and add size parameter
      const baseUrl = src.split("?")[0];
      return `${baseUrl}?width=${this.getSizePixels(size)}`;
    }
    // For other URLs, return as-is
    return src;
  }

  private getSizePixels(size: string): number {
    const sizeMap: Record<string, number> = {
      small: 200,
      medium: 400,
      large: 800,
      "2048x": 2048,
    };
    return sizeMap[size] || 800;
  }

  private initializeGalleries(): void {
    const navGalleryElement = document.querySelector(
      ".product-gallery-carousel-nav"
    ) as HTMLElement;
    if (!navGalleryElement) {
      return;
    }

    this.navGallery = new Flickity(navGalleryElement, {
      asNavFor: ".product-gallery-carousel-main",
      pageDots: false,
      groupCells: "100%",
      cellAlign: "left",
      prevNextButtons: false,
    });

    const mainGalleryElement = document.querySelector(
      ".product-gallery-carousel-main"
    ) as HTMLElement;
    if (!mainGalleryElement) {
      return;
    }

    this.mainGallery = new Flickity(mainGalleryElement, {
      prevNextButtons: true,
      pageDots: true,
      cellAlign: "left",
    });
  }

  private initializeModal(): void {
    this.modal = document.querySelector(".gallery-modal") as HTMLDialogElement;
    if (!this.modal) return;

    // Handle zoom button clicks
    document.addEventListener("click", (event) => {
      if ((event.target as HTMLElement).closest(".gallery-zoom-button")) {
        this.modal?.showModal();
        this.init();

        // Sync with main gallery's current index
        if (this.mainGallery) {
          this.select(this.mainGallery.selectedIndex);
        }
      }
    });

    const closeButton = this.modal.querySelector(".gallery-modal-close");
    closeButton?.addEventListener("click", () => {
      this.modal?.close();
      this.destroy();
    });

    this.modal.addEventListener("close", () => {
      this.destroy();
    });
  }

  // Public method to update images from external sources
  public updateImages(imageUrls: string[]): void {
    this.updateGalleryImages(imageUrls);
  }

  // Public method to get current images
  public getCurrentImages(): VariantImage[] {
    return this.currentImages;
  }

  static initialize(selector: string): Gallery {
    if (!Gallery.instance) {
      Gallery.instance = new Gallery(selector);
    }
    return Gallery.instance;
  }

  override destroy(): void {
    if (this.mainGallery) {
      this.mainGallery.destroy();
      this.mainGallery = null;
    }
    if (this.navGallery) {
      this.navGallery.destroy();
      this.navGallery = null;
    }
    super.destroy();
  }
}
