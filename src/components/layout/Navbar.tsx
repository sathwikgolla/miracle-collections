"use client";

function YouTubeBadgeIcon({ className = "h-3.5 w-4 shrink-0" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 18" fill="none">
      <path
        d="M23.498 3.186a3.016 3.016 0 0 0-2.122-2.136C19.505.545 12 .545 12 .545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 3.186C0 5.07 0 9 0 9s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 12.93 24 9 24 9s0-3.93-.502-5.814z"
        fill="#FF0000"
      />
      <polygon points="9.5,5.5 16,9 9.5,12.5" fill="white" />
    </svg>
  );
}

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  GitCompareArrows,
  Heart,
  LayoutGrid,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Package,
  Settings,
  ShoppingCart,
  Sun,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { SearchBar } from "@/components/layout/SearchBar";
import { NotificationsPanel, NotificationBellIcon } from "@/components/layout/NotificationsPanel";
import { useStore } from "@/context/StoreContext";
import { GENDER_OPTIONS } from "@/lib/gender";
import type { Category, Gender } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Navbar() {
  const {
    cart,
    wishlist,
    user,
    logout,
    compare,
    theme,
    toggleTheme,
    hydrated,
    products,
    categories: dbCategories,
  } = useStore();
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = pathname === "/products" ? searchParams.get("category") ?? "all" : "";
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [canHover, setCanHover] = useState(true);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Prefer the catalog categories from the database; fall back to whatever the
  // product set contains so the nav still works before the seed is applied.
  const categories = useMemo<Category[]>(() => {
    if (dbCategories && dbCategories.length > 0) return dbCategories;
    return Array.from(new Set(products.map((p: any) => (p as any).categoryId))).map((id) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      slug: id.toLowerCase(),
      image: "",
      description: "",
    }));
  }, [dbCategories, products]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pointer devices get the hover mega menu; touch devices navigate directly and
  // use the expandable mobile drawer instead.
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanHover(mq.matches);
    const onChange = () => setCanHover(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const cartCount = mounted ? cart.reduce((n, i) => n + i.qty, 0) : 0;
  const wishlistCount = mounted ? wishlist.length : 0;
  const compareCount = mounted ? compare.length : 0;
  const currentUser = mounted ? user : null;

  useEffect(() => {
    setMenuOpen(false);
    setUserOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) setExpandedCat(null);
  }, [menuOpen]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const iconBtn =
    "relative flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 hover:text-black transition-colors";

  const badge =
    "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white";

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
      {/* Utility strip */}
      <div className="hidden bg-black text-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-[11px] tracking-wide sm:px-6">
          <p>Free delivery on orders over ₹499 · Easy 7-day returns</p>
          <div className="flex items-center gap-5">
            <Link href="/orders" className="hover:underline">
              Track Order
            </Link>
            <Link href="/profile" className="hover:underline">
              Help & Support
            </Link>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="mx-auto max-w-7xl px-4 pt-3 sm:px-6">
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Hamburger (mobile) */}
          <button
            className="rounded-md p-2 text-black hover:bg-neutral-100 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>

          <Logo />

          {/* Search (desktop) */}
          <SearchBar className="ml-4 hidden flex-1 lg:flex" />

          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              suppressHydrationWarning
              className="flex h-11 items-center justify-center rounded-md px-2 text-neutral-600 hover:bg-neutral-100 hover:text-black"
            >
              {mounted && theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
                suppressHydrationWarning
                className="flex items-center justify-center rounded-md px-2 py-1.5 text-neutral-700 hover:bg-neutral-100 hover:text-black"
              >
                <NotificationBellIcon />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 animate-fade-in">
                  <NotificationsPanel />
                </div>
              )}
            </div>

            {/* Compare */}
            <Link href="/compare" className={cn(iconBtn, "hidden sm:flex")}>
              <span className="relative">
                <GitCompareArrows size={22} />
                {compareCount > 0 && <span className={badge}>{compareCount}</span>}
              </span>
              <span className="text-[11px] font-medium">Compare</span>
            </Link>

            {/* Login / user */}
            <div className="relative hidden lg:block" ref={userRef}>
              {currentUser ? (
                <>
                  <button
                    onClick={() => setUserOpen((o) => !o)}
                    className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-black hover:bg-neutral-100"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-xs font-bold text-white">
                      {currentUser.name ? currentUser.name.trim().charAt(0).toUpperCase() : "U"}
                    </span>
                    Hi, {currentUser.name.split(" ")[0]}
                    <ChevronDown size={14} className="text-neutral-400" />
                  </button>
                  {userOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-md border border-neutral-200 bg-white py-1 shadow-lg">
                      <div className="border-b border-neutral-100 px-4 py-3">
                        <p className="text-sm font-semibold text-black">{currentUser.name}</p>
                        <p className="text-xs text-neutral-500">{currentUser.email}</p>
                      </div>
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <User size={15} /> My Profile
                      </Link>
                      <Link
                        href="/orders"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Package size={15} /> My Orders
                      </Link>
                      <Link
                        href="/wishlist"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Heart size={15} /> Wishlist
                      </Link>
                      <Link
                        href="/profile#addresses"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <MapPin size={15} /> Saved Addresses
                      </Link>
                      <Link
                        href="/profile#settings"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <Settings size={15} /> Settings
                      </Link>
                      <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex h-11 items-center gap-2 rounded-md border border-black px-4 text-sm font-semibold text-black transition-colors hover:bg-black hover:text-white"
                >
                  <User size={16} />
                  Login / Sign Up
                </Link>
              )}
            </div>

            {/* Wishlist */}
            <Link href="/wishlist" className={cn(iconBtn, "hidden sm:flex")}>
              <span className="relative">
                <Heart size={22} />
                {wishlistCount > 0 && <span className={badge}>{wishlistCount}</span>}
              </span>
              <span className="text-[11px] font-medium">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link href="/cart" className={iconBtn}>
              <span className="relative">
                <ShoppingCart size={22} />
                {cartCount > 0 && <span className={badge}>{cartCount}</span>}
              </span>
              <span className="text-[11px] font-medium">Cart</span>
            </Link>
          </div>
        </div>

        {/* Search (mobile, full width) */}
        <SearchBar className="my-3 lg:hidden" />

        {/* Category nav (horizontal scroll on mobile) */}
        <nav
          className={cn(
            "no-scrollbar flex w-full items-center justify-between py-2 sm:w-auto sm:justify-start sm:gap-4 lg:gap-6",
            // Keep the dropdown unclipped on hover devices; scroll horizontally on touch if needed.
            canHover ? "overflow-visible" : "overflow-x-auto sm:overflow-visible"
          )}
        >
          <Link
            href="/"
            className={cn(
              "relative whitespace-nowrap px-2.5 py-1.5 text-sm font-medium transition-colors",
              pathname === "/"
                ? "font-bold text-black after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-black"
                : "text-neutral-600 hover:text-black"
            )}
          >
            Home
          </Link>
          <Link
            href="/products"
            className={cn(
              "relative whitespace-nowrap px-2.5 py-1.5 text-sm font-medium transition-colors",
              activeCategory === "all"
                ? "font-bold text-black after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-black"
                : "text-neutral-600 hover:text-black"
            )}
          >
            All
          </Link>
          {categories.map((c) => (
            <CategoryNavItem
              key={c.id}
              category={c}
              active={activeCategory === c.id}
              canHover={canHover}
            />
          ))}
          <Link
            href="/videos"
            className={cn(
              "relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
              pathname === "/videos"
                ? "font-bold text-black after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-black"
                : "text-neutral-600 hover:text-black"
            )}
          >
            <YouTubeBadgeIcon />
            <span>YouTube</span>
          </Link>
        </nav>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl animate-slide-right">
            <div className="flex items-center justify-between border-b border-neutral-200 p-4">
              <Logo />
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
              >
                <X size={22} />
              </button>
            </div>

            {currentUser && (
              <div className="flex items-center gap-3 border-b border-neutral-200 bg-neutral-50 px-4 py-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-sm font-bold text-white">
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-bold text-black">{currentUser.name}</p>
                  <span className="text-xs text-neutral-500">{currentUser.email}</span>
                </div>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto p-2">
              <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Shop by category
              </p>
              <Link
                href="/products"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-black hover:bg-neutral-50"
              >
                <Package size={18} className="text-neutral-400" />
                All Products
              </Link>
              {categories.map((c) => {
                const expanded = expandedCat === c.id;
                return (
                  <div key={c.id}>
                    <button
                      onClick={() => setExpandedCat(expanded ? null : c.id)}
                      aria-expanded={expanded}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <LayoutGrid size={18} className="text-neutral-400" />
                      {c.name}
                      <ChevronDown
                        size={16}
                        className={cn(
                          "ml-auto text-neutral-400 transition-transform duration-200",
                          expanded && "rotate-180"
                        )}
                      />
                    </button>
                    {expanded && (
                      <div className="ml-4 overflow-hidden border-l border-neutral-200 pl-2 animate-fade-in">
                        <Link
                          href={`/products?category=${c.id}`}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-black hover:bg-neutral-50"
                        >
                          Shop all {c.name}
                        </Link>
                        {GENDER_OPTIONS.map((g) => (
                          <Link
                            key={g.id}
                            href={`/products?category=${c.id}&gender=${g.id}`}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-black"
                          >
                            {g.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              <Link
                href="/videos"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-black hover:bg-neutral-50"
              >
                <YouTubeBadgeIcon className="h-4 w-4" />
                <span>YouTube Videos</span>
              </Link>

              <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-neutral-400">
                My account
              </p>
              <Link
                href="/profile"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <User size={18} className="text-neutral-400" /> My Profile
              </Link>
              <Link
                href="/orders"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Package size={18} className="text-neutral-400" /> My Orders
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Heart size={18} className="text-neutral-400" /> Wishlist
              </Link>
              <Link
                href="/compare"
                className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <GitCompareArrows size={18} className="text-neutral-400" /> Compare
                {compareCount > 0 && (
                  <span className="ml-auto rounded-full bg-black px-2 py-0.5 text-[10px] font-bold text-white">
                    {compareCount}
                  </span>
                )}
              </Link>
            </nav>

            <div className="border-t border-neutral-200 p-4">
              {currentUser ? (
                <button
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-neutral-300 py-2.5 text-sm font-semibold text-black hover:bg-neutral-50"
                >
                  <LogOut size={16} /> Logout
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-md bg-black py-2.5 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  <User size={16} /> Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

    </header>
  );
}

/**
 * A top-level category link (Clothing / Footwear) that reveals its Men / Women / Kids
 * sub-navigation on hover for pointer devices and on tap for touch devices.
 */
function CategoryNavItem({
  category,
  active,
  canHover,
}: {
  category: Category;
  active: boolean;
  canHover: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    },
    []
  );

  const openMenu = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 120);
  };

  const go = (gender?: Gender) => {
    router.push(
      gender
        ? `/products?category=${category.id}&gender=${gender}`
        : `/products?category=${category.id}`
    );
    setOpen(false);
  };

  const triggerClass = cn(
    "relative flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
    active
      ? "font-bold text-black after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-black"
      : "text-neutral-600 hover:text-black"
  );

  return (
    <div
      ref={ref}
      suppressHydrationWarning
      className="relative"
      onMouseEnter={canHover ? openMenu : undefined}
      onMouseLeave={canHover ? scheduleClose : undefined}
    >
      {/* Hover-capable (desktop) devices get the mega menu; touch devices navigate to
          the category page, where the "Shop For" gender filter gives the same reach. */}
      <Link href={`/products?category=${category.id}`} className={triggerClass}>
        {category.name}
        {canHover && (
          <ChevronDown
            size={14}
            className={cn("transition-transform duration-200", open && "rotate-180")}
          />
        )}
      </Link>

      {canHover && open && (
        <div className="absolute left-0 top-full z-50 pt-1">
          <div className="w-52 origin-top overflow-hidden rounded-lg border border-neutral-200 bg-white py-1.5 shadow-xl animate-fade-in">
            <Link
              href={`/products?category=${category.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-black"
            >
              Shop all {category.name}
            </Link>
            <div className="my-1 border-t border-neutral-100" />
            {GENDER_OPTIONS.map((g) => (
              <button
                key={g.id}
                onClick={() => go(g.id)}
                className="group/item flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-black"
              >
                {g.label}
                <ChevronRight
                  size={15}
                  className="text-neutral-300 transition-transform duration-200 group-hover/item:translate-x-0.5 group-hover/item:text-black"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}