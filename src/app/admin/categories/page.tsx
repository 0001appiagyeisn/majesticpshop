"use client";

import { useState, useEffect } from "react";
import { getCategories, addCategory } from "@/lib/services";
import { Category } from "@/types";
import { Plus } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const fetched = await getCategories();
      setCategories(fetched);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await addCategory({ name: newCatName.trim() });
      setNewCatName("");
      fetchCategories();
    } catch (error) {
      console.error("Failed to add category", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure? This might break products using this category.")) {
      try {
        await deleteDoc(doc(db, "categories", id));
        fetchCategories();
      } catch (error) {
        console.error("Failed to delete category", error);
      }
    }
  };

  if (loading) return <div>Loading categories...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Categories</h1>

      <form onSubmit={handleAdd} className="flex gap-4">
        <input
          type="text"
          placeholder="New Category Name..."
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          className="flex-1 px-4 py-2 rounded-md bg-card border border-border outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={!newCatName.trim()}
        >
          <Plus size={20} />
          Add
        </button>
      </form>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {categories.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-muted-foreground">
                  No categories found. Add your first category!
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="text-red-500 hover:underline text-sm font-medium"
                    >
                      Delete
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

