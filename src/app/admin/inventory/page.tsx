"use client";

import { useState, useEffect, useRef } from "react";
import { getProducts, addProduct, deleteProduct, updateProduct, getCategories, addCategory, uploadImageToFirebase } from "@/lib/services";
import { Product, Category, ClubUnit } from "@/types";
import { Plus, Edit2, Trash2, Image as ImageIcon, Sparkles, Loader2, X, Search, CheckCircle, Upload, Layers, Users } from "lucide-react";

const CLUB_UNITS: ClubUnit[] = ["Tiger", "Capricorn", "Chrysanthemum", "Club Wears"];

const formatImageUrl = (img?: string) => {
  if (!img) return "";
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:") || img.startsWith("/")) {
    return img;
  }
  return `/images/${img}`;
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  // Single Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    unit: "Club Wears" as ClubUnit,
    imageUrls: [] as string[],
    requiresSize: false,
    requiresColor: false,
    stockQuantity: 15,
  });

  // Batch Upload Queue State (up to 15 items)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchQueue, setBatchQueue] = useState<string[]>([]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentItem?: string } | null>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedProducts, fetchedCategories] = await Promise.all([
        getProducts(),
        getCategories(),
      ]);
      setProducts(fetchedProducts);
      setCategories(fetchedCategories);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        description: product.description || "",
        price: product.price,
        categoryId: product.categoryId,
        unit: (product.unit as ClubUnit) || "General",
        imageUrls: product.imageUrls || [],
        requiresSize: product.requiresSize,
        requiresColor: product.requiresColor,
        stockQuantity: product.stockQuantity,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        price: 0,
        categoryId: categories[0]?.id || "",
        unit: "General",
        imageUrls: [],
        requiresSize: false,
        requiresColor: false,
        stockQuantity: 15,
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateProduct(editingId, formData);
      } else {
        await addProduct(formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Failed to save product.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this inventory item?")) {
      await deleteProduct(id);
      fetchData();
    }
  };

  // Upload local file from computer
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const downloadUrl = await uploadImageToFirebase(file);
      await handleSelectImage(downloadUrl);
    } catch (err: any) {
      console.error("File upload failed", err);
      alert(`Failed to upload image: ${err?.message || "Storage error"}`);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSelectImage = async (imageName: string) => {
    if (formData.imageUrls.includes(imageName)) return;

    let updatedImages = [...formData.imageUrls, imageName].slice(0, 7);
    setFormData(prev => ({ ...prev, imageUrls: updatedImages }));

    // Run AI if product name is empty or it's the primary image
    if (formData.name === "" || formData.imageUrls.length === 0) {
      setAnalyzingImage(true);
      try {
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageName })
        });
        const aiData = await res.json();

        if (aiData.name) {
          if (aiData.secondaryImage && !updatedImages.includes(aiData.secondaryImage)) {
            updatedImages = [...updatedImages, aiData.secondaryImage].slice(0, 7);
          }

          let catId = categories.find(c => c.name.toLowerCase() === aiData.category?.toLowerCase())?.id;
          if (!catId && aiData.category) {
            catId = await addCategory({ name: aiData.category });
            const updatedCats = await getCategories();
            setCategories(updatedCats);
          }

          setFormData(prev => ({
            ...prev,
            name: aiData.name || prev.name,
            description: aiData.description || prev.description,
            price: aiData.price ?? prev.price,
            categoryId: catId || prev.categoryId,
            unit: (aiData.unit as ClubUnit) || prev.unit,
            requiresSize: aiData.requiresSize ?? prev.requiresSize,
            requiresColor: aiData.requiresColor ?? prev.requiresColor,
            imageUrls: updatedImages,
          }));
        }
      } catch (err) {
        console.error("AI image analysis error:", err);
      } finally {
        setAnalyzingImage(false);
      }
    }
  };

  const removeImage = (img: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter(i => i !== img)
    }));
  };

  // --- BATCH UPLOAD QUEUE FUNCTIONS ---
  const toggleBatchImage = (img: string) => {
    if (batchQueue.includes(img)) {
      setBatchQueue(prev => prev.filter(i => i !== img));
    } else {
      if (batchQueue.length >= 15) {
        alert("Batch queue limit reached (maximum 15 items per batch).");
        return;
      }
      setBatchQueue(prev => [...prev, img]);
    }
  };

  const handleBatchFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFile(true);
    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        if (batchQueue.length + newUrls.length >= 15) break;
        const downloadUrl = await uploadImageToFirebase(files[i]);
        newUrls.push(downloadUrl);
      }
      setBatchQueue(prev => [...prev, ...newUrls].slice(0, 15));
    } catch (err: any) {
      console.error("Batch upload failed:", err);
      alert(`Error uploading batch files: ${err?.message || "Storage error"}`);
    } finally {
      setUploadingFile(false);
      if (batchFileInputRef.current) batchFileInputRef.current.value = "";
    }
  };

  const processBatchQueue = async () => {
    if (batchQueue.length === 0) return;
    setBatchProcessing(true);

    let successCount = 0;
    for (let i = 0; i < batchQueue.length; i++) {
      const imgName = batchQueue[i];
      setBatchProgress({ current: i + 1, total: batchQueue.length, currentItem: imgName });

      try {
        const res = await fetch('/api/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageName: imgName })
        });
        const aiData = await res.json();

        if (aiData.name) {
          let catId = categories.find(c => c.name.toLowerCase() === aiData.category?.toLowerCase())?.id;
          if (!catId && aiData.category) {
            catId = await addCategory({ name: aiData.category });
            const updatedCats = await getCategories();
            setCategories(updatedCats);
          }

          const imagesToAdd = [imgName];
          if (aiData.secondaryImage) {
            imagesToAdd.push(aiData.secondaryImage);
          }

          await addProduct({
            name: aiData.name,
            description: aiData.description || (aiData.unit && aiData.unit !== 'Club Wears' ? `${aiData.name} (${aiData.unit} Unit)` : `${aiData.name} (Club Wears)`),
            price: aiData.price || 50,
            categoryId: catId || "",
            unit: (aiData.unit as ClubUnit) || "Club Wears",
            imageUrls: imagesToAdd,
            requiresSize: aiData.requiresSize || false,
            requiresColor: aiData.requiresColor || false,
            stockQuantity: 20,
          });
          successCount++;
        }
      } catch (err) {
        console.warn(`Failed batch item ${imgName}:`, err);
      }
    }

    setBatchProcessing(false);
    setBatchProgress(null);
    setBatchQueue([]);
    setIsBatchModalOpen(false);
    alert(`Successfully processed and created ${successCount} products!`);
    fetchData();
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.unit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCat = categoryFilter === "All" || categories.find(c => c.id === p.categoryId)?.name === categoryFilter;
    return matchesSearch && matchesCat;
  });

  if (loading) return <div className="p-8 font-semibold text-muted-foreground">Loading inventory catalogue...</div>;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Inventory & Souvenirs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage club souvenirs, descriptions, unit themes (Tiger, Capricorn, Chrysanthemum & Club Wears), and AI auto-recognition</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Batch Upload Modal Trigger */}
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl border border-primary/30 bg-primary/10 text-primary font-bold text-xs sm:text-sm hover:bg-primary/20 flex items-center gap-2 transition-all shadow-sm"
          >
            <Layers size={18} />
            Batch Upload (Up to 15)
          </button>

          {/* Add Single Product */}
          <button
            onClick={() => handleOpenModal()}
            className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus size={18} />
            Add New Souvenir
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-3 rounded-2xl border border-border shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search items by name, unit, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-bold">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 text-sm bg-background border border-border rounded-xl outline-none focus:border-primary"
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Horizontal Swipe Indicator for Mobile */}
      <div className="md:hidden flex items-center justify-between text-[11px] text-muted-foreground px-1 font-semibold">
        <span>👈 Swipe table sideways to view all columns 👉</span>
      </div>

      {/* Inventory Table */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground text-xs uppercase font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4">Item & Photos</th>
              <th className="px-6 py-4">Unit / Mascot</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Price (GHC)</th>
              <th className="px-6 py-4">Stock Level</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                  <div className="max-w-xs mx-auto space-y-2">
                    <p className="font-bold text-foreground">No products found</p>
                    <p className="text-xs">Use &quot;Batch Upload&quot; or &quot;Add New Souvenir&quot; above to add items to your catalogue!</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const isLow = product.stockQuantity <= 5;
                const isOut = product.stockQuantity <= 0;
                return (
                  <tr key={product.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted border border-border flex-shrink-0 relative">
                        {product.imageUrls?.[0] ? (
                          <img
                            src={formatImageUrl(product.imageUrls[0])}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No img</div>
                        )}
                        {product.imageUrls && product.imageUrls.length > 1 && (
                          <span className="absolute bottom-0 right-0 bg-black/75 text-[9px] text-white px-1 rounded-tl font-bold">
                            +{product.imageUrls.length - 1}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{product.name}</div>
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 italic">{product.description}</p>
                        )}
                        <div className="text-[11px] text-muted-foreground">
                          {product.requiresSize && "Sizes: S-3XL"}
                          {product.requiresSize && product.requiresColor && " • "}
                          {product.requiresColor && "Colors available"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-foreground flex items-center gap-1 w-fit">
                        <Users size={12} className="text-primary" /> {product.unit === "General" ? "Club Wears" : (product.unit || "Club Wears")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      {categories.find((c) => c.id === product.categoryId)?.name || "Uncategorized"}
                    </td>
                    <td className="px-6 py-4 font-black text-primary text-base">
                      GHC {product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        isOut 
                          ? 'bg-red-500/10 text-red-600 border border-red-500/20' 
                          : isLow 
                          ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' 
                          : 'bg-green-500/10 text-green-600 border border-green-500/20'
                      }`}>
                        {isOut ? "Out of Stock" : `${product.stockQuantity} in stock`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenModal(product)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-xl transition-colors inline-block"
                        title="Edit product"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors inline-block"
                        title="Delete product"
                      >
                        <Trash2 size={16} />
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

      {/* --- BATCH UPLOAD QUEUE MODAL (UP TO 15 ITEMS) --- */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border p-6 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Layers className="text-primary" size={22} /> Batch Multi-Product Uploader
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select up to 15 main photos. The AI will inspect emblems (Goat = Capricorn, Tiger = Tiger, Flower = Chrysanthemum, Peacock = General) and auto-pair secondary (b) photos.
                </p>
              </div>
              <button onClick={() => setIsBatchModalOpen(false)} className="p-1.5 rounded-full hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            {/* Upload from Files Button for Batch */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={batchFileInputRef}
                multiple
                accept="image/*"
                onChange={handleBatchFileUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => batchFileInputRef.current?.click()}
                disabled={uploadingFile || batchQueue.length >= 15}
                className="px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center gap-2 border border-border transition-all"
              >
                {uploadingFile ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                Upload New Photos from Files
              </button>

              <span className="text-xs font-semibold text-muted-foreground">
                Queue: <strong className="text-primary">{batchQueue.length} / 15</strong> selected
              </span>
            </div>

            {/* Selected Queue Tray */}
            <div className="p-4 bg-muted/30 border border-border rounded-2xl">
              <span className="text-xs font-bold uppercase text-muted-foreground block mb-2">
                Selected Main Images for Batch:
              </span>
              {batchQueue.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-8 text-center">
                  No photos in the batch queue yet. Click &quot;Upload New Photos from Files&quot; above to select photos from your device!
                </p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {batchQueue.map((img, idx) => (
                    <div key={img} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-primary bg-card shadow-sm">
                      <img src={formatImageUrl(img)} alt="" className="w-full h-full object-cover" />
                      <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleBatchImage(img)}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove from batch"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>



            {/* Batch Progress Bar if running */}
            {batchProcessing && batchProgress && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-primary">
                  <span>Processing item {batchProgress.current} of {batchProgress.total} with AI...</span>
                  <span>{batchProgress.currentItem}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                disabled={batchProcessing}
                className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={processBatchQueue}
                disabled={batchProcessing || batchQueue.length === 0}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {batchProcessing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {batchProcessing ? "Analyzing & Uploading..." : `Process & Upload (${batchQueue.length} items)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD / EDIT SINGLE SOUVENIR MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-card border border-border p-6 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-6 shadow-2xl">
            
            {/* Form Column */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="text-xl font-bold">
                  {editingId ? "Edit Souvenir Item" : "Add New Souvenir Item"}
                </h2>
                {analyzingImage && (
                  <span className="flex items-center gap-1.5 text-xs text-primary font-bold animate-pulse">
                    <Loader2 size={14} className="animate-spin" /> AI analyzing mascot & unit...
                  </span>
                )}
              </div>

              <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                    Product Title *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Unit Hoodie - Capricorn or Club Hoodie"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                    Description (Unit Details)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Official Unit Hoodie for Capricorn Unit, featuring the goat emblem."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-xs outline-none focus:border-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                      Price (GHC) *
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary font-bold text-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                      Stock Quantity *
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary"
                    >
                      <option value="" disabled>Select category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-muted-foreground mb-1">
                      Club Unit / Group *
                    </label>
                    <select
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value as ClubUnit })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm outline-none focus:border-primary font-bold"
                    >
                      {CLUB_UNITS.map((u) => (
                        <option key={u} value={u}>{u === "Club Wears" ? "Club Wears" : `${u} Unit`}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 p-3.5 bg-muted/40 rounded-2xl border border-border text-xs">
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={formData.requiresSize}
                      onChange={(e) => setFormData({ ...formData, requiresSize: e.target.checked })}
                      className="w-4 h-4 rounded text-primary"
                    />
                    Requires Size (Clothes/Shirts/Hoodies)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold">
                    <input
                      type="checkbox"
                      checked={formData.requiresColor}
                      onChange={(e) => setFormData({ ...formData, requiresColor: e.target.checked })}
                      className="w-4 h-4 rounded text-primary"
                    />
                    Requires Color
                  </label>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="productForm"
                    className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-md"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </div>

            {/* Right Column: Upload from File & Attached Photos */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
              <div>
                {/* Upload from Computer */}
                <div className="mb-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile || formData.imageUrls.length >= 7}
                    className="w-full py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-primary/20 transition-all shadow-sm"
                  >
                    {uploadingFile ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    Upload Photo from Device (Phone / PC)
                  </button>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                    <ImageIcon size={14} /> Attached Photos ({formData.imageUrls.length}/7)
                  </h3>
                  {formData.imageUrls.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, imageUrls: [] }))}
                      className="text-[11px] text-red-500 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Selected Images Tray */}
                <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-2xl min-h-24 border border-border">
                  {formData.imageUrls.map((img, idx) => (
                    <div key={img} className="relative group w-16 h-16 rounded-xl overflow-hidden border border-border bg-card shadow-sm">
                      <img src={formatImageUrl(img)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(img)}
                        className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove photo"
                      >
                        <X size={16} />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-primary text-[8px] text-white text-center font-bold">Main</span>
                      )}
                      {idx === 1 && (
                        <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-white text-center font-bold">2nd (b)</span>
                      )}
                    </div>
                  ))}
                  {formData.imageUrls.length === 0 && (
                    <div className="text-xs text-muted-foreground py-8 text-center italic w-full">
                      No photos attached yet. Click &quot;Upload Photo from Device&quot; above to attach pictures of this souvenir.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
