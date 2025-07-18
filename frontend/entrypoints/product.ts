import { Gallery } from "@/components/product/Gallery";

// Initialize gallery when DOM is ready
function initializeGallery() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      Gallery.initialize();
    });
  } else {
    Gallery.initialize();
  }
}

initializeGallery();

// Import other components
import "@/components/product/AddToCart";
import "@/components/product/Countdown";
import "@/components/product/VariantSelector";
