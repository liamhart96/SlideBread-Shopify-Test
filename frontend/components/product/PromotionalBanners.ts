interface ProductVariant {
  id: number;
  price: string;
  compare_at_price?: string;
}

interface VariantChangedEvent extends CustomEvent {
  detail: {
    variantId: number;
    variant: ProductVariant;
  };
}

/**
 * Handles dynamic updates to promotional banners when product variants change
 */
class PromotionalBannersController {
  constructor() {
    this.init();
  }

  private init(): void {
    // Listen for variant change events
    document.addEventListener(
      "variant:changed",
      this.handleVariantChange.bind(this) as EventListener
    );

    // Handle initial state on page load
    this.handleInitialState();
  }

  private handleInitialState(): void {
    // Use a retry mechanism to wait for banners to be rendered
    this.waitForBannersAndUpdate();
  }

  private waitForBannersAndUpdate(retryCount = 0): void {
    const maxRetries = 10;
    const retryDelay = 100; // 100ms

    // Check if we have promotional banners
    const overstockBanners = document.querySelectorAll('[data-dynamic-banner="overstock"]');

    if (overstockBanners.length > 0) {
      // Banners found, proceed
      this.updateInitialBannerState();
    } else if (retryCount < maxRetries) {
      // Banners not found, retry after delay
      setTimeout(() => {
        this.waitForBannersAndUpdate(retryCount + 1);
      }, retryDelay);
    }
  }

  private updateInitialBannerState(): void {
    // Check if we have a variant selector on the page
    const variantSelector = document.querySelector("variant-selector");
    if (!variantSelector) return;

    // Get initial variant data from the variant selector element
    const initialVariantId = variantSelector.getAttribute("data-initial-variant-id");
    const variantsJson = variantSelector.getAttribute("data-variants");

    if (initialVariantId && variantsJson) {
      try {
        const variants = JSON.parse(variantsJson) as ProductVariant[];
        const currentVariant = variants.find((v) => v.id === parseInt(initialVariantId, 10));

        if (currentVariant) {
          // Update banners based on current variant
          const overstockBanners = document.querySelectorAll('[data-dynamic-banner="overstock"]');
          overstockBanners.forEach((banner) => {
            this.updateOverstockBanner(banner as HTMLElement, currentVariant);
          });
        }
      } catch (error) {
        console.warn("Failed to parse initial variant data:", error);
      }
    }
  }

  private handleVariantChange(event: Event): void {
    const variantEvent = event as VariantChangedEvent;
    const { variant } = variantEvent.detail;

    // Find all dynamic overstock banners
    const overstockBanners = document.querySelectorAll('[data-dynamic-banner="overstock"]');

    overstockBanners.forEach((banner) => {
      this.updateOverstockBanner(banner as HTMLElement, variant);
    });
  }

  private updateOverstockBanner(banner: HTMLElement, variant: ProductVariant): void {
    const price = parseFloat(variant.price) / 100;
    const compareAtPrice = variant.compare_at_price
      ? parseFloat(variant.compare_at_price) / 100
      : null;

    if (compareAtPrice && compareAtPrice > price) {
      // Calculate discount percentage
      const discountPercentage = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);

      // Update banner text and show it
      banner.textContent = `Overstock Sale: ${discountPercentage}% Off`;
      banner.style.display = "block";
    } else {
      // Hide banner if no discount
      banner.style.display = "none";
    }
  }
}

function initializePromotionalBanners() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      new PromotionalBannersController();
    });
  } else {
    new PromotionalBannersController();
  }
}

initializePromotionalBanners();

export default PromotionalBannersController;
