import React, { useRef, useEffect } from "react";
import { twMerge } from "tailwind-merge";

export interface IProductCard {
  title: string;
  price: string;
  isServerRendered?: boolean;
  imageUrl?: string;
  imageAlt?: string;
  url: string;
}

export function ProductCard({
  title,
  price,
  imageUrl,
  imageAlt,
  url,
  isServerRendered,
}: IProductCard) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Effect to trigger the fade-in after the component mounts
  useEffect(() => {
    // Only set data-loaded if it's not server-rendered (i.e., added dynamically)
    if (!isServerRendered && cardRef.current && !cardRef.current.hasAttribute("data-loaded")) {
      // Delay setting loaded slightly to ensure transition runs
      const timer = setTimeout(() => {
        cardRef.current?.setAttribute("data-loaded", "true");
      }, 10); // Small delay
      return () => clearTimeout(timer);
    }
  }, [isServerRendered]);

  return (
    <div
      ref={cardRef}
      className={twMerge(
        "product-card group relative",
        !isServerRendered &&
          "opacity-0 transition-opacity duration-500 ease-in-out data-[loaded=true]:opacity-100"
      )}
    >
      <div className="relative">
        <a href={url} className="block">
          <div className="mb-4 aspect-square overflow-hidden rounded-md bg-gray-100">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={imageAlt || title}
                className="h-full w-full object-cover transition-transform duration-500"
                loading="lazy"
                width={600}
                height={600}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="text-primary">{title}</span>
              </div>
            )}
          </div>
        </a>
      </div>

      <div className="mt-2">
        <a href={url} className="block">
          <h3 className="text-primary group-hover:text-accent font-base text-xl transition-colors">
            {title.toLowerCase()}
          </h3>
          <div className="text-primary font-medium">
            {(() => {
              const cleanedPrice = price.replace(/\s+/g, " ").trim(); // Clean whitespace

              if (cleanedPrice.startsWith("FROM ")) {
                return (
                  <>
                    <span className="mr-1 text-sm text-gray-500">FROM</span>
                    <span>{cleanedPrice.substring(5)}</span>
                  </>
                );
              } else if (cleanedPrice.includes(" ")) {
                const prices = cleanedPrice.split(" ");
                // Check if it looks like a sale price (two parts after split)
                if (prices.length === 2 && prices[0] && prices[1]) {
                  return (
                    <>
                      <span className="mr-2 text-gray-500 line-through">{prices[0]}</span>
                      <span className="text-red-400">{prices[1]}</span>
                    </>
                  );
                } else {
                  // Fallback
                  return <span>{cleanedPrice}</span>;
                }
              } else {
                //  single price format
                return <span>{cleanedPrice}</span>;
              }
            })()}
          </div>
        </a>
      </div>
    </div>
  );
}
