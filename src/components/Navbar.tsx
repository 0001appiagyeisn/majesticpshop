"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Moon, Sun, Search, X, ArrowDown } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  onOpenCart?: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (val: string) => void;
}

export default function Navbar({ onOpenCart, searchQuery = "", onSearchChange, onSearchSubmit }: NavbarProps) {
  const { cart } = useCart();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalQuery(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
    // Instant secret admin redirect if typed
    const trimmed = val.trim().toLowerCase();
    if (trimmed === "iamadminms" || trimmed === "iamadminapp") {
      router.push("/admin/login");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = localQuery.trim().toLowerCase();
    if (query === "iamadminms" || query === "iamadminapp") {
      router.push("/admin/login");
    } else {
      if (onSearchSubmit) {
        onSearchSubmit(localQuery);
      } else if (!onSearchChange) {
        router.push(`/?search=${encodeURIComponent(localQuery)}`);
      }
    }
  };

  const handleClear = () => {
    setLocalQuery("");
    if (onSearchChange) onSearchChange("");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/90 backdrop-blur-md shadow-sm transition-colors">
      <div className="container mx-auto px-3 sm:px-4">
        {/* Main Header Row */}
        <div className="h-16 sm:h-20 flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            {/* Official Adventist Church Emblem (SDA Logo) */}
            <div className="relative h-10 sm:h-12 px-1.5 sm:px-2 py-1 rounded-xl overflow-hidden border border-border shadow-sm bg-card group-hover:scale-105 transition-transform flex-shrink-0 flex items-center justify-center">
              <img
                src="/images/logo2.jpg"
                alt="Seventh-day Adventist Church Logo"
                className="h-full w-auto object-contain max-h-7 sm:max-h-9"
              />
            </div>

            {/* Club Peacock Crest */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border-2 border-emerald-depth shadow-md bg-white p-0.5 group-hover:scale-105 transition-transform flex-shrink-0">
              <img
                src="/images/logo1.jpeg"
                alt="Majestic Peacock Pathfinder Club"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex flex-col truncate">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight text-foreground leading-tight group-hover:text-primary transition-colors truncate">
                Majesty Peacock
              </span>
              <span className="text-[10px] sm:text-xs font-semibold text-botanical-green uppercase tracking-wider truncate">
                Pathfinder Club Shop
              </span>
            </div>
          </Link>

          {/* Desktop Live Search Bar with Secret Admin Access */}
          <div className="flex-1 max-w-md mx-2 hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <button
                type="submit"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                title="Search"
              >
                <Search size={16} />
              </button>
              <input
                type="text"
                placeholder="Search souvenir items... (e.g. shirt, hoodie)"
                className="w-full pl-9 pr-9 py-2 text-sm rounded-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/70"
                value={localQuery}
                onChange={handleInputChange}
              />
              {localQuery && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                  title="Clear search"
                >
                  <X size={15} />
                </button>
              )}
            </form>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 sm:p-2.5 rounded-full hover:bg-muted text-foreground transition-colors"
                title="Toggle theme"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun size={19} className="text-yellow-400" />
                ) : (
                  <Moon size={19} className="text-emerald-depth" />
                )}
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full bg-primary text-primary-foreground font-bold shadow hover:opacity-90 active:scale-95 transition-all text-xs sm:text-sm"
              aria-label="Open cart"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 sm:px-2 py-0.5 text-[11px] font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Live Search Bar (Always visible on mobile screens) */}
        <div className="pb-3 md:hidden">
          <form onSubmit={handleSearchSubmit} className="relative">
            <button
              type="submit"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              title="Search"
            >
              <Search size={15} />
            </button>
            <input
              type="text"
              placeholder="Search souvenirs... (e.g. shirt, hoodie)"
              className="w-full pl-9 pr-9 py-2 text-xs rounded-full bg-background border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/70 shadow-sm"
              value={localQuery}
              onChange={handleInputChange}
            />
            {localQuery && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </form>

          {/* Quick jump to results on mobile when search is active */}
          {localQuery.trim().length > 0 && (
            <div className="flex items-center justify-between mt-1 px-2 text-[11px] font-bold text-primary animate-fadeIn">
              <span className="truncate max-w-[200px]">Filter: &quot;{localQuery}&quot;</span>
              <button
                type="button"
                onClick={() => onSearchSubmit && onSearchSubmit(localQuery)}
                className="flex items-center gap-1 text-[11px] bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-0.5 rounded-full transition-all"
              >
                <span>View Results</span>
                <ArrowDown size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
