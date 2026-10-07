"use client";

import { useEffect, useState } from "react";
import { getOrders, getProducts } from "@/lib/services";
import { Order, Product } from "@/types";
import { DollarSign, Package, ShoppingBag, AlertTriangle, ArrowRight, TrendingUp, Users, Sparkles, Layers } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedOrders, fetchedProducts] = await Promise.all([
          getOrders(),
          getProducts()
        ]);
        setOrders(fetchedOrders);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">Loading dashboard analytics...</p>
      </div>
    );
  }

  const totalSales = orders
    .filter((o) => o.status === "Paid" || o.status === "Delivered")
    .reduce((sum, order) => sum + order.totalPrice, 0);

  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const lowStockProducts = products.filter((p) => p.stockQuantity <= 5);

  const statCards = [
    {
      title: "Total Revenue",
      value: `GHC ${totalSales.toFixed(2)}`,
      subtitle: "Verified MoMo Payments",
      icon: DollarSign,
      gradient: "from-emerald-500/15 to-green-500/5",
      border: "border-emerald-500/20",
      textCol: "text-emerald-500",
    },
    {
      title: "Total Orders",
      value: orders.length,
      subtitle: "All Time Orders",
      icon: ShoppingBag,
      gradient: "from-blue-500/15 to-indigo-500/5",
      border: "border-blue-500/20",
      textCol: "text-blue-500",
    },
    {
      title: "Pending Orders",
      value: pendingOrders,
      subtitle: "Awaiting MoMo / Prep",
      icon: Package,
      gradient: "from-amber-500/15 to-orange-500/5",
      border: "border-amber-500/20",
      textCol: "text-amber-500",
    },
    {
      title: "Low Stock Items",
      value: lowStockProducts.length,
      subtitle: "Needs Reorder",
      icon: AlertTriangle,
      gradient: "from-rose-500/15 to-red-500/5",
      border: "border-rose-500/20",
      textCol: "text-rose-500",
    },
  ];

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-depth/20 via-card to-card p-6 rounded-3xl border border-border shadow-sm">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-botanical-green flex items-center gap-1.5">
            <Sparkles size={14} /> Club Management Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
            Majesty Peacock Pathfinder Club Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Live sales, automated inventory tracking, and pending WhatsApp orders
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/inventory"
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-2 hover:opacity-90 shadow-md transition-all active:scale-95"
          >
            <Layers size={16} /> Manage Inventory
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2.5 rounded-xl bg-card border border-border hover:bg-muted font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <ShoppingBag size={16} /> Orders List
          </Link>
        </div>
      </div>

      {/* Interactive Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={i}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`bg-gradient-to-b ${stat.gradient} bg-card border ${stat.border} p-5 rounded-3xl shadow-sm hover:shadow-lg transition-all flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`p-2.5 rounded-2xl bg-card border border-border ${stat.textCol} shadow-sm`}>
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-black text-foreground">{stat.value}</div>
                <div className="text-[11px] font-semibold text-muted-foreground mt-0.5">{stat.subtitle}</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Grid: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Orders Table (2 cols) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Recent Orders</h2>
              <p className="text-xs text-muted-foreground">Orders submitted via WhatsApp and recorded in database</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-xs">
              No orders placed yet. Orders made on the storefront will appear here instantly!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {orders.slice(0, 5).map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {order.customerInfo.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{order.customerInfo.name}</h4>
                      <p className="text-[11px] text-muted-foreground">
                        {order.customerInfo.church} • {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-primary block">
                      GHC {order.totalPrice.toFixed(2)}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      order.status === 'Paid'
                        ? 'bg-blue-500/10 text-blue-500'
                        : order.status === 'Delivered'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-orange-500/10 text-orange-500'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts (1 col) */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <AlertTriangle size={18} className="text-rose-500" /> Stock Monitor
              </h2>
              <p className="text-xs text-muted-foreground">Items needing restocking</p>
            </div>
            <span className="text-xs font-bold text-rose-500 bg-rose-500/10 px-2.5 py-0.5 rounded-full">
              {lowStockProducts.length}
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-xs space-y-1">
              <p className="font-bold text-foreground">All items stocked</p>
              <p>No souvenir is currently below 5 units.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 hide-scrollbar">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="p-3 rounded-2xl bg-muted/40 border border-border flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate">{p.name}</h4>
                    <p className="text-[10px] text-muted-foreground">{p.unit || "General"} Unit</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                    p.stockQuantity <= 0 ? "bg-red-500 text-white" : "bg-red-500/15 text-red-500"
                  }`}>
                    {p.stockQuantity <= 0 ? "0 left" : `${p.stockQuantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
