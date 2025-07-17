import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface Product {
  id: string;
  title: string;
  price: string;
  url: string;
  price_varies?: boolean;
  featured_image?: {
    src: string;
    alt?: string;
  };
}

interface CollectionContextType {
  products: Product[];
  loading: boolean;
  hasMore: boolean;
  loadNextPage: () => Promise<void>;
  currentPage: number;
}

const CollectionContext = createContext<CollectionContextType>({
  products: [],
  loading: false,
  hasMore: false,
  loadNextPage: async () => {},
  currentPage: 1,
});

export const useCollection = () => useContext(CollectionContext);

interface CollectionProviderProps {
  children: React.ReactNode;
  productsPerPage?: number;
  initialProducts?: Product[];
}

export function CollectionProvider({
  children,
  productsPerPage = 12,
  initialProducts = [],
}: CollectionProviderProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [currentSearchParams, setCurrentSearchParams] = useState("");

  const buildFetchUrl = useCallback(
    (pageNumber: number, searchParamsString: string) => {
      const url = new URL(window.location.pathname, window.location.origin);
      const params = new URLSearchParams(searchParamsString);
      params.set("page", pageNumber.toString());
      params.set("view", "ajax");
      if (productsPerPage) {
        params.set("per_page", productsPerPage.toString());
      }
      url.search = params.toString();
      return url.toString();
    },
    [productsPerPage]
  );

  const loadPageByUrl = useCallback(async (url: string) => {
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return {
        products: data.products || [],
        nextUrl: data.next_url || null,
        currentPage: data.current_page || null,
      };
    } catch (error) {
      console.error("Error fetching products:", error);
      setHasMore(false);
      return {
        products: [],
        nextUrl: null,
        currentPage: null,
      };
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  }, []);

  const loadInitialPage = useCallback(
    async (searchParamsString: string) => {
      if (initialProducts.length === 0) {
        setLoading(true);
      }

      const currentUrl = buildFetchUrl(1, searchParamsString);
      const result = await loadPageByUrl(currentUrl);
      setHasMore(!!result.nextUrl);
      setPage(result.currentPage || 1);

      if (initialProducts.length === 0) {
        setLoading(false);
      }
    },
    [buildFetchUrl, loadPageByUrl, initialProducts]
  );

  const loadNextPage = useCallback(async () => {
    if (loading || !hasMore) return;

    const nextUrl = buildFetchUrl(page + 1, currentSearchParams);
    const result = await loadPageByUrl(nextUrl);

    setProducts((prevProducts) => {
      const existingIds = new Set(prevProducts.map((p) => p.id));
      const newUniqueProducts = result.products.filter((p: Product) => !existingIds.has(p.id));
      return [...prevProducts, ...newUniqueProducts];
    });

    setPage(result.currentPage || page + 1);
    setHasMore(!!result.nextUrl);
  }, [loading, hasMore, page, currentSearchParams, buildFetchUrl, loadPageByUrl]);

  useEffect(() => {
    const handleUrlChange = () => {
      const newSearchParamsString = window.location.search;
      if (newSearchParamsString !== currentSearchParams) {
        setCurrentSearchParams(newSearchParamsString);
        loadInitialPage(newSearchParamsString);
      }
    };

    window.addEventListener("popstate", handleUrlChange);

    const initialSearchParams = window.location.search;
    setCurrentSearchParams(initialSearchParams);
    loadInitialPage(initialSearchParams);

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadInitialPage]);

  return (
    <CollectionContext.Provider
      value={{
        products,
        loading,
        hasMore,
        loadNextPage,
        currentPage: page,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}
