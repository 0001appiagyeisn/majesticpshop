"use client";

import { useState, useEffect } from "react";
import { getOrders, updateOrderStatus } from "@/lib/services";
import { Order } from "@/types";
import { Download, Search } from "lucide-react";
import jsPDF from "jspdf";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const exportPDF = (order: Order) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text("Majesty Peacock Shop - Order Invoice", 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Order ID: ${order.id}`, 20, 35);
    doc.text(`Date: ${new Date(order.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString()}`, 20, 45);
    doc.text(`Status: ${order.status}`, 20, 55);
    
    doc.setFontSize(14);
    doc.text("Customer Information", 20, 70);
    doc.setFontSize(12);
    doc.text(`Name: ${order.customerInfo.name}`, 20, 80);
    doc.text(`Contact: ${order.customerInfo.contact}`, 20, 90);
    doc.text(`Church: ${order.customerInfo.church} | District: ${order.customerInfo.district}`, 20, 100);
    
    doc.setFontSize(14);
    doc.text("Order Items", 20, 120);
    
    let yPos = 130;
    doc.setFontSize(11);
    order.items.forEach((item, index) => {
      const details = [
        item.selectedSize ? `Size: ${item.selectedSize}` : "",
        item.selectedColor ? `Color: ${item.selectedColor}` : ""
      ].filter(Boolean).join(", ");
      
      doc.text(`${index + 1}. ${item.product.name} (x${item.quantity}) - GHC ${(item.product.price * item.quantity).toFixed(2)}`, 20, yPos);
      if (details) {
        yPos += 7;
        doc.text(`   ${details}`, 20, yPos);
      }
      yPos += 10;
    });
    
    doc.setFontSize(14);
    doc.text(`Total Amount: GHC ${order.totalPrice.toFixed(2)}`, 20, yPos + 10);
    
    doc.save(`Order_${order.id}.pdf`);
  };

  const filteredOrders = orders.filter(o => 
    o.customerInfo.name.toLowerCase().includes(search.toLowerCase()) ||
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div>Loading orders...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Orders</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-md bg-card border border-border outline-none focus:border-primary w-64"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Order ID</th>
              <th className="px-6 py-4 font-medium">Customer</th>
              <th className="px-6 py-4 font-medium">Total</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-sm text-muted-foreground">{order.id.slice(0, 8)}...</td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.customerInfo.name}</div>
                    <div className="text-xs text-muted-foreground">{order.customerInfo.contact}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">GHC {order.totalPrice.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      className={`px-3 py-1 rounded-full text-sm font-bold border-none outline-none cursor-pointer
                        ${order.status === 'Pending' ? 'bg-orange-500/10 text-orange-500' : ''}
                        ${order.status === 'Paid' ? 'bg-blue-500/10 text-blue-500' : ''}
                        ${order.status === 'Delivered' ? 'bg-green-500/10 text-green-500' : ''}
                      `}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => exportPDF(order)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors inline-flex items-center gap-2 text-sm font-medium"
                    >
                      <Download size={16} /> Export PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

