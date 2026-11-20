"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Edit2, Trash2, Star, Flame, Leaf, Eye, EyeOff,
  Upload, X, RefreshCw, Search, Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";
import { ALLERGEN_LABELS, categoryLabels, type AllergenKey } from "@/lib/menu-data";

type Category = "STARTER"|"MAIN"|"SIDE"|"RICE"|"BREAD"|"SPECIAL";

interface DBMenuItem {
  id: string; name: string; description: string; price: number;
  category: Category; isSpecial: boolean; isAvailable: boolean;
  allergens: string[]; imageUrl: string | null;
}

interface FormState {
  name: string; description: string; price: string;
  category: Category; isSpecial: boolean; isAvailable: boolean;
  allergens: string[]; isVegan: boolean; isVegetarian: boolean; isSpicy: boolean;
  imageUrl: string;
}

const EMPTY_FORM: FormState = {
  name: "", description: "", price: "",
  category: "MAIN", isSpecial: false, isAvailable: true,
  allergens: [], isVegan: false, isVegetarian: false, isSpicy: false,
  imageUrl: "",
};

const DB_CATEGORY_LABELS: Record<Category, string> = {
  STARTER: "Starters", MAIN: "Main Course", SIDE: "Side Dishes",
  RICE: "Rice & Biryani", BREAD: "Breads", SPECIAL: "Today's Specials",
};

export default function MenuAdmin() {
  const { toast }  = useToast();
  const fileRef    = useRef<HTMLInputElement>(null);

  const [items,      setItems]      = useState<DBMenuItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading,  setUploading]  = useState(false);
  const [form,       setForm]       = useState<FormState>(EMPTY_FORM);
  const [filter,     setFilter]     = useState<Category | "ALL">("ALL");
  const [search,     setSearch]     = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/menu");
      const data = await res.json();
      setItems(data.items ?? []);
    } catch { toast("Failed to load menu.", "error"); }
    finally  { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const sf = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleAllergen = (key: string) =>
    sf("allergens", form.allergens.includes(key)
      ? form.allergens.filter((a) => a !== key)
      : [...form.allergens, key]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit   = (item: DBMenuItem) => {
    setEditing(item.id);
    setForm({
      name: item.name, description: item.description, price: String(item.price),
      category: item.category, isSpecial: item.isSpecial, isAvailable: item.isAvailable,
      allergens: item.allergens, isVegan: false, isVegetarian: false, isSpicy: false,
      imageUrl: item.imageUrl ?? "",
    });
    setShowForm(true);
  };

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      // Get pre-signed URL from our API
      const res  = await fetch("/api/menu/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { uploadUrl, publicUrl } = await res.json();

      // Upload directly to S3
      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      sf("imageUrl", publicUrl);
      toast("Image uploaded.", "success");
    } catch {
      toast("Image upload failed. Check S3 configuration.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.description) {
      toast("Name, price and description are required.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim(),
        price:       parseFloat(form.price),
        category:    form.category,
        isSpecial:   form.isSpecial,
        isAvailable: form.isAvailable,
        allergens:   form.allergens,
        imageUrl:    form.imageUrl || null,
      };

      const res = editing
        ? await fetch(`/api/menu/${editing}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/menu", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) throw new Error();
      toast(editing ? "Menu item updated." : "Menu item created.", "success");
      setShowForm(false);
      fetchItems();
    } catch { toast("Could not save menu item.", "error"); }
    finally  { setSaving(false); }
  };

  const handleToggleAvailable = async (item: DBMenuItem) => {
    try {
      await fetch(`/api/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      });
      fetchItems();
    } catch { toast("Could not update availability.", "error"); }
  };

  const handleSetSpecial = async (item: DBMenuItem) => {
    try {
      // Clear existing specials first, then set this one
      await Promise.all(
        items.filter((i) => i.isSpecial && i.id !== item.id).map((i) =>
          fetch(`/api/menu/${i.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isSpecial: false, category: i.category === "SPECIAL" ? "MAIN" : i.category }),
          })
        )
      );
      await fetch(`/api/menu/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSpecial: true, category: "SPECIAL" }),
      });
      toast(`"${item.name}" is now Today's Special.`, "success");
      fetchItems();
    } catch { toast("Could not set special.", "error"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this menu item? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast("Item deleted.", "success");
      fetchItems();
    } catch { toast("Could not delete item.", "error"); }
    finally  { setDeletingId(null); }
  };

  // Filter + search
  const displayed = items.filter((i) => {
    const matchCat    = filter === "ALL" || i.category === filter;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Group by category
  const grouped = (["SPECIAL","STARTER","MAIN","SIDE","RICE","BREAD"] as Category[]).reduce<Record<string, DBMenuItem[]>>(
    (acc, cat) => {
      const list = displayed.filter((i) => i.category === cat);
      if (list.length) acc[cat] = list;
      return acc;
    }, {}
  );

  const stats = {
    total:     items.length,
    available: items.filter((i) => i.isAvailable).length,
    hidden:    items.filter((i) => !i.isAvailable).length,
    specials:  items.filter((i) => i.isSpecial).length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-3xl text-charcoal-900">Menu Management</h1>
        <p className="text-gray-500 text-sm font-body mt-1">
          Add, edit and hide dishes. Set Today&apos;s Special. Upload images to S3.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Items",     value: stats.total,     col: "border-charcoal-700" },
          { label: "Available",       value: stats.available, col: "border-green-400" },
          { label: "Hidden",          value: stats.hidden,    col: "border-gray-300" },
          { label: "Today's Special", value: stats.specials,  col: "border-gold" },
        ].map((s) => (
          <div key={s.label} className={`bg-white border-l-4 ${s.col} border border-gray-100 p-4`}>
            <p className="font-display text-2xl text-charcoal-900">{s.value}</p>
            <p className="text-xs text-gray-500 font-body">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center mb-5">
        <Button onClick={openCreate} size="sm"><Plus size={15} /> Add Item</Button>

        {/* Category filter */}
        <div className="flex gap-1 flex-wrap">
          {(["ALL","SPECIAL","STARTER","MAIN","SIDE","RICE","BREAD"] as const).map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-3 py-1.5 text-xs font-body transition-colors border whitespace-nowrap ${
                filter === c ? "bg-charcoal-800 text-white border-charcoal-800" : "border-gray-300 text-gray-600 hover:border-gray-400"
              }`}>
              {c === "ALL" ? "All" : DB_CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dishes…"
            className="pl-8 pr-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-spice-400 font-body w-48" />
        </div>

        <Button variant="outline" size="sm" onClick={fetchItems}><RefreshCw size={13} /> Refresh</Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display text-xl text-charcoal-900">{editing ? "Edit Item" : "Add New Item"}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Name *" value={form.name} onChange={(e) => sf("name", e.target.value)} placeholder="e.g. Chicken Tikka Masala" />
            <div className="flex gap-3">
              <div className="flex-1">
                <Input label="Price (£) *" type="number" step="0.01" min="0" value={form.price}
                  onChange={(e) => sf("price", e.target.value)} placeholder="12.95" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-body text-sm font-medium text-charcoal-800">Category *</label>
                <select value={form.category} onChange={(e) => sf("category", e.target.value as Category)}
                  className="px-3 py-3 border border-gray-300 text-sm font-body focus:outline-none focus:ring-2 focus:ring-spice-400 bg-white">
                  {(Object.entries(DB_CATEGORY_LABELS) as [Category, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="font-body text-sm font-medium text-charcoal-800 block mb-1.5">Description *</label>
              <textarea value={form.description} onChange={(e) => sf("description", e.target.value)} rows={3}
                placeholder="Describe the dish — flavours, cooking method, key ingredients…"
                className="w-full px-4 py-3 border border-gray-300 text-sm font-body focus:outline-none focus:ring-2 focus:ring-spice-400 resize-none" />
            </div>

            {/* Flags */}
            <div className="md:col-span-2 flex flex-wrap gap-3">
              {[
                { key: "isSpecial",   label: "Today's Special", icon: <Sparkles size={14} />, colour: "border-gold text-amber-700 bg-saffron-50" },
                { key: "isAvailable", label: "Available",       icon: <Eye size={14} />,       colour: "border-green-400 text-green-700 bg-green-50" },
              ].map((flag) => (
                <button key={flag.key} type="button"
                  onClick={() => sf(flag.key as keyof FormState, !form[flag.key as keyof FormState] as never)}
                  className={`flex items-center gap-2 px-4 py-2 border text-sm font-body transition-colors ${
                    form[flag.key as keyof FormState] ? flag.colour : "border-gray-200 text-gray-400 bg-white"
                  }`}>
                  {flag.icon} {flag.label}
                </button>
              ))}
            </div>

            {/* Allergens */}
            <div className="md:col-span-2">
              <label className="font-body text-sm font-medium text-charcoal-800 block mb-2">Allergens</label>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(ALLERGEN_LABELS) as [AllergenKey, { label: string; emoji: string; color: string }][]).map(([key, val]) => (
                  <button key={key} type="button" onClick={() => toggleAllergen(key)}
                    className={`px-3 py-1.5 text-xs font-body border transition-colors ${
                      form.allergens.includes(key)
                        ? `${val.color} border-transparent`
                        : "border-gray-200 text-gray-400 hover:border-gray-300"
                    }`}>
                    {val.emoji} {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div className="md:col-span-2">
              <label className="font-body text-sm font-medium text-charcoal-800 block mb-2">
                Dish Image <span className="text-gray-400 font-normal">(optional — uploaded to S3)</span>
              </label>
              <div className="flex gap-3 items-start">
                {form.imageUrl ? (
                  <div className="relative w-20 h-20 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover border border-gray-200" />
                    <button onClick={() => sf("imageUrl", "")}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-spice-500 text-white rounded-full flex items-center justify-center">
                      <X size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                    <Upload size={18} className="text-gray-300" />
                  </div>
                )}
                <div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />
                  <Button size="sm" variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>
                    <Upload size={14} /> {uploading ? "Uploading…" : "Upload Image"}
                  </Button>
                  <p className="text-xs text-gray-400 font-body mt-1.5">JPG, PNG, WebP · max 5 MB</p>
                  {!form.imageUrl && (
                    <p className="text-xs text-gray-400 font-body mt-1">
                      Or paste a URL:{" "}
                      <input value={form.imageUrl} onChange={(e) => sf("imageUrl", e.target.value)}
                        placeholder="https://…"
                        className="border-b border-gray-300 text-xs font-body focus:outline-none focus:border-spice-400 w-48 px-1" />
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-5 border-t border-gray-100">
            <Button onClick={handleSave} loading={saving}>{editing ? "Save Changes" : "Add to Menu"}</Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Menu items grouped by category */}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 py-12">
          <div className="w-5 h-5 border-2 border-spice-400 border-t-transparent rounded-full animate-spin" />
          <span className="font-body text-sm">Loading menu…</span>
        </div>
      ) : Object.entries(grouped).length === 0 ? (
        <div className="text-center py-12 border border-dashed border-gray-200">
          <p className="text-gray-400 font-body text-sm">No items found. Add one above.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="font-display text-xl text-charcoal-900">{DB_CATEGORY_LABELS[cat as Category]}</h2>
                {cat === "SPECIAL" && (
                  <span className="bg-saffron-500 text-charcoal-900 text-xs font-body font-semibold px-2 py-0.5">Today</span>
                )}
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-body">{catItems.length} items</span>
              </div>

              <div className="border border-gray-200 bg-white divide-y divide-gray-100">
                {catItems.map((item) => (
                  <div key={item.id}
                    className={`flex items-center gap-4 p-4 ${!item.isAvailable ? "opacity-50" : ""}`}>
                    {/* Image thumbnail */}
                    <div className="w-12 h-12 shrink-0 bg-gray-100 overflow-hidden">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">🍛</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-body font-medium text-charcoal-800 text-sm truncate">{item.name}</p>
                        {item.isSpecial && <Star size={12} className="text-gold fill-gold shrink-0" />}
                        {!item.isAvailable && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 font-body shrink-0">Hidden</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-body truncate">{item.description}</p>
                      {item.allergens.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {item.allergens.slice(0, 5).map((a) => {
                            const al = ALLERGEN_LABELS[a as AllergenKey];
                            return al ? <span key={a} title={al.label} className="text-xs">{al.emoji}</span> : null;
                          })}
                          {item.allergens.length > 5 && (
                            <span className="text-xs text-gray-400">+{item.allergens.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Price */}
                    <span className="font-display text-base text-charcoal-900 shrink-0">
                      {formatPrice(item.price)}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!item.isSpecial && (
                        <button onClick={() => handleSetSpecial(item)} title="Set as Today's Special"
                          className="p-2 text-gray-300 hover:text-gold transition-colors border border-transparent hover:border-gold/30">
                          <Sparkles size={14} />
                        </button>
                      )}
                      <button onClick={() => handleToggleAvailable(item)} title={item.isAvailable ? "Hide from menu" : "Show on menu"}
                        className="p-2 text-gray-300 hover:text-blue-500 transition-colors border border-transparent hover:border-blue-200">
                        {item.isAvailable ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                      <button onClick={() => openEdit(item)} title="Edit"
                        className="p-2 text-gray-300 hover:text-spice-500 transition-colors border border-transparent hover:border-spice-200">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} title="Delete"
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors border border-transparent hover:border-red-200 disabled:opacity-30">
                        {deletingId === item.id
                          ? <div className="w-3.5 h-3.5 border border-red-300 border-t-transparent rounded-full animate-spin" />
                          : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
