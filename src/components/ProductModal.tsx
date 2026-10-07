"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Check, ShoppingCart, ChevronLeft, ChevronRight, Users } from "lucide-react";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenCart: () => void;
}

const AVAILABLE_SIZES = ["S", "M", "L", "XL", "XXL", "3XL"];
const AVAILABLE_COLORS = ["Club Green", "Black", "White", "Gold", "Navy"];

export default function ProductModal({ product, onClose, onOpenCart }: ProductModalProps) {
  const { addToCart } = useCart();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedColor, setSelectedColor] = useState<string>("Club Green");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Auto-swipe timer
  useEffect(() => {
    if (!product || !product.imageUrls || product.imageUrls.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % product.imageUrls.length);
    }, 3500);

    return () => clearInterval(interval);
  }, [product, selectedImageIndex]);

  // Reset index when product changes
  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
  }, [product]);

  if (!product) return null;

  const images = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [];
  const currentImage = images[selectedImageIndex] || null;
  const isOutOfStock = product.stockQuantity <= 0;

  const nextImage = () => {
    if (images.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % images.length);
    }
  };

  const prevImage = () => {
    if (images.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    if (diff > 45) {
      nextImage(); // swipe left -> next
    } else if (diff < -45) {
      prevImage(); // swipe right -> prev
    }
    setTouchStartX(null);
  };

  const handleAdd = () => {
    if (isOutOfStock) return;

    addToCart({
      product,
      quantity,
      selectedSize: product.requiresSize ? selectedSize : undefined,
      selectedColor: product.requiresColor ? selectedColor : undefined,
    });

    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
      onOpenCart();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col md:flex-row max-h-[92vh]"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-30 p-2.5 rounded-full bg-background/80 hover:bg-background text-foreground backdrop-blur shadow-md hover:scale-105 transition-all"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          {/* Image gallery column with auto-slide & touch swipe */}
          <div className="w-full md:w-1/2 p-5 bg-muted/40 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border select-none">
            <div
              className="relative aspect-square w-full rounded-2xl overflow-hidden bg-background border border-border shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing group"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence mode="wait">
                {currentImage ? (
                  <motion.img
                    key={currentImage}
                    src={currentImage?.startsWith("http") || currentImage?.startsWith("data:") || currentImage?.startsWith("/") ? currentImage : `/images/${currentImage}`}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-muted-foreground text-sm">No photo available</div>
                )}
              </AnimatePresence>

              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); prevImage(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur transition-all opacity-80 group-hover:opacity-100"
                    title="Previous photo"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); nextImage(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur transition-all opacity-80 group-hover:opacity-100"
                    title="Next photo"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Out of stock banner */}
              {isOutOfStock && (
                <div className="absolute inset-0 bg-black/65 flex items-center justify-center z-20">
                  <span className="bg-red-600 text-white font-black px-4 py-2 rounded-xl text-sm tracking-wider uppercase shadow-2xl">
                    Out of Stock
                  </span>
                </div>
              )}

              {/* Auto-slide indicator badge */}
              {images.length > 1 && (
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur text-white text-[11px] font-bold z-10 flex items-center gap-1.5">
                  <span>{selectedImageIndex + 1} / {images.length}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                </div>
              )}
            </div>

            {/* Thumbnail carousel */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1 hide-scrollbar justify-center">
                {images.map((img, idx) => (
                  <button
                    key={img}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImageIndex === idx ? "border-primary scale-105 shadow-md" : "border-border opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img?.startsWith("http") || img?.startsWith("data:") || img?.startsWith("/") ? img : `/images/${img}`} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product details & selection column */}
          <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                    Official Souvenir
                  </span>
                  {product.unit && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-depth bg-emerald-depth/15 dark:text-emerald-400 dark:bg-emerald-400/15 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Users size={12} /> {product.unit === "General" ? "Club Wears" : `${product.unit} Unit`}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl font-black text-foreground mt-2 leading-tight">
                  {product.name}
                </h3>
                
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-3xl font-black text-primary">
                    GHC {product.price.toFixed(2)}
                  </span>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                    isOutOfStock ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-600"
                  }`}>
                    {isOutOfStock ? "Sold Out" : `${product.stockQuantity} in stock`}
                  </span>
                </div>

                {product.description && (
                  <p className="text-xs text-muted-foreground mt-3 leading-relaxed bg-muted/40 p-3 rounded-2xl border border-border/60">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Size selection */}
              {product.requiresSize && (
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                    Select Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SIZES.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedSize === size
                            ? "bg-primary text-primary-foreground border-primary shadow-md scale-105"
                            : "border-border hover:border-primary/50 text-foreground bg-card"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color selection */}
              {product.requiresColor && (
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                    Select Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_COLORS.map((col) => (
                      <button
                        key={col}
                        onClick={() => setSelectedColor(col)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          selectedColor === col
                            ? "bg-emerald-depth text-white border-emerald-depth shadow-md scale-105"
                            : "border-border hover:border-primary/50 text-foreground bg-card"
                        }`}
                      >
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded-xl bg-card px-3 py-1.5 shadow-sm">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isOutOfStock}
                      className="p-1 hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-10 text-center font-extrabold text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                      disabled={quantity >= product.stockQuantity || isOutOfStock}
                      className="p-1 hover:text-primary disabled:opacity-30 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Subtotal: <strong className="text-foreground text-sm font-bold">GHC {(product.price * quantity).toFixed(2)}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Extra Large Action Button */}
            <div className="pt-5 border-t border-border mt-4">
              <button
                onClick={handleAdd}
                disabled={isOutOfStock}
                className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                  added
                    ? "bg-green-600 text-white"
                    : isOutOfStock
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:opacity-95 hover:shadow-primary/20"
                }`}
              >
                {added ? (
                  <>
                    <Check size={24} /> Added to Cart!
                  </>
                ) : isOutOfStock ? (
                  "Currently Unavailable"
                ) : (
                  <>
                    <ShoppingCart size={22} /> Add to Cart (GHC {(product.price * quantity).toFixed(2)})
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
