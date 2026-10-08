"use client";

import { useEffect, useState, useRef } from "react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import ProductModal from "@/components/ProductModal";
import { getProducts, getCategories } from "@/lib/services";
import { matchProductSearch } from "@/lib/search";
import { Product, Category } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShoppingBag, ArrowRight, Users, ChevronRight, Layers, X, Search } from "lucide-react";
import Link from "next/link";

// Product Card Component with Auto-Slide & Hover Photos
function ProductCard({
  product,
  onSelect,
}: {
  product: Product;
  onSelect: () => void;
}) {
  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [];
  const isOutOfStock = product.stockQuantity <= 0;

  // Auto-slide every 3.5s if multiple images
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveImgIndex((prev) => (prev + 1) % images.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={onSelect}
      className="group relative border border-border rounded-3xl overflow-hidden bg-card shadow-sm hover:shadow-2xl transition-all cursor-pointer flex flex-col hover:border-primary/50"
    >
      {/* Photo Container */}
      <div className="aspect-square bg-muted/50 relative overflow-hidden flex items-center justify-center p-3 select-none">
        {/* Out of stock badge */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 z-20 flex items-center justify-center backdrop-blur-[2px]">
            <span className="bg-red-600 text-white font-black px-3.5 py-1.5 rounded-xl text-xs uppercase tracking-wider shadow-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* Product Image */}
        {images.length > 0 ? (
          <AnimatePresence mode="wait">
            <motion.img
              key={images[activeImgIndex]}
              src={images[activeImgIndex]?.startsWith("http") || images[activeImgIndex]?.startsWith("data:") || images[activeImgIndex]?.startsWith("/") ? images[activeImgIndex] : `/images/${images[activeImgIndex]}`}
              alt={product.name}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.8 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
            />
          </AnimatePresence>
        ) : (
          <div className="text-muted-foreground text-xs italic">No photo</div>
        )}

        {/* Club Unit Badge */}
        {product.unit && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur text-white text-[10px] font-bold z-10 flex items-center gap-1 shadow">
            <Users size={11} className="text-primary" /> {product.unit === "General" ? "Club Wears" : product.unit}
          </span>
        )}

        {/* Multi-photo indicator dots */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 inset-x-0 flex justify-center gap-1 z-10">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  activeImgIndex === idx ? "bg-white w-3 shadow" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {product.requiresSize ? "Clothing / Apparel" : "Club Souvenir"}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isOutOfStock ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-600"
            }`}>
              {isOutOfStock ? "Sold Out" : `${product.stockQuantity} in stock`}
            </span>
          </div>

          <h3 className="font-extrabold text-base text-foreground group-hover:text-primary transition-colors mt-1.5 line-clamp-1">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}

          <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-1">
            {product.requiresSize && "Sizes: S to 3XL"}
            {product.requiresSize && product.requiresColor && " • "}
            {product.requiresColor && "Colors available"}
          </p>
        </div>

        {/* Pricing & Big Action Button */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
          <div>
            <span className="text-xs text-muted-foreground block font-medium">Price</span>
            <span className="text-xl font-black text-primary">
              GHC {product.price.toFixed(2)}
            </span>
          </div>

          {/* Prominent Large Button */}
          <button
            type="button"
            className="px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm bg-primary text-primary-foreground shadow-md group-hover:shadow-lg group-hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
          >
            <span>{isOutOfStock ? "View" : "Select & Add"}</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeUnit, setActiveUnit] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchStorefront = async () => {
      try {
        const [fetchedProducts, fetchedCategories] = await Promise.all([
          getProducts(),
          getCategories()
        ]);
        setProducts(fetchedProducts);
        setCategories(fetchedCategories);
      } catch (error) {
        console.error("Error loading storefront data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStorefront();
  }, []);

  // Smoothly scroll down to the catalogue results section (offsetting sticky navbar)
  const scrollToCatalogue = (behavior: ScrollBehavior = "smooth") => {
    const el = document.getElementById("catalogue");
    if (el) {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const navOffset = isMobile ? 120 : 85;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: Math.max(0, offsetPosition),
        behavior: behavior,
      });
    }
  };

  // On mobile/desktop, when user types a search query, gently scroll to results if they are at the top
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const timer = setTimeout(() => {
      const el = document.getElementById("catalogue");
      if (el) {
        const rect = el.getBoundingClientRect();
        // If the catalogue top is more than 160px down from viewport top, glide to results
        if (rect.top > 160) {
          scrollToCatalogue("smooth");
        }
      }
    }, 550);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter products by category, unit, and intelligent broad search query
  const filteredProducts = products.filter((p) => {
    // 1. Broad Smart Search Query (handles plurals, lemmas, categories, synonyms)
    if (searchQuery.trim()) {
      const cat = categories.find((c) => c.id === p.categoryId);
      if (!matchProductSearch(p, searchQuery, cat?.name)) {
        return false;
      }
    }

    // 2. Unit Filter (checked first)
    if (activeUnit !== "All") {
      const pUnit = (p.unit || "").toLowerCase();
      if (activeUnit === "Club Wears") {
        // Matches Club Wears, legacy General, or apparel without specific sub-unit
        if (pUnit !== "club wears" && pUnit !== "general" && pUnit !== "") return false;
      } else {
        if (pUnit !== activeUnit.toLowerCase()) return false;
      }
    }

    // 3. Category Filter
    if (activeCategory !== "All") {
      const cat = categories.find((c) => c.id === p.categoryId);
      const catName = cat?.name?.toLowerCase() || "";
      if (catName !== activeCategory.toLowerCase()) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Navbar
        onOpenCart={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={() => scrollToCatalogue("smooth")}
      />

      {/* Hero Section with Official Club & Adventist Logos */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-depth/15 via-background to-background border-b border-border py-12 md:py-20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">

            {/* Left Content */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4 max-w-xl">
              
              {/* Adventist Youth Ministries Banner - Positioned in the prominent space */}
              <div className="w-full max-w-sm sm:max-w-md self-center md:self-start mb-1">
                <div className="p-2 sm:p-2.5 rounded-2xl bg-card border-2 border-border shadow-md flex items-center justify-center hover:scale-[1.02] transition-transform">
                  <img
                    src="/images/logo3.jpg"
                    alt="Adventist Youth Ministries Banner"
                    className="w-full h-auto max-h-24 sm:max-h-32 object-contain rounded-xl"
                  />
                </div>
              </div>

              {/* Official AY Ministry Store Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/15 border border-primary/30 text-xs font-bold text-primary uppercase tracking-wider shadow-sm">
                <Sparkles size={14} /> Official AY Ministry Store
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
                Majesty Peacock <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-botanical-green via-sage-leaf to-pine-shade dark:from-emerald-400 dark:to-teal-300">
                  Pathfinder Club
                </span>
              </h1>

              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                Welcome to our official club souvenir and regalia store. Order uniforms, hoodies, neckerchiefs, slides, caps, and unit souvenirs (Tiger, Capricorn, Chrysanthemum & General) with live order tracking via WhatsApp.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href="#catalogue"
                  className="px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-black text-sm shadow-xl hover:opacity-95 active:scale-95 transition-all flex items-center gap-2"
                >
                  <ShoppingBag size={18} /> Browse Souvenirs
                </a>
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="px-5 py-3.5 rounded-2xl border border-border bg-card hover:bg-muted font-bold text-sm transition-all shadow-sm"
                >
                  View My Cart
                </button>
              </div>
            </div>

            {/* Official Club Peacock Embroidered Crest */}
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-3xl p-4 bg-card border-2 border-emerald-depth shadow-2xl flex items-center justify-center group hover:border-primary transition-colors"
              >
                <img
                  src="/images/logo1.jpeg"
                  alt="Majestic Peacock Pathfinder Club Crest"
                  className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-300"
                />
              </motion.div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mt-3">
                Official Club Emblem
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* Main Catalogue Section */}
      <main id="catalogue" className="container mx-auto px-4 py-10 flex-1">
        {/* Filters Header */}
        <section className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">Souvenirs Catalogue</h2>
              <p className="text-xs text-muted-foreground">Photos auto-slide for front and back views. Click any item to select size and options.</p>
            </div>
            <span className="text-xs font-bold text-muted-foreground bg-muted px-3.5 py-1.5 rounded-full self-start sm:self-auto">
              {filteredProducts.length} {filteredProducts.length === 1 ? "Item" : "Items"} Listed
            </span>
          </div>

          {/* 1. Unit / Group Filter Pills (Positioned Above Categories) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs hide-scrollbar">
            <span className="text-muted-foreground font-bold uppercase text-[10px] flex items-center gap-1 flex-shrink-0">
              <Users size={12} /> Unit / Group:
            </span>
            {["All", "Tiger", "Capricorn", "Chrysanthemum", "Club Wears"].map((unit) => (
              <button
                key={unit}
                onClick={() => setActiveUnit(unit)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                  activeUnit === unit
                    ? "bg-primary text-primary-foreground border-primary shadow-sm scale-105"
                    : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {unit === "All" ? "All Items" : unit === "Club Wears" ? "Club Wears" : `${unit} Unit`}
              </button>
            ))}
          </div>

          {/* 2. Granular Category Filters (Positioned Under Units) */}
          <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {["All", "Shirts", "Hoodies", "Neckerchiefs & Slides", "Caps & Crests", "Tags & Pins", "Accessories"].map((catName) => (
              <button
                key={catName}
                onClick={() => setActiveCategory(catName)}
                className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap ${
                  activeCategory === catName
                    ? "bg-emerald-depth text-white shadow-md scale-105"
                    : "bg-muted text-muted-foreground hover:bg-primary/20"
                }`}
              >
                {catName}
              </button>
            ))}

            {/* Custom Firestore Categories */}
            {categories
              .filter((c) => !["All", "Shirts", "Hoodies", "Neckerchiefs & Slides", "Caps & Crests", "Tags & Pins", "Accessories"].includes(c.name))
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.name)}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-extrabold transition-all whitespace-nowrap ${
                    activeCategory === c.name
                      ? "bg-emerald-depth text-white shadow-md scale-105"
                      : "bg-muted text-muted-foreground hover:bg-primary/20"
                  }`}
                >
                  {c.name}
                </button>
              ))}
          </div>
        </section>

        {/* Active Search Feedback Banner */}
        {searchQuery.trim() && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-2 p-3 sm:p-3.5 bg-primary/10 border border-primary/25 rounded-2xl animate-fadeIn">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-primary">
              <Search size={16} />
              <span>
                Showing results for &ldquo;{searchQuery}&rdquo; ({filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"} found)
              </span>
            </div>
            <button
              onClick={() => setSearchQuery("")}
              className="px-3 py-1 rounded-xl bg-background border border-primary/30 text-xs font-bold text-foreground hover:bg-muted transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Clear Search</span>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading club souvenirs...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4 border border-dashed border-border rounded-3xl bg-card max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <ShoppingBag size={28} />
            </div>
            <h3 className="text-lg font-bold">No Items Found</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? `No souvenirs match "${searchQuery}". Try searching for something broader like "hoodies", "shirts", "tags", or "peacock".` : "No products available in this category/unit yet."}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow"
              >
                <span>Clear Search & View All</span>
                <X size={14} />
              </button>
            )}
            {products.length === 0 && !searchQuery && (
              <Link
                href="/admin/inventory"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow"
              >
                Go to Admin Inventory <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={() => setSelectedProduct(product)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8 mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <img src="/images/logo1.jpeg" alt="Logo" className="w-9 h-9 object-contain rounded-full border border-border" />
            <div>
              <p className="font-bold text-foreground">Majesty Peacock Pathfinder Club</p>
              <p>Seventh-day Adventist Church AY Ministries</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p>Orders processed securely via WhatsApp (+233 593 839 451)</p>
            <p className="text-muted-foreground/60">&copy; 2026 All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenCart={() => setIsCartOpen(true)}
      />
    </div>
  );
}
