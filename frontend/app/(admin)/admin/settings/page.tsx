"use client";

import { useEffect, useState } from "react";
import PageWrapper from "@/components/shared/PageWrapper";
import { CompanySetupForm } from "@/components/onboarding/CompanySetupForm";
import { Button } from "@/components/ui/Button";
import { AUTH_HERO_IMAGE_KEY } from "@/lib/utils";
import toast from "react-hot-toast";
import { Building2, Image as ImageIcon, MapPin, RotateCcw, Save } from "lucide-react";

type SettingsSection = "company" | "branding";

const sections: Array<{
  id: SettingsSection;
  label: string;
  description: string;
  icon: typeof Building2;
}> = [
  {
    id: "company",
    label: "Company setup",
    description: "Work days, office boundary, payroll cycle",
    icon: MapPin,
  },
  {
    id: "branding",
    label: "Portal branding",
    description: "Login and register page image",
    icon: ImageIcon,
  },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>("company");
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
    <PageWrapper
      className="p-8"
      title="Settings"
      subtitle="Edit your company setup, office location, work schedule, and portal branding."
    >
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-lg border border-border bg-white p-3 shadow-sm">
          <nav className="space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors ${
                    active ? "bg-brand text-white" : "text-ink hover:bg-gray-50"
                  }`}
                >
                  <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${active ? "text-white" : "text-brand"}`} />
                  <span>
                    <span className="block text-sm font-black">{section.label}</span>
                    <span className={`mt-0.5 block text-xs font-medium ${active ? "text-white/80" : "text-ink-secondary"}`}>
                      {section.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          {activeSection === "company" && (
            <section>
              <CompanySetupForm mode="settings" />
            </section>
          )}

          {activeSection === "branding" && (
        <section className="rounded-lg border border-border bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-light text-brand">
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
                <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border-4 border-gray-100 bg-gray-50 shadow-inner">
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
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
