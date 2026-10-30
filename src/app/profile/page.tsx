"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Button } from "@/components/ui/Button";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-black">{label}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-black" : "bg-neutral-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
            checked ? "left-[1.375rem]" : "left-0.5"
          )}
        />
      </button>
    </div>
  );
}

const EMPTY_FORM: Omit<Address, "id"> = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
};

export default function ProfilePage() {
  const {
    user,
    addresses,
    orders,
    wishlist,
    logout,
    updateProfile,
    toast,
    addAddress,
    updateAddress,
    removeAddress,
  } = useStore();

  const [settings, setSettings] = useState<Record<string, boolean>>({
    emailNotify: true,
    smsNotify: false,
    whatsappNotify: true,
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem("saara:settings");
      if (raw) setSettings((s) => ({ ...s, ...JSON.parse(raw) }));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("saara:settings", JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [mobile, setMobile] = useState(user?.mobile ?? "");

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast("Name and email are required", "error");
      return;
    }
    updateProfile({ name: name.trim(), email: email.trim(), mobile });
    toast("Profile updated");
  };

  // Address editor
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<Omit<Address, "id">>(EMPTY_FORM);

  const startAdd = () => {
    setForm(EMPTY_FORM);
    setIsAdding(true);
    setEditingId(null);
  };
  const startEdit = (a: Address) => {
    const { id: _id, ...rest } = a;
    setForm(rest);
    setEditingId(a.id);
    setIsAdding(false);
  };
  const cancelAddressForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };
  const saveAddress = () => {
    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.line1.trim() ||
      !form.city.trim() ||
      !form.state.trim() ||
      !form.pincode.trim()
    ) {
      toast("Please complete all required address fields", "error");
      return;
    }
    if (editingId) {
      updateAddress(editingId, form);
      toast("Address updated");
    } else {
      addAddress(form);
      toast("Address added");
    }
    cancelAddressForm();
  };

  const links = [
    {
      href: "/orders",
      icon: Package,
      label: "My Orders",
      sub: `${orders.length} order${orders.length === 1 ? "" : "s"}`,
    },
    {
      href: "/wishlist",
      icon: Heart,
      label: "My Wishlist",
      sub: `${wishlist.length} saved item${wishlist.length === 1 ? "" : "s"}`,
    },
    {
      href: "/cart",
      icon: ShieldCheck,
      label: "Saved Payment Methods",
      sub: "UPI, cards & more",
    },
  ];

  const input =
    "h-11 w-full rounded-md border border-neutral-300 px-3 text-sm text-black outline-none transition-colors focus:border-black";

  return (
    <RequireAuth>
      <main className="mx-auto max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <h1 className="mb-5 text-xl font-extrabold text-black sm:text-2xl">My Profile</h1>

        <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
          {/* Left column */}
          <div className="space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-5 text-center">
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-2xl font-bold text-white">
                {user?.name ? user.name.trim().charAt(0).toUpperCase() : "U"}
              </span>
              <h2 className="mt-3 text-lg font-bold text-black">{user?.name}</h2>
              <p className="flex items-center justify-center gap-1.5 text-sm text-neutral-500">
                <Mail size={14} /> {user?.email}
              </p>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-neutral-500">
                <Phone size={14} /> {user?.mobile}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3.5 last:border-0 hover:bg-neutral-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100">
                    <l.icon size={18} className="text-black" />
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-black">{l.label}</p>
                    <p className="text-xs text-neutral-500">{l.sub}</p>
                  </div>
                  <ChevronRight size={16} className="text-neutral-400" />
                </Link>
              ))}
            </div>

            <Button
              variant="outline"
              fullWidth
              onClick={logout}
              className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
            >
              <LogOut size={16} /> Logout
            </Button>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Profile info */}
            <section className="rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-black">
                <UserIcon size={18} /> Profile Information
              </h2>
              <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-black">
                    Full name
                  </label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className={input} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-black">Email</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-black">
                    Mobile
                  </label>
                  <input
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className={input}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">Save Changes</Button>
                </div>
              </form>
            </section>

            {/* Addresses */}
            <section id="addresses" className="scroll-mt-40 rounded-lg border border-neutral-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-black">
                  <MapPin size={18} /> Saved Addresses
                </h2>
                {!isAdding && !editingId && (
                  <Button variant="outline" size="sm" onClick={startAdd}>
                    <Plus size={14} /> Add New Address
                  </Button>
                )}
              </div>

              {addresses.length === 0 && !isAdding && !editingId ? (
                <p className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                  No saved addresses yet. Add one to speed up checkout.
                </p>
              ) : null}

              <div className="space-y-3">
                {addresses.map((a) =>
                  editingId === a.id ? (
                    <AddressForm
                      key={a.id}
                      value={form}
                      onChange={setForm}
                      onCancel={cancelAddressForm}
                      onSave={saveAddress}
                    />
                  ) : (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-3 rounded-md border border-neutral-200 p-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-black">{a.name}</p>
                          <span className="flex items-center gap-1 text-xs text-neutral-500">
                            <Phone size={12} /> {a.phone}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-neutral-600">
                          {[a.line1, a.line2, a.landmark, a.city, `${a.state} - ${a.pincode}`]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => startEdit(a)}
                          aria-label="Edit address"
                          className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 hover:text-black"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => removeAddress(a.id)}
                          aria-label="Delete address"
                          className="rounded-md p-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  )
                )}

                {isAdding && (
                  <AddressForm
                    value={form}
                    onChange={setForm}
                    onCancel={cancelAddressForm}
                    onSave={saveAddress}
                  />
                )}
              </div>
            </section>

            {/* Settings */}
            <section id="settings" className="scroll-mt-40 rounded-lg border border-neutral-200 bg-white p-5">
              <h2 className="mb-2 text-base font-bold text-black">Account Settings</h2>
              <div className="divide-y divide-neutral-100">
                <Toggle
                  checked={settings.emailNotify}
                  onChange={(v) => setSettings({ ...settings, emailNotify: v })}
                  label="Email notifications"
                  description="Order updates and offers via email"
                />
                <Toggle
                  checked={settings.smsNotify}
                  onChange={(v) => setSettings({ ...settings, smsNotify: v })}
                  label="SMS alerts"
                  description="Delivery and tracking updates on SMS"
                />
                <Toggle
                  checked={settings.whatsappNotify}
                  onChange={(v) => setSettings({ ...settings, whatsappNotify: v })}
                  label="WhatsApp offers"
                  description="Exclusive deals shared on WhatsApp"
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </RequireAuth>
  );
}

function AddressForm({
  value,
  onChange,
  onCancel,
  onSave,
}: {
  value: Omit<Address, "id">;
  onChange: (v: Omit<Address, "id">) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  const input =
    "h-11 w-full rounded-md border border-neutral-300 px-3 text-sm text-black outline-none transition-colors focus:border-black";
  const set = (patch: Partial<Omit<Address, "id">>) => onChange({ ...value, ...patch });

  return (
    <div className="grid gap-3 rounded-md border border-neutral-200 p-4 sm:grid-cols-2">
      <input placeholder="Full name" value={value.name} onChange={(e) => set({ name: e.target.value })} className={input} />
      <input
        placeholder="Mobile number"
        value={value.phone}
        onChange={(e) => set({ phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
        className={input}
        inputMode="numeric"
      />
      <input placeholder="House / Flat" value={value.line1} onChange={(e) => set({ line1: e.target.value })} className={input} />
      <input placeholder="Street / Area" value={value.line2 ?? ""} onChange={(e) => set({ line2: e.target.value })} className={input} />
      <input placeholder="City" value={value.city} onChange={(e) => set({ city: e.target.value })} className={input} />
      <input placeholder="State" value={value.state} onChange={(e) => set({ state: e.target.value })} className={input} />
      <input
        placeholder="PIN Code"
        value={value.pincode}
        onChange={(e) => set({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
        className={input}
        inputMode="numeric"
      />
      <div className="flex items-center gap-2 sm:col-span-2 sm:mt-1">
        <Button size="sm" onClick={onSave}>
          Save Address
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}