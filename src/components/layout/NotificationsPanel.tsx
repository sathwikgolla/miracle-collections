"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, CheckCheck, Truck, Package, Tag, Percent, ArrowDown, PackageCheck } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { cn } from "@/lib/utils";
import type { AppNotificationType } from "@/lib/types";

const ICONS: Record<AppNotificationType, typeof Bell> = {
  order: Package,
  shipped: Truck,
  stock: PackageCheck,
  offer: Tag,
  price: ArrowDown,
  delivery: Truck,
};

export function NotificationsPanel() {
  const { notifications, markAllNotificationsRead } = useStore();
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="w-80 max-w-[calc(100vw-1.5rem)] sm:max-w-xs overflow-hidden rounded-md border border-neutral-200 bg-white shadow-lg">
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-black">Notifications</p>
          {unread > 0 && (
            <p className="text-xs text-neutral-400">{unread} unread</p>
          )}
        </div>
        <button
          onClick={markAllNotificationsRead}
          disabled={unread === 0}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 hover:text-black disabled:cursor-not-allowed disabled:text-neutral-300"
        >
          <CheckCheck size={14} /> Mark all as read
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <BellOff size={28} className="text-neutral-300" />
            <p className="mt-2 text-sm font-semibold text-black">No notifications</p>
            <p className="mt-1 text-xs text-neutral-400">
              Order updates, offers and alerts will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = ICONS[n.type] ?? Bell;
            return (
              <div
                key={n.id}
                className={cn(
                  "flex gap-3 border-b border-neutral-100 px-4 py-3",
                  !n.read && "bg-neutral-50"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    !n.read ? "bg-black text-white" : "bg-neutral-100 text-neutral-500"
                  )}
                >
                  <Icon size={15} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black">{n.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-neutral-500">{n.message}</p>
                  <p className="mt-1 text-[11px] text-neutral-400">{n.time}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function NotificationBellIcon({ className }: { className?: string }) {
  const { notifications } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const unread = mounted ? notifications.filter((n) => !n.read).length : 0;
  return (
    <span className={cn("relative", className)}>
      <Bell size={22} />
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-black px-1 text-[10px] font-bold text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </span>
  );
}