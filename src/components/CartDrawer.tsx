"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, Send, CheckCircle2, ShoppingBag, Sparkles } from "lucide-react";
import { CustomerInfo } from "@/types";
import { addOrder } from "@/lib/services";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WHATSAPP_PHONE = "233593839451";

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart();
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [easterEggActive, setEasterEggActive] = useState(false);

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    age: "",
    gender: "Male",
    church: "",
    district: "",
    contact: "",
  });

  // Handle Full Name Input with Secret 3-Fullstops Trick for Pakyi Church!
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    // Check if starts with 3 dots: "..."
    if (val.startsWith("...")) {
      const cleanName = val.replace(/^\.\.\.\s*/, "");
      setCustomerInfo((prev) => ({
        ...prev,
        name: cleanName,
        church: "Pakyi No.2 SDA Church",
        district: "Dominase District",
      }));
      setEasterEggActive(true);
      setTimeout(() => setEasterEggActive(false), 3000);
    } else {
      setCustomerInfo((prev) => ({ ...prev, name: val }));
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name || !customerInfo.contact || !customerInfo.church || !customerInfo.district) {
      alert("Please fill in all required personal information fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Save order to Firebase Firestore
      const newOrderId = await addOrder({
        customerInfo,
        items: cart,
        totalPrice: cartTotal,
        status: "Pending",
      });

      setOrderId(newOrderId);

      // 2. Format WhatsApp message
      const itemsText = cart.map((item, idx) => {
        const details = [
          item.selectedSize ? `Size: ${item.selectedSize}` : "",
          item.selectedColor ? `Color: ${item.selectedColor}` : "",
        ].filter(Boolean).join(" | ");

        return `${idx + 1}. *${item.product.name}* (x${item.quantity}) - GHC ${(item.product.price * item.quantity).toFixed(2)}${details ? `\n   ↳ ${details}` : ""}`;
      }).join("\n");

      const message = `🦚 *MAJESTY PEACOCK PATHFINDER CLUB*\n*Official Souvenir Order*\n--------------------------------\n📋 *Order Ref:* #${newOrderId.slice(0, 8).toUpperCase()}\n\n👤 *Personal Information:*\n• *Name:* ${customerInfo.name}\n• *Age:* ${customerInfo.age || "N/A"}\n• *Gender:* ${customerInfo.gender}\n• *Church:* ${customerInfo.church}\n• *District:* ${customerInfo.district}\n• *Contact:* ${customerInfo.contact}\n\n🛍️ *Items Ordered:*\n${itemsText}\n--------------------------------\n💰 *Total Amount:* *GHC ${cartTotal.toFixed(2)}*\n\n(Kindly confirm MoMo details for payment receipt)`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodedMessage}`;

      // 3. Clear cart and open WhatsApp
      clearCart();
      setStep("success");
      window.open(whatsappUrl, "_blank");

    } catch (err) {
      console.error("Order processing error:", err);
      alert("Failed to submit order. Please check your internet connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep("cart");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-card border-l border-border h-full shadow-2xl flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-depth p-0.5 bg-white flex-shrink-0 shadow-sm">
                  <img src="/images/logo1.jpeg" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-foreground">
                    {step === "cart" && "Your Souvenir Cart"}
                    {step === "checkout" && "Customer Information"}
                    {step === "success" && "Order Submitted!"}
                  </h2>
                  <p className="text-xs text-muted-foreground">Majesty Peacock Pathfinder Club</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-5">
              {step === "cart" && (
                <>
                  {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <ShoppingBag size={32} className="text-muted-foreground" />
                      </div>
                      <p className="font-bold text-lg text-foreground">Your cart is empty</p>
                      <p className="text-xs max-w-xs text-muted-foreground">Browse the club souvenirs catalogue and pick your shirts, hoodies, neckerchiefs, or tags.</p>
                      <button
                        onClick={handleClose}
                        className="mt-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow hover:opacity-90 transition-all"
                      >
                        Explore Souvenirs
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {cart.map((item, index) => (
                        <div
                          key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}-${index}`}
                          className="flex gap-4 p-3.5 rounded-2xl border border-border bg-background/60 hover:bg-background transition-colors shadow-sm"
                        >
                          {/* Image */}
                          <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0">
                            {item.product.imageUrls?.[0] ? (
                              <img
                                src={`/images/${item.product.imageUrls[0]}`}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                            )}
                          </div>

                          {/* Details */}
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-start gap-2">
                                <h4 className="font-bold text-sm line-clamp-1 text-foreground">{item.product.name}</h4>
                                <button
                                  onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                                  className="text-red-500 hover:text-red-600 p-1 transition-colors"
                                  title="Remove item"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-1">
                                {item.selectedSize && (
                                  <span className="bg-muted px-2 py-0.5 rounded-md font-semibold">Size: {item.selectedSize}</span>
                                )}
                                {item.selectedColor && (
                                  <span className="bg-muted px-2 py-0.5 rounded-md font-semibold">Color: {item.selectedColor}</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-2">
                              <span className="font-extrabold text-primary text-sm">
                                GHC {(item.product.price * item.quantity).toFixed(2)}
                              </span>

                              {/* Quantity selector */}
                              <div className="flex items-center gap-2 border border-border rounded-xl bg-card px-2.5 py-1 shadow-sm">
                                <button
                                  onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1), item.selectedSize, item.selectedColor)}
                                  className="p-0.5 hover:text-primary disabled:opacity-30"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="text-xs font-black w-5 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.selectedSize, item.selectedColor)}
                                  className="p-0.5 hover:text-primary"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {step === "checkout" && (
                <form id="checkoutForm" onSubmit={handleCheckout} className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-xs text-foreground space-y-1">
                    <p className="font-bold text-primary flex items-center gap-1.5">
                      <Sparkles size={14} /> AY Ministry Member Information
                    </p>
                    <p className="text-muted-foreground">Please fill in your details so the club officers can record and prepare your items accurately.</p>
                  </div>

                  {easterEggActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2"
                    >
                      <Sparkles size={14} /> Pakyi No.2 SDA Church auto-filled!
                    </motion.div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John K. Appiagyei"
                      value={customerInfo.name}
                      onChange={handleNameChange}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Age</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 16"
                        value={customerInfo.age}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, age: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">Gender *</label>
                      <select
                        value={customerInfo.gender}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, gender: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                      Church Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Amazing Grace SDA Church"
                      value={customerInfo.church}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, church: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                      District *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kumasi Central District"
                      value={customerInfo.district}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, district: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                      Phone / WhatsApp Contact *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 059 383 9451"
                      value={customerInfo.contact}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, contact: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </form>
              )}

              {step === "success" && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Order Forwarded to WhatsApp!</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Your order details have been securely recorded in our database and opened in WhatsApp with the pre-filled summary.
                  </p>
                  {orderId && (
                    <div className="p-3 bg-muted rounded-xl font-mono text-xs text-foreground font-bold">
                      Ref: #{orderId.slice(0, 10).toUpperCase()}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Send the WhatsApp message to complete your order, and our club officer will follow up with MoMo payment details.
                  </p>
                  <button
                    onClick={handleClose}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 shadow-md"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Footer Summary & Buttons */}
            {step !== "success" && cart.length > 0 && (
              <div className="p-5 border-t border-border bg-card space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-medium">Total Summary:</span>
                  <span className="text-2xl font-black text-primary">GHC {cartTotal.toFixed(2)}</span>
                </div>

                {step === "cart" ? (
                  <button
                    onClick={() => setStep("checkout")}
                    className="w-full py-3.5 bg-primary text-primary-foreground rounded-2xl font-black text-base shadow-lg hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    Proceed to Information
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setStep("cart")}
                      className="px-4 py-3 rounded-xl border border-border bg-background text-sm font-bold hover:bg-muted"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      form="checkoutForm"
                      disabled={isSubmitting}
                      className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black text-base shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send size={18} />
                      {isSubmitting ? "Processing..." : "Checkout via WhatsApp"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
