"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pine-shade/20 via-background to-background p-4 text-foreground">
      <div className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-2xl relative">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Storefront
        </Link>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-depth shadow-lg bg-white p-1 mb-4">
            <img
              src="/images/logo1.jpeg"
              alt="Majestic Peacock Pathfinder Club"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-black text-foreground">Majesty Peacock Club</h1>
          <p className="text-xs font-bold text-botanical-green uppercase tracking-wider mt-0.5">Admin Management Portal</p>
          <p className="text-xs text-muted-foreground mt-2">Sign in to manage club orders, stock levels, and souvenirs catalogue</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded-xl mb-6 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Admin Email</label>
            <input
              type="email"
              required
              placeholder="e.g. admin@majesticpshop.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-muted-foreground mb-1.5">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm shadow hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Authenticating..." : "Sign In to Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
