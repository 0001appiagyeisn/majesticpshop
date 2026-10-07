"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingBag, Tags, LogOut, ExternalLink, Menu, X } from "lucide-react";
import { auth } from "@/lib/firebase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-semibold text-muted-foreground">Checking authentication...</div>;
  }

  if (!user && pathname !== "/admin/login") {
    return null;
  }

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/admin/login");
  };

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    { href: "/admin/inventory", label: "Inventory", icon: Package },
    { href: "/admin/categories", label: "Categories", icon: Tags },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground overflow-hidden">
      {/* Mobile Top Header (Screens < md) */}
      <div className="md:hidden flex items-center justify-between p-3.5 border-b border-border bg-card z-30 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-depth p-0.5 bg-white flex-shrink-0">
            <img src="/images/logo1.jpeg" alt="Club Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="text-xs font-black text-foreground leading-tight">Majesty Peacock</h2>
            <span className="text-[10px] font-bold text-botanical-green uppercase">Admin Portal</span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-foreground transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Drawer (Overlay when opened) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Sidebar */}
          <aside className="relative w-72 max-w-[80vw] bg-card border-r border-border flex flex-col justify-between h-full z-10 shadow-2xl">
            <div>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-depth p-0.5 bg-white flex-shrink-0">
                    <img src="/images/logo1.jpeg" alt="Club Logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-foreground leading-tight">Majesty Peacock</h2>
                    <span className="text-[10px] font-bold text-botanical-green uppercase">Admin Portal</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="p-3.5 space-y-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon size={18} />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="p-4 border-t border-border space-y-2">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <span>View Storefront</span>
                <ExternalLink size={14} />
              </Link>

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Persistent Desktop Sidebar (Screens >= md) */}
      <aside className="hidden md:flex w-64 border-r border-border bg-card flex-col justify-between flex-shrink-0">
        <div>
          {/* Header with Club Crest */}
          <div className="p-5 border-b border-border flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-emerald-depth p-0.5 bg-white flex-shrink-0">
              <img src="/images/logo1.jpeg" alt="Club Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground leading-tight">Majesty Peacock</h2>
              <span className="text-[11px] font-bold text-botanical-green uppercase">Admin Portal</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon size={18} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer with Storefront Link and Logout */}
        <div className="p-4 border-t border-border space-y-2">
          <Link
            href="/"
            className="flex items-center justify-between px-3.5 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <span>View Storefront</span>
            <ExternalLink size={14} />
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 w-full overflow-y-auto p-4 sm:p-6 md:p-8 bg-background">
        {children}
      </main>
    </div>
  );
}
