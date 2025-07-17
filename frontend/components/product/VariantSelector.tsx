import { useState, useEffect, useRef } from "react";
import { twMerge } from "tailwind-merge";

import { ReactCustomElement } from "@/components/base/ReactCustomElement";

interface ProductVariant {
  id: number;
  title: string;
  available: boolean;
  options: string[];
  price: string;
  compare_at_price?: string;
  featured_image?: {
    src: string;
    alt: string;
  } | null;
  images?: string[]; // Array of image URLs for this variant
}

interface ProductOption {
  name: string;
  values: string[];
  selected_value?: string;
  best_value?: string;
  color_config?: Record<string, ColorConfig>; // Custom color configuration
}

interface ColorConfig {
  hex?: string; // HEX color code
  image?: string; // Image URL for swatch
  name: string; // Display name
}

interface VariantSelectorProps {
  variants: ProductVariant[];
  options: ProductOption[];
  initialVariantId: number;
  onVariantChange: (variantId: number, variant: ProductVariant) => void;
  onImageChange?: (images: string[]) => void; // Callback for image changes
}

interface DropdownProps {
  label: string;
  selectedValue: string;
  options: string[];
  onSelect: (value: string) => void;
  className?: string;
}

interface ColorSelectorProps {
  label: string;
  selectedValue: string;
  options: string[];
  onSelect: (value: string) => void;
  className?: string;
}

function CustomDropdown({ label, selectedValue, options, onSelect, className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={twMerge("relative flex items-center gap-2", className)} ref={dropdownRef}>
      <label className="font-heading-serif block">{label}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="focus:border-primary focus:ring-primary flex w-fit items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-left shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-opacity-20"
      >
        <span className="font-heading-serif text-sm">{selectedValue}</span>
        <svg
          className={twMerge(
            "h-5 w-5 text-gray-400 transition-transform",
            isOpen ? "rotate-180" : ""
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={twMerge(
                  "w-full px-4 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none",
                  option === selectedValue
                    ? "bg-primary text-primary bg-opacity-10 font-medium"
                    : "text-gray-900"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorSelector({
  label,
  selectedValue,
  options,
  onSelect,
  className,
  colorConfig,
}: ColorSelectorProps & { colorConfig?: Record<string, ColorConfig> }) {
  const getColorClass = (colorName: string): string => {
    // Check if we have custom color config
    if (colorConfig && colorConfig[colorName]) {
      const config = colorConfig[colorName];
      if (config.hex) {
        return `bg-[${config.hex}]`;
      }
      if (config.image) {
        return "bg-cover bg-center";
      }
    }

    // Fallback to default color mapping
    const colorMap: Record<string, string> = {
      black: "bg-black",
      white: "bg-white border-gray-300",
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      purple: "bg-purple-500",
      pink: "bg-pink-500",
      gray: "bg-gray-500",
      grey: "bg-gray-500",
      brown: "bg-amber-700",
      orange: "bg-orange-500",
      navy: "bg-navy-900",
      beige: "bg-amber-100",
      tan: "bg-yellow-600",
      silver: "bg-gray-300",
      gold: "bg-yellow-400",
    };

    const lowerColorName = colorName.toLowerCase();
    return colorMap[lowerColorName] || "bg-gray-400";
  };

  const getSwatchStyle = (colorName: string): React.CSSProperties => {
    if (colorConfig && colorConfig[colorName]) {
      const config = colorConfig[colorName];
      // Prefer images over hex colors for better visual experience
      if (config.image) {
        return {
          backgroundImage: `url(${config.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        };
      }
      if (config.hex) {
        return { backgroundColor: config.hex };
      }
    }
    return {};
  };

  const shouldUseInlineStyle = (colorName: string): boolean => {
    return !!(
      colorConfig &&
      colorConfig[colorName] &&
      (colorConfig[colorName].hex || colorConfig[colorName].image)
    );
  };

  return (
    <div className={twMerge("", className)}>
      <label className="font-heading-serif mb-2 block">
        {label}:{" "}
        <span className="font-heading-serif">
          {colorConfig?.[selectedValue]?.name || selectedValue}
        </span>
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = selectedValue === option;
          const colorClass = getColorClass(option);
          const swatchStyle = getSwatchStyle(option);
          const useInlineStyle = shouldUseInlineStyle(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              style={useInlineStyle ? swatchStyle : undefined}
              className={twMerge(
                "relative h-10 w-10 rounded-full border-2 transition-all hover:scale-105",
                useInlineStyle ? "bg-cover bg-center" : colorClass,
                isSelected
                  ? "border-gray-900 ring-2 ring-gray-900 ring-offset-2"
                  : "border-gray-200 hover:border-gray-300"
              )}
              title={colorConfig?.[option]?.name || option}
            >
              <span className="sr-only">{colorConfig?.[option]?.name || option}</span>
              {/* Add checkmark for selected state on image swatches */}
              {isSelected && useInlineStyle && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white drop-shadow-md"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function VariantSelector({
  variants,
  options,
  initialVariantId,
  onVariantChange,
  onImageChange,
}: VariantSelectorProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    const initialVariant = variants.find((v) => v.id === initialVariantId);
    if (initialVariant && options.length > 0) {
      const initialSelectedOptions: Record<string, string> = {};

      options.forEach((option, index) => {
        if (initialVariant.options[index]) {
          initialSelectedOptions[option.name] = initialVariant.options[index];
        }
      });

      setSelectedOptions(initialSelectedOptions);

      // Trigger image change for initial variant
      if (onImageChange && initialVariant.images) {
        onImageChange(initialVariant.images);
      }
    }
  }, [initialVariantId, variants, options, onImageChange]);

  const handleOptionChange = (optionName: string, value: string) => {
    const newSelectedOptions = {
      ...selectedOptions,
      [optionName]: value,
    };

    setSelectedOptions(newSelectedOptions);

    const matchedVariant = findVariantByOptions(newSelectedOptions);

    if (matchedVariant) {
      onVariantChange(matchedVariant.id, matchedVariant);

      // Trigger image change callback if variant has specific images
      if (onImageChange && matchedVariant.images) {
        onImageChange(matchedVariant.images);
      }
    }
  };

  const findVariantByOptions = (
    selectedOpts: Record<string, string>
  ): ProductVariant | undefined => {
    return variants.find((variant) => {
      return options.every((option, index) => {
        const optionValue = selectedOpts[option.name];
        return variant.options[index] === optionValue;
      });
    });
  };

  const isColorOption = (optionName: string): boolean => {
    return (
      optionName.toLowerCase().includes("color") || optionName.toLowerCase().includes("colour")
    );
  };

  if (options.length <= 0 || variants.length <= 0) {
    return null;
  }

  return (
    <div className="variant-selectors space-y-6">
      {options.map((option) => {
        const selectedValue = selectedOptions[option.name] || option.values[0];

        if (isColorOption(option.name)) {
          return (
            <ColorSelector
              key={option.name}
              label={option.name}
              selectedValue={selectedValue}
              options={option.values}
              onSelect={(value) => handleOptionChange(option.name, value)}
              colorConfig={option.color_config}
              className="w-full"
            />
          );
        } else {
          return (
            <CustomDropdown
              key={option.name}
              label={option.name}
              selectedValue={selectedValue}
              options={option.values}
              onSelect={(value) => handleOptionChange(option.name, value)}
              className="w-full"
            />
          );
        }
      })}
    </div>
  );
}

class VariantSelectorElement extends ReactCustomElement {
  static elementName = "variant-selector";

  connectedCallback() {
    super.connectedCallback();

    try {
      const initialVariantId = parseInt(this.getAttribute("data-initial-variant-id") || "0", 10);
      const variantsJson = this.getAttribute("data-variants") || "[]";
      const optionsJson = this.getAttribute("data-options") || "[]";

      const variants: ProductVariant[] = JSON.parse(variantsJson);
      const options: ProductOption[] = JSON.parse(optionsJson);

      const handleVariantChange = (variantId: number, variant: ProductVariant) => {
        // Update URL with new variant ID
        const url = new URL(window.location.href);
        url.searchParams.set("variant", variantId.toString());
        window.history.replaceState({}, "", url.toString());

        // Update product price
        const priceContainer = document.querySelector("[data-product-price]")?.parentElement;
        if (priceContainer) {
          const price = parseFloat(variant.price) / 100; // Convert cents to pounds
          const compareAtPrice = variant.compare_at_price
            ? parseFloat(variant.compare_at_price) / 100
            : null;

          const formatPrice = (priceValue: number) => {
            return new Intl.NumberFormat("en-GB", {
              style: "currency",
              currency: "GBP",
              minimumFractionDigits: priceValue % 1 === 0 ? 0 : 2,
              maximumFractionDigits: 2,
            }).format(priceValue);
          };

          // Check if this is a sale (compare_at_price exists and is greater than price)
          if (compareAtPrice && compareAtPrice > price) {
            // Calculate savings percentage
            const savingsPercentage = Math.round(((compareAtPrice - price) / compareAtPrice) * 100);

            // Create sale price structure
            priceContainer.innerHTML = `
              <div class="flex items-center">
                <span class="text-3xl text-gray-500 line-through mr-2 font-heading-serif" data-product-price>
                  ${formatPrice(compareAtPrice)}
                </span>
                <span class="text-3xl font-heading-serif" data-product-price-sale>
                  ${formatPrice(price)}
                </span>
                <span class="absolute -top-2 -right-2 ml-2 bg-red-600 border border-red-800 text-xs text-white px-2 py-1 rounded-md uppercase">
                  Save ${savingsPercentage}%
                </span>
              </div>
            `;
          } else {
            // Regular price display
            priceContainer.innerHTML = `
              <span class="text-3xl font-heading-serif" data-product-price>
                ${formatPrice(price)}
              </span>
            `;
          }
        }

        // Dispatch variant change event for gallery
        const event = new CustomEvent("variant:changed", {
          detail: {
            variantId,
            variant,
          },
          bubbles: true,
        });

        this.dispatchEvent(event);
      };

      const handleImageChange = (images: string[]) => {
        // Dispatch image change event for gallery
        const event = new CustomEvent("gallery:updateImages", {
          detail: {
            images,
          },
          bubbles: true,
        });

        document.dispatchEvent(event);
      };

      this.renderReact(
        <VariantSelector
          variants={variants}
          options={options}
          initialVariantId={initialVariantId}
          onVariantChange={handleVariantChange}
          onImageChange={handleImageChange}
        />
      );
    } catch {
      // Silent error handling
    }
  }
}

customElements.define(VariantSelectorElement.elementName, VariantSelectorElement);
