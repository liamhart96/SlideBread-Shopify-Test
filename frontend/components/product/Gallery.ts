import { Swiper } from "swiper";
import { Navigation, Thumbs, Mousewheel, Zoom } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "swiper/css/zoom";

interface VariantImage {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export class Gallery {
  private static instance: Gallery;
  private mainSwiper: Swiper | null = null;
  private navSwiper: Swiper | null = null;
  private originalImages: VariantImage[] = [];
  private currentImages: VariantImage[] = [];
  private isVertical: boolean = true;

  constructor() {
    this.storeOriginalImages();
    this.initializeGalleries();
    this.initializeVariantListener();
    window.addEventListener("beforeunload", () => this.destroy());
  }

  private storeOriginalImages(): void {
    const imageElements = document.querySelectorAll(
      ".product-gallery-carousel-main .swiper-slide img"
    );
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
      // If no valid variant images, reset to show all original images
      this.resetToOriginalImages();
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
    this.currentImages = [...this.originalImages];
    this.refreshGalleryWithImages(this.originalImages);
  }

  private refreshGalleryWithImages(images: VariantImage[]): void {
    // Update main gallery
    this.updateSwiperImages(".product-gallery-carousel-main", images, "large");

    // Update nav gallery
    this.updateSwiperImages(".product-gallery-carousel-nav", images, "small");

    // Re-establish thumbs relationship and update active thumbnail after both galleries are updated
    setTimeout(() => {
      if (this.mainSwiper && this.navSwiper) {
        // Force update both swipers
        this.mainSwiper.update();
        this.navSwiper.update();

        // Reset to first slide and update active thumbnail
        this.mainSwiper.slideTo(0);
        this.updateActiveThumbnail();
      }
    }, 100);
  }

  private updateSwiperImages(selector: string, images: VariantImage[], size: string): void {
    const swiperContainer = document.querySelector(selector);
    if (!swiperContainer) return;

    const swiperWrapper = swiperContainer.querySelector(".swiper-wrapper");
    if (!swiperWrapper) return;

    // Clear existing slides
    swiperWrapper.innerHTML = "";

    // Add new slides
    images.forEach((image) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";

      if (selector === ".product-gallery-carousel-main") {
        // Add zoom container for main gallery
        const zoomContainer = document.createElement("div");
        zoomContainer.className = "swiper-zoom-container";

        const img = document.createElement("img");
        img.src = this.getImageUrl(image.src, size);
        img.alt = image.alt;
        img.className = "h-full w-full object-cover";
        img.loading = "lazy";

        zoomContainer.appendChild(img);
        slide.appendChild(zoomContainer);
      } else {
        // Regular structure for nav gallery
        const img = document.createElement("img");
        img.src = this.getImageUrl(image.src, size);
        img.alt = image.alt;
        img.className = "h-full w-full object-cover";
        img.loading = "lazy";

        slide.appendChild(img);
      }

      swiperWrapper.appendChild(slide);
    });

    // Update Swiper instances
    if (selector === ".product-gallery-carousel-main" && this.mainSwiper) {
      this.mainSwiper.update();
    }
    if (selector === ".product-gallery-carousel-nav" && this.navSwiper) {
      this.navSwiper.update();
    }
  }

  private getImageUrl(src: string, size: string): string {
    // Handle Shopify image URLs
    if (src.includes("shopify")) {
      const baseUrl = src.split("?")[0];
      return `${baseUrl}?width=${this.getSizePixels(size)}`;
    }
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
    const mainGalleryElement = document.querySelector(
      ".product-gallery-carousel-main"
    ) as HTMLElement;
    const navGalleryElement = document.querySelector(
      ".product-gallery-carousel-nav"
    ) as HTMLElement;

    if (!mainGalleryElement || !navGalleryElement) {
      return;
    }

    // Check if we're on mobile
    const isMobile = window.innerWidth < 768;

    // Initialize navigation gallery first
    this.navSwiper = new Swiper(navGalleryElement, {
      modules: [Navigation, Thumbs, Mousewheel, Zoom],
      direction: isMobile ? "horizontal" : "vertical",
      slidesPerView: isMobile ? "auto" : 5,
      spaceBetween: isMobile ? 0 : 20,
      watchSlidesProgress: true,
      centeredSlides: false,
      mousewheel: !isMobile,
      freeMode: true,
      on: {
        init: () => {
          navGalleryElement.classList.remove("gallery-loading");
          navGalleryElement.classList.add("gallery-loaded");
        },
      },
    });

    // Initialize main gallery
    this.mainSwiper = new Swiper(mainGalleryElement, {
      modules: [Navigation, Thumbs, Mousewheel, Zoom],
      direction: isMobile ? "horizontal" : this.isVertical ? "vertical" : "horizontal",
      slidesPerView: 1,
      spaceBetween: 0,
      centeredSlides: true,
      mousewheel: !isMobile
        ? {
            forceToAxis: true,
            sensitivity: 1,
          }
        : false,
      zoom: {
        maxRatio: 3, // Maximum zoom level (3x)
        minRatio: 1, // Minimum zoom level (1x = no zoom)
        toggle: true, // Enable double-tap to zoom
      },
      thumbs: {
        swiper: this.navSwiper,
      },
      on: {
        init: () => {
          mainGalleryElement.classList.remove("gallery-loading");
          mainGalleryElement.classList.add("gallery-loaded");

          // Force update thumbs after initialization
          setTimeout(() => {
            if (this.mainSwiper && this.navSwiper) {
              this.mainSwiper.update();
              this.navSwiper.update();
              this.updateActiveThumbnail();
            }
          }, 100);
        },
        slideChange: () => {
          // Handle slide change events
          this.onSlideChange();
        },
      },
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      const newIsMobile = window.innerWidth < 768;
      if (newIsMobile !== isMobile) {
        this.destroy();
        this.initializeGalleries();
      }
    });
  }

  private reinitializeGalleries(): void {
    this.destroy();
    this.initializeGalleries();
  }

  private onSlideChange(): void {
    // Ensure active thumbnail is properly highlighted
    this.updateActiveThumbnail();
  }

  private updateActiveThumbnail(): void {
    if (!this.mainSwiper || !this.navSwiper) return;
    const activeIndex = this.mainSwiper.activeIndex;
    const navSlides = this.navSwiper.slides;

    // Remove active class from all thumbnails
    navSlides.forEach((slide) => {
      slide.classList.remove("swiper-slide-thumb-active");
    });

    // Add active class to current thumbnail
    if (navSlides[activeIndex]) {
      navSlides[activeIndex].classList.add("swiper-slide-thumb-active");
    }
  }

  // Public method to update images from external sources
  public updateImages(imageUrls: string[]): void {
    this.updateGalleryImages(imageUrls);
  }

  // Public method to get current images
  public getCurrentImages(): VariantImage[] {
    return this.currentImages;
  }

  // Public method to toggle vertical sliding
  public toggleVerticalSliding(enable: boolean = true): void {
    this.isVertical = enable;

    if (this.mainSwiper) {
      this.mainSwiper.destroy();
      this.initializeGalleries();
    }
  }

  static initialize(): Gallery {
    if (!Gallery.instance) {
      Gallery.instance = new Gallery();
    }
    return Gallery.instance;
  }

  destroy(): void {
    if (this.mainSwiper) {
      this.mainSwiper.destroy();
      this.mainSwiper = null;
    }
    if (this.navSwiper) {
      this.navSwiper.destroy();
      this.navSwiper = null;
    }
  }
}
