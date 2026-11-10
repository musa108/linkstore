"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Star,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  analytics: BarChart3,
  products: Package,
  orders: ShoppingCart,
  reviews: Star,
  settings: Settings,
  admin: ShieldCheck,
};

export interface NavItem {
  href: string;
  icon: keyof typeof ICONS;
  label: string;
}

function useActive() {
  const path = usePathname();
  return (href: string) =>
    href === "/dashboard"
      ? path === "/dashboard"
      : path === href || path.startsWith(`${href}/`);
}

export function RailNav({ items }: { items: NavItem[] }) {
  const isActive = useActive();
  return (
    <nav aria-label="Dashboard" className="flex flex-1 flex-col gap-1.5 px-3">
      {items.map((i) => {
        const Icon = ICONS[i.icon]!;
        const active = isActive(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-[42px] items-center gap-3 rounded-xl px-3.5 text-xs font-semibold tracking-wide transition-all",
              active
                ? "bg-[#1e2024] text-white shadow-xs"
                : "text-foreground/70 hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                active ? "text-[#eb5a28]" : "text-foreground/45"
              )}
              aria-hidden
            />
            <span>{i.label}</span>
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#eb5a28]" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function TabNav({ items }: { items: NavItem[] }) {
  const isActive = useActive();
  return (
    <nav
      aria-label="Dashboard"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 backdrop-blur-md lg:hidden"
    >
      <ul
        className="mx-auto flex max-w-xl items-stretch justify-between px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {items.map((i) => {
          const Icon = ICONS[i.icon]!;
          const active = isActive(i.href);
          return (
            <li key={i.href} className="flex-1">
              <Link
                href={i.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[52px] flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-wider uppercase transition-colors",
                  active ? "text-[#eb5a28]" : "text-foreground/50 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span>{i.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
