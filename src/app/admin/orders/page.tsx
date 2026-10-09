"use client";

import { useState, useEffect } from "react";
import { getOrders, updateOrderStatus } from "@/lib/services";
import { Order } from "@/types";
import { Download, Search, FileText, CheckCircle2, Clock, Truck, Filter } from "lucide-react";
import jsPDF from "jspdf";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Paid" | "Delivered">("All");

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const fetched = await getOrders();
      setOrders(fetched);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(id, newStatus);
      fetchOrders();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  // Export Single Order Invoice
  const exportPDF = (order: Order) => {
    const doc = new jsPDF();
    
    doc.setFillColor(27, 77, 62);
    doc.rect(14, 14, 182, 16, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Majesty Peacock Shop - Order Invoice", 18, 25);
    
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const dateStr = order.createdAt?.seconds 
      ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-GB") 
      : new Date().toLocaleDateString("en-GB");

    doc.text(`Order Ref: #${(order.id || "").slice(0, 10).toUpperCase()}`, 18, 38);
    doc.text(`Date: ${dateStr}`, 18, 44);
    doc.text(`Status: ${order.status}`, 18, 50);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Customer Information", 18, 62);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(`Name: ${order.customerInfo?.name || "N/A"}`, 18, 68);
    doc.text(`Contact: ${order.customerInfo?.contact || "N/A"}`, 18, 74);
    doc.text(`Church: ${order.customerInfo?.church || "N/A"} | District: ${order.customerInfo?.district || "N/A"}`, 18, 80);
    if (order.customerInfo?.gender) {
      doc.text(`Gender: ${order.customerInfo.gender} | Age: ${order.customerInfo.age || "N/A"}`, 18, 86);
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Order Items", 18, 98);
    
    let yPos = 106;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    order.items?.forEach((item, index) => {
      const details = [
        item.selectedSize ? `Size: ${item.selectedSize}` : "",
        item.selectedColor ? `Color: ${item.selectedColor}` : ""
      ].filter(Boolean).join(", ");
      
      doc.text(`${index + 1}. ${item.product?.name || "Product"} (x${item.quantity}) - GHC ${((item.product?.price || 0) * item.quantity).toFixed(2)}`, 18, yPos);
      if (details) {
        yPos += 5;
        doc.text(`   [${details}]`, 18, yPos);
      }
      yPos += 7;
    });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(27, 77, 62);
    doc.text(`Total Amount: GHC ${(order.totalPrice || 0).toFixed(2)}`, 18, yPos + 6);
    
    doc.save(`Order_${(order.id || "").slice(0, 8)}.pdf`);
  };

  // Export Comprehensive PDF Report of ALL Orders
  const exportAllOrdersPDF = (ordersToExport: Order[]) => {
    if (!ordersToExport || ordersToExport.length === 0) {
      alert("No orders available to export.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let yPos = 20;
    let pageNumber = 1;

    const printHeader = () => {
      // Top header banner
      doc.setFillColor(27, 77, 62); // Emerald Depth / Club Green #1B4D3E
      doc.rect(margin, yPos - 6, pageWidth - (margin * 2), 18, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("MAJESTY PEACOCK PATHFINDER CLUB", margin + 4, yPos + 2);

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.text("OFFICIAL SOUVENIR ORDERS & ROSTER REPORT", margin + 4, yPos + 8);

      // Metadata right aligned
      doc.setFontSize(8);
      const dateStr = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      doc.text(`Generated: ${dateStr}`, pageWidth - margin - 4, yPos + 2, { align: "right" });
      doc.text(`Total Records: ${ordersToExport.length}`, pageWidth - margin - 4, yPos + 8, { align: "right" });

      yPos += 20;
      doc.setTextColor(0, 0, 0);
    };

    const printFooter = (currPage: number) => {
      doc.setFontSize(7.5);
      doc.setTextColor(128, 128, 128);
      doc.setFont("helvetica", "normal");
      doc.text(
        "Seventh-day Adventist Church AY Ministries - Confidential Club Records",
        margin,
        pageHeight - 8
      );
      doc.text(`Page ${currPage}`, pageWidth - margin, pageHeight - 8, { align: "right" });
      doc.setTextColor(0, 0, 0);
    };

    // Print First Page Header
    printHeader();

    // Summary Statistics Box
    const totalRevenue = ordersToExport.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
    const paidOrders = ordersToExport.filter(o => o.status === "Paid");
    const pendingOrders = ordersToExport.filter(o => o.status === "Pending");
    const deliveredOrders = ordersToExport.filter(o => o.status === "Delivered");

    doc.setFillColor(245, 248, 245);
    doc.setDrawColor(200, 215, 205);
    doc.roundedRect(margin, yPos, pageWidth - (margin * 2), 16, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(27, 77, 62);
    doc.text(`Total Revenue: GHC ${totalRevenue.toFixed(2)} (${ordersToExport.length} orders)`, margin + 5, yPos + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text(
      `Paid: ${paidOrders.length} (GHC ${paidOrders.reduce((s, o) => s + (o.totalPrice || 0), 0).toFixed(2)})   |   Pending: ${pendingOrders.length} (GHC ${pendingOrders.reduce((s, o) => s + (o.totalPrice || 0), 0).toFixed(2)})   |   Delivered: ${deliveredOrders.length}`,
      margin + 5,
      yPos + 12
    );

    yPos += 22;

    // Loop through each order
    ordersToExport.forEach((order, index) => {
      const itemsCount = order.items?.length || 1;
      const estimatedHeight = 26 + (itemsCount * 5.5);

      // Check if we need a new page
      if (yPos + estimatedHeight > pageHeight - 16) {
        printFooter(pageNumber);
        doc.addPage();
        pageNumber++;
        yPos = 20;
        printHeader();
      }

      // Order Box Container
      doc.setFillColor(254, 254, 254);
      doc.setDrawColor(220, 225, 220);
      doc.roundedRect(margin, yPos, pageWidth - (margin * 2), estimatedHeight - 2, 1.5, 1.5, "FD");

      // Order Header Bar inside box
      doc.setFillColor(242, 246, 243);
      doc.rect(margin, yPos, pageWidth - (margin * 2), 6.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(20, 20, 20);

      const orderRef = `#${(order.id || "").slice(0, 8).toUpperCase()}`;
      const orderDate = order.createdAt?.seconds 
        ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-GB")
        : "Recent";

      doc.text(`${index + 1}. Order ${orderRef} (${orderDate})`, margin + 3, yPos + 4.5);

      // Status Badge text right aligned
      let statusColor: [number, number, number] = [217, 119, 6]; // Orange for Pending
      if (order.status === "Paid") statusColor = [37, 99, 235]; // Blue for Paid
      if (order.status === "Delivered") statusColor = [22, 163, 74]; // Green for Delivered
      doc.setTextColor(...statusColor);
      doc.text(`Status: ${order.status}`, pageWidth - margin - 3, yPos + 4.5, { align: "right" });

      // Customer Info line
      yPos += 11;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(`Customer: ${order.customerInfo?.name || "N/A"}`, margin + 3, yPos);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(70, 70, 70);
      doc.text(`Phone: ${order.customerInfo?.contact || "N/A"}`, margin + 65, yPos);

      const churchInfo = `Church: ${order.customerInfo?.church || "N/A"} (${order.customerInfo?.district || "N/A"})`;
      doc.text(churchInfo, margin + 115, yPos);

      // Items Ordered
      yPos += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(50, 50, 50);
      doc.text("Items:", margin + 3, yPos);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      order.items?.forEach((item) => {
        const itemVariants = [
          item.selectedSize ? `Size: ${item.selectedSize}` : "",
          item.selectedColor ? `Color: ${item.selectedColor}` : ""
        ].filter(Boolean).join(", ");

        const itemStr = `• ${item.quantity}x ${item.product?.name || "Product"} ${itemVariants ? `[${itemVariants}]` : ""} - GHC ${((item.product?.price || 0) * item.quantity).toFixed(2)}`;
        doc.text(itemStr, margin + 14, yPos);
        yPos += 4.5;
      });

      // Total Line
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(27, 77, 62);
      doc.text(`Total: GHC ${(order.totalPrice || 0).toFixed(2)}`, pageWidth - margin - 4, yPos + 1, { align: "right" });

      yPos += 7;
    });

    // Print footer on final page
    printFooter(pageNumber);

    const safeDate = new Date().toISOString().split("T")[0];
    doc.save(`Majesty_Peacock_All_Orders_${safeDate}.pdf`);
  };

  // Filter orders by search and status
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      (o.customerInfo?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customerInfo?.contact || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customerInfo?.church || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.customerInfo?.district || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.id || "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter(o => o.status === "Pending").length;
  const paidCount = orders.filter(o => o.status === "Paid").length;
  const deliveredCount = orders.filter(o => o.status === "Delivered").length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Loading club orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground flex items-center gap-2.5">
            Orders
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              {orders.length} Total
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Total Revenue: <strong className="text-primary font-black">GHC {totalRevenue.toFixed(2)}</strong> • Track orders, confirm payments, and export master PDF rosters.
          </p>
        </div>

        {/* Search & Export All PDF Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Search by name, contact, church..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-card border border-border text-xs outline-none focus:border-primary shadow-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => exportAllOrdersPDF(filteredOrders)}
            disabled={filteredOrders.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-depth hover:opacity-90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            title="Export all visible orders into a comprehensive PDF report"
          >
            <Download size={15} />
            <span>Export All Orders (PDF)</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Counts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(["All", "Pending", "Paid", "Delivered"] as const).map((tab) => {
          const count = 
            tab === "All" ? orders.length :
            tab === "Pending" ? pendingCount :
            tab === "Paid" ? paidCount : deliveredCount;

          const isActive = statusFilter === tab;

          return (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              <span>{tab}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? "bg-white/20 text-white" : "bg-muted text-foreground"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile Swipe Hint */}
      <div className="md:hidden text-[11px] text-muted-foreground font-semibold px-1">
        <span>👈 Swipe table sideways to see details & actions 👉</span>
      </div>

      {/* Orders Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[720px] text-left">
            <thead className="bg-muted/60 text-muted-foreground text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Order Ref</th>
                <th className="px-6 py-4">Customer & Church</th>
                <th className="px-6 py-4">Items Summary</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground space-y-2">
                    <FileText size={32} className="mx-auto opacity-30" />
                    <p className="font-bold">No orders found</p>
                    <p className="text-[11px]">
                      {search || statusFilter !== "All"
                        ? "Try clearing the search or status filter."
                        : "Orders placed by customers via WhatsApp will appear here."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const itemsCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                  const dateStr = order.createdAt?.seconds 
                    ? new Date(order.createdAt.seconds * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
                    : "Recent";

                  return (
                    <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{dateStr}</div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-foreground">{order.customerInfo?.name || "N/A"}</div>
                        <div className="text-muted-foreground text-[11px]">{order.customerInfo?.contact}</div>
                        {(order.customerInfo?.church || order.customerInfo?.district) && (
                          <div className="text-[10px] text-muted-foreground/80 mt-0.5">
                            {order.customerInfo.church} • {order.customerInfo.district}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">
                          {order.items?.[0]?.product?.name || "Product"}
                          {(order.items?.length || 0) > 1 && ` + ${(order.items?.length || 1) - 1} more`}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {itemsCount} {itemsCount === 1 ? "item" : "items"} total
                        </div>
                      </td>

                      <td className="px-6 py-4 font-black text-primary text-sm">
                        GHC {(order.totalPrice || 0).toFixed(2)}
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                          className={`px-3 py-1 rounded-full text-xs font-bold border-none outline-none cursor-pointer transition-colors ${
                            order.status === 'Pending' ? 'bg-orange-500/15 text-orange-600 dark:text-orange-400' : ''
                          } ${
                            order.status === 'Paid' ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400' : ''
                          } ${
                            order.status === 'Delivered' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : ''
                          }`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => exportPDF(order)}
                          className="px-2.5 py-1 rounded-lg border border-border text-foreground hover:bg-primary/10 hover:text-primary transition-colors inline-flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                          title="Download individual invoice PDF"
                        >
                          <Download size={13} />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
