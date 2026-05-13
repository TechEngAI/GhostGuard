"use client";

import { useEffect, useState } from "react";
import PageWrapper from "@/components/shared/PageWrapper";
import { Button } from "@/components/ui/Button";
import { AUTH_HERO_IMAGE_KEY } from "@/lib/utils";
import toast from "react-hot-toast";
import { Image as ImageIcon, RotateCcw, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [imageUrl, setImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_HERO_IMAGE_KEY);
    if (saved) {
      setImageUrl(saved);
      setPreviewUrl(saved);
    }
  }, []);

  const handleSave = () => {
    if (imageUrl) {
      localStorage.setItem(AUTH_HERO_IMAGE_KEY, imageUrl);
      setPreviewUrl(imageUrl);
      toast.success("Branding updated successfully!");
    }
  };

  const handleReset = () => {
    localStorage.removeItem(AUTH_HERO_IMAGE_KEY);
    setImageUrl("");
    setPreviewUrl("");
    toast.success("Branding reset to default.");
  };

  return (
    <PageWrapper className="p-8 max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black tracking-tight text-ink">Settings</h1>
        <p className="text-sm font-medium text-ink-secondary mt-1">
          Configure platform branding and system preferences.
        </p>
      </div>

      <div className="grid gap-8">
        <section className="bg-white rounded-[32px] border border-border p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-light flex items-center justify-center text-brand">
              <ImageIcon size={20} />
            </div>
            <h2 className="text-xl font-black text-ink">Portal Branding</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-ink-tertiary mb-2 block">
                Auth Page Hero Image URL
              </label>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..." 
                  className="flex-1 rounded-xl border border-border bg-gray-50 px-4 py-3 text-sm font-bold focus:border-brand focus:ring-4 focus:ring-brand/5 outline-none transition-all"
                />
                <Button onClick={handleSave} className="rounded-xl px-6 font-bold">
                  <Save size={18} className="mr-2" /> Save
                </Button>
              </div>
              <p className="mt-2 text-xs text-ink-tertiary">
                Provide a direct image URL (Unsplash, etc.) to customize the left panel on login and register pages.
              </p>
            </div>

            {previewUrl && (
              <div className="pt-6 border-t border-border">
                <label className="text-[10px] font-black uppercase tracking-widest text-ink-tertiary mb-4 block">
                  Preview
                </label>
                <div className="relative aspect-video w-full max-w-md rounded-2xl border-4 border-gray-100 overflow-hidden shadow-inner bg-gray-50">
                  <img 
                    src={previewUrl} 
                    alt="Branding Preview" 
                    className="w-full h-full object-cover"
                    onError={() => toast.error("Invalid image URL")}
                  />
                </div>
                <button 
                  onClick={handleReset}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                >
                  <RotateCcw size={14} /> Reset to system default
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}
