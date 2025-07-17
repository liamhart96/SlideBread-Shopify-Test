"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import { twMerge } from "tailwind-merge";

import { ChevronIcon, CloseIcon } from "@/components/icons";

interface MenuLink {
  url: string;
  title: string;
  level: number;
  children: MenuLink[];
  id: string;
  isOpen: boolean;
}

interface HeaderDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  menuLinks?: MenuLink[];
}

interface AccordionItemProps {
  title: string;
  url: string;
  children?: MenuLink[];
  hasChildren: boolean;
  isOpen: boolean;
  onToggle: (id: string) => void;
  id: string;
  index?: number;
  parentIsOpen?: boolean;
}

function AccordionItem({
  title,
  url,
  children,
  hasChildren,
  isOpen,
  onToggle,
  id,
  index = 0,
  parentIsOpen = true,
}: AccordionItemProps) {
  return (
    <div
      className={twMerge(
        "border-b border-gray-100 transition-all duration-200 last:border-b-0",
        parentIsOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
      )}
      style={{ transitionDelay: `${index * 25}ms` }}
    >
      {hasChildren ? (
        <>
          <button
            className="text-primary flex w-full items-center justify-between rounded-md px-4 py-3 text-base font-medium transition-colors hover:bg-gray-50"
            onClick={() => onToggle(id)}
          >
            {title}
            <ChevronIcon
              className={twMerge(
                "h-5 w-5 text-gray-500 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
          <div
            className={twMerge(
              "overflow-hidden transition-all duration-200 ease-in-out",
              isOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
            )}
          >
            <div className="my-1 ml-2 border-l border-gray-50 pl-2">
              {children?.map((child, childIndex) => (
                <div
                  key={child.id}
                  className={twMerge(
                    "transition-all duration-200",
                    isOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                  )}
                  style={{ transitionDelay: isOpen ? `${childIndex * 25}ms` : "0ms" }}
                >
                  <AccordionItem
                    key={child.id}
                    title={child.title}
                    url={child.url}
                    children={child.children}
                    hasChildren={!!child.children?.length}
                    isOpen={child.isOpen}
                    onToggle={onToggle}
                    id={child.id}
                    parentIsOpen={isOpen}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <a
          href={url}
          className="text-primary block rounded-md px-4 py-3 text-base font-medium transition-colors hover:bg-gray-50"
        >
          {title}
        </a>
      )}
    </div>
  );
}

function MainNavDrawer({ isOpen, onClose, menuLinks = [] }: HeaderDrawerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [menuAnimationComplete, setMenuAnimationComplete] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [openAccordions, setOpenAccordions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setMenuAnimationComplete(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
          setTimeout(() => {
            setMenuAnimationComplete(true);
          }, 100);
        });
      });
      document.body.style.overflow = "hidden";
    } else {
      setIsAnimating(false);
      setMenuAnimationComplete(false);
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const toggleAccordion = (id: string) => {
    setOpenAccordions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const menuHierarchy = menuLinks.reduce<(MenuLink & { children: MenuLink[] })[]>(
    (acc, link, index) => {
      const item = {
        ...link,
        children: [],
        id: `${link.level}-${index}-${link.url}`,
        isOpen: openAccordions.has(`${link.level}-${index}-${link.url}`),
      };
      if (link.level === 1) {
        acc.push(item);
      } else if (link.level === 2) {
        const lastLevel1 = acc[acc.length - 1];
        if (lastLevel1 && lastLevel1.children) {
          lastLevel1.children.push(item);
        }
      } else if (link.level === 3) {
        const lastLevel1 = acc[acc.length - 1];
        if (lastLevel1?.children?.length > 0) {
          const lastLevel2 = lastLevel1.children[lastLevel1.children.length - 1];
          if (lastLevel2 && lastLevel2.children) {
            lastLevel2.children.push(item);
          }
        }
      }
      return acc;
    },
    []
  );

  return (
    <>
      <div
        className={twMerge(
          "bg-primary fixed inset-0 z-50 transition-opacity duration-200 ease-in-out",
          isAnimating ? "pointer-events-auto opacity-50" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={twMerge(
          "fixed inset-y-0 left-0 z-50 w-full max-w-sm transform bg-white shadow-xl transition-all duration-200 ease-out",
          isAnimating ? "translate-x-0" : "-translate-x-full"
        )}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
            <h2 id="drawer-title" className="text-primary text-lg font-semibold">
              Menu
            </h2>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200"
              aria-label="Close menu"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <nav className="space-y-1">
              {menuHierarchy.map((level1, index) => (
                <AccordionItem
                  key={level1.id}
                  title={level1.title}
                  url={level1.url}
                  children={level1.children}
                  hasChildren={level1.children.length > 0}
                  isOpen={openAccordions.has(level1.id)}
                  onToggle={toggleAccordion}
                  id={level1.id}
                  index={index}
                  parentIsOpen={menuAnimationComplete}
                />
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}

class MainNavDrawerElement extends HTMLElement {
  private root: ReturnType<typeof createRoot> | null = null;
  private isOpen = false;

  connectedCallback() {
    const menuButton = document.getElementById("mobile-menu-button");
    if (menuButton) {
      menuButton.addEventListener("click", this.handleMenuButtonClick);
    }

    const cartButton = document.getElementById("cart-button");
    if (cartButton) {
      cartButton.addEventListener("click", this.handleCartButtonClick);
    }

    this.root = createRoot(this);
    this.render();
  }

  disconnectedCallback() {
    const menuButton = document.getElementById("mobile-menu-button");
    if (menuButton) {
      menuButton.removeEventListener("click", this.handleMenuButtonClick);
    }

    const cartButton = document.getElementById("cart-button");
    if (cartButton) {
      cartButton.removeEventListener("click", this.handleCartButtonClick);
    }

    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  private handleMenuButtonClick = () => {
    this.isOpen = true;
    this.render();
  };

  private handleCartButtonClick = () => {
    if (window.cartDrawerService) {
      window.cartDrawerService.openCart();
    }
  };

  private handleClose = () => {
    this.isOpen = false;
    this.render();
  };

  private render() {
    if (!this.root) return;

    const menuItems: MenuLink[] = [];
    document.querySelectorAll("[data-menu-link]").forEach((link, index) => {
      const url = link.getAttribute("href") || "";
      const title = link.textContent || "";
      const level = parseInt(link.getAttribute("data-menu-level") || "1", 10);
      menuItems.push({
        url,
        title,
        level,
        children: [],
        id: `${level}-${index}-${url}`,
        isOpen: false,
      });
    });
    this.root.render(
      <MainNavDrawer isOpen={this.isOpen} onClose={this.handleClose} menuLinks={menuItems} />
    );
  }
}

if (typeof window !== "undefined" && !customElements.get("main-nav-drawer")) {
  customElements.define("main-nav-drawer", MainNavDrawerElement);
}

export { MainNavDrawer };
