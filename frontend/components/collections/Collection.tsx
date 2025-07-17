import { useEffect, useRef } from "react";
import { createRoot, Root } from "react-dom/client";

import { CollectionProvider, useCollection, Product } from "@/providers/CollectionProvider";

import { ProductCard } from "./ProductCard";

function LoadingIndicator() {
  return (
    <div className="flex justify-center py-8">
      <div className="border-primary-600 h-8 w-8 animate-spin rounded-full border-b-2"></div>
    </div>
  );
}

function CollectionInfiniteScroll() {
  const { products, loading, hasMore, loadNextPage, currentPage } = useCollection();
  const observerRef = useRef<IntersectionObserver | null>(null);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !targetRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadNextPage();
        }
      },
      {
        threshold: 0.1,
        rootMargin: "200px",
      }
    );

    observerRef.current.observe(targetRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, loadNextPage]);

  return (
    <div>
      {products.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              title={product.title}
              price={product.price}
              imageUrl={product.featured_image?.src}
              imageAlt={product.featured_image?.alt}
              url={product.url}
              isServerRendered={index < 12}
            />
          ))}
        </div>
      )}

      {loading && <LoadingIndicator />}

      {!hasMore && products.length > 0 && (
        <div className="text-primary py-8 text-center">No more products.</div>
      )}

      <div className="text-primary mt-4 text-center text-sm">
        Page {currentPage}{" "}
        {hasMore && !loading && <span className="text-xs text-gray-400">(Scroll for more)</span>}
      </div>

      <div ref={targetRef} className="mt-4 h-10"></div>
    </div>
  );
}

export class CollectionInfiniteScrollElement extends HTMLElement {
  static elementName = "collection-infinite-scroll";
  private root: Root | null = null;
  private filterTrigger: HTMLElement | null = null;
  private filterClose: HTMLElement | null = null;
  private filterModal: HTMLElement | null = null;
  private filterOverlay: HTMLElement | null = null;
  private desktopFacetsContainer: HTMLElement | null = null;
  private mobileFacetsContent: HTMLElement | null = null;
  private filtersMoved = false;

  private openModalHandler = () => this.openModal();
  private closeModalHandler = () => this.closeModal();

  private activeFiltersObserver: MutationObserver | null = null;

  connectedCallback() {
    if (this.root) return;

    const reactContainer = document.createElement("div");
    reactContainer.style.display = "contents";
    this.appendChild(reactContainer);

    const productsPerPage = parseInt(this.getAttribute("data-products-per-page") || "12", 10);

    // Get initial products from the server-rendered product cards
    const initialProducts: Product[] = [];
    const productGrid = document.getElementById("product-grid");
    if (productGrid) {
      const productCards = productGrid.querySelectorAll(".product-card");
      productCards.forEach((card) => {
        const titleElement = card.querySelector("h3");
        const priceElement = card.querySelector(".product-prices");
        const imageElement = card.querySelector("img");
        const linkElement = card.querySelector("a[href]");

        if (titleElement && priceElement && linkElement) {
          initialProducts.push({
            id: card.getAttribute("data-product-id") || "",
            title: titleElement.textContent?.trim() || "",
            price: priceElement.textContent?.trim() || "",
            url: linkElement.getAttribute("href") || "",
            price_varies: card.getAttribute("data-price-varies") === "true",
            featured_image: {
              src: imageElement?.getAttribute("src") || "",
              alt: imageElement?.getAttribute("alt") || "",
            },
          });
        }
      });
    }

    if (typeof createRoot === "function") {
      this.root = createRoot(reactContainer);
      this.root.render(
        <CollectionProvider productsPerPage={productsPerPage} initialProducts={initialProducts}>
          <CollectionInfiniteScroll />
        </CollectionProvider>
      );
    } else {
      console.error(
        "createRoot is not available. React environment might not be set up correctly."
      );
    }

    requestAnimationFrame(() => {
      this.filterTrigger = document.getElementById("mobile-filter-trigger");
      this.filterClose = document.getElementById("mobile-filter-close");
      this.filterModal = document.getElementById("mobile-filter-modal");
      this.filterOverlay = document.getElementById("mobile-filter-overlay");
      this.desktopFacetsContainer = document.getElementById("desktop-facets-container");
      this.mobileFacetsContent = document.getElementById("mobile-facets-content");
      const activeFiltersContainer =
        this.mobileFacetsContent?.querySelector(".active-filters") ||
        this.desktopFacetsContainer?.querySelector(".active-filters");

      if (this.filterTrigger) {
        this.filterTrigger.addEventListener("click", this.openModalHandler);
      } else {
        console.warn("Mobile filter trigger button not found.");
      }
      if (this.filterClose) {
        this.filterClose.addEventListener("click", this.closeModalHandler);
      }
      if (this.filterOverlay) {
        this.filterOverlay.addEventListener("click", this.closeModalHandler);
      }
      if (activeFiltersContainer) {
        this.setupActiveFiltersObserver(activeFiltersContainer as HTMLElement);
        this.updateFilterButtonState(activeFiltersContainer as HTMLElement);
      } else {
        console.warn("Active filters container not found for observer setup.");
      }
    });
  }

  disconnectedCallback() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
    while (this.firstChild) {
      this.removeChild(this.firstChild);
    }

    // Disconnect observer
    if (this.activeFiltersObserver) {
      this.activeFiltersObserver.disconnect();
      this.activeFiltersObserver = null;
    }

    if (this.filterTrigger) {
      this.filterTrigger.removeEventListener("click", this.openModalHandler);
    }
    if (this.filterClose) {
      this.filterClose.removeEventListener("click", this.closeModalHandler);
    }
    if (this.filterOverlay) {
      this.filterOverlay.removeEventListener("click", this.closeModalHandler);
    }
    this.filtersMoved = false;
  }
  private setupActiveFiltersObserver(container: HTMLElement) {
    this.activeFiltersObserver = new MutationObserver(() => {
      this.updateFilterButtonState(container);
    });

    this.activeFiltersObserver.observe(container, { childList: true, subtree: true });
  }

  private updateFilterButtonState(container: HTMLElement) {
    if (!this.filterTrigger) return;

    const hasActiveFilters = !!container.querySelector('a[href*="collections"]');
    const count = container.querySelectorAll('a[href*="collections"]').length;
    const countSpan = this.filterTrigger.querySelector(".filter-count") as HTMLElement | null;
    const icon = this.filterTrigger.querySelector("svg");

    if (hasActiveFilters) {
      this.filterTrigger.classList.add(
        "bg-secondary",
        "text-white",
        "hover:bg-secondary/90",
        "border-secondary"
      );
      this.filterTrigger.classList.remove(
        "bg-white",
        "text-primary",
        "hover:bg-gray-50",
        "border-gray-300"
      );
      icon?.classList.remove("text-gray-400");
      icon?.classList.add("text-white");

      if (countSpan) {
        countSpan.textContent = `(${count})`;
        countSpan.classList.remove("hidden");
      } else {
        const currentTextNode = Array.from(this.filterTrigger.childNodes).find(
          (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.includes("Filter")
        );
        if (currentTextNode) currentTextNode.textContent = "Filter";
        const newCountSpan = document.createElement("span");
        newCountSpan.className = "filter-count ml-1";
        newCountSpan.textContent = `(${count})`;
        this.filterTrigger.appendChild(newCountSpan);
      }
    } else {
      this.filterTrigger.classList.remove(
        "bg-primary",
        "text-white",
        "hover:bg-primary/90",
        "border-primary"
      );
      this.filterTrigger.classList.add(
        "bg-white",
        "text-primary",
        "hover:bg-gray-50",
        "border-gray-300"
      );
      icon?.classList.remove("text-white");
      icon?.classList.add("text-gray-400");

      if (countSpan) {
        countSpan.classList.add("hidden");
        countSpan.textContent = "(0)";
      }
      const currentTextNode = Array.from(this.filterTrigger.childNodes).find(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.includes("Filter")
      );
      if (currentTextNode) currentTextNode.textContent = "Filter";
    }
  }

  private moveFiltersIfNeeded() {
    if (
      !this.filtersMoved &&
      window.innerWidth < 1024 &&
      this.desktopFacetsContainer &&
      this.mobileFacetsContent
    ) {
      while (this.desktopFacetsContainer.firstChild) {
        this.mobileFacetsContent.appendChild(this.desktopFacetsContainer.firstChild);
      }
      this.filtersMoved = true;
    }
  }

  private openModal() {
    if (!this.filterModal || !this.filterOverlay) return;
    this.moveFiltersIfNeeded();
    this.filterModal.classList.remove("-translate-x-full");
    this.filterModal.classList.add("translate-x-0");
    this.filterOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  private closeModal() {
    if (!this.filterModal || !this.filterOverlay) return;
    this.filterModal.classList.remove("translate-x-0");
    this.filterModal.classList.add("-translate-x-full");
    this.filterOverlay.classList.add("hidden");
    document.body.style.overflow = "";
  }
}

if (customElements.get(CollectionInfiniteScrollElement.elementName)) {
  console.warn(`Custom element ${CollectionInfiniteScrollElement.elementName} already defined.`);
} else {
  customElements.define(
    CollectionInfiniteScrollElement.elementName,
    CollectionInfiniteScrollElement
  );
}
