import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { ArrowUpRight, ExternalLink } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { isAdminUserId } from "@/server/auth";
import { RailNav, TabNav, type NavItem } from "./dashboard-nav";

const BASE: NavItem[] = [
  { href: "/dashboard", icon: "overview", label: "Overview" },
  { href: "/dashboard/orders", icon: "orders", label: "Orders" },
  { href: "/dashboard/products", icon: "products", label: "Products" },
  { href: "/dashboard/analytics", icon: "analytics", label: "Analytics" },
  { href: "/dashboard/reviews", icon: "reviews", label: "Reviews" },
  { href: "/dashboard/settings", icon: "settings", label: "Settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  const items = isAdminUserId(userId)
    ? [...BASE, { href: "/dashboard/admin/payments", icon: "admin" as const, label: "Payments" }]
    : BASE;

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      {/* Architectural Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-white py-6 lg:flex">
        <div className="mb-8 px-6">
          <Logo href="/dashboard" />
        </div>
        <RailNav items={items} />
        <div className="mt-auto border-t border-border px-5 pt-4">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-canvas/60 p-2.5">
            <UserButton />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-foreground">Merchant Account</p>
              <p className="text-[10px] text-foreground/50">Admin Console</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Body */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-white/90 px-4 backdrop-blur-md sm:px-8">
          <div className="lg:hidden">
            <Logo href="/dashboard" size={26} />
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/40">
            <span>LinkStore</span>
            <span>/</span>
            <span className="text-foreground/80">Merchant Console</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border bg-canvas px-3 py-1 text-xs font-semibold text-foreground/70 transition hover:border-primary hover:text-primary"
            >
              <span>Main Site</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <div className="lg:hidden">
              <UserButton />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-8 sm:pt-8 lg:pb-16">
          {children}
        </main>
      </div>

      <TabNav items={items.slice(0, 5)} />
    </div>
  );
}
