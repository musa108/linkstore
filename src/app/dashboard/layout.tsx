import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Package, Settings, ShoppingCart, BarChart3, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-canvas">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 hidden h-full w-20 border-r border-border bg-card lg:flex flex-col items-center py-8 transition-all hover:w-64 group z-50">
                <div className="mb-12">
                    <Link href="/dashboard" className="flex items-center gap-3 transition-transform active:scale-95">
                        <div className="h-10 w-10 rounded-xl relative overflow-hidden shadow-lg shadow-indigo-500/20">
                            <Image src="/logo.png" alt="LinkStore" fill className="object-cover" />
                        </div>
                        <span className="text-xl font-bold tracking-tighter text-foreground opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            LinkStore
                        </span>
                    </Link>
                </div>

                <nav className="flex flex-1 flex-col gap-4 px-4 w-full">
                    {[
                        { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
                        { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
                        { href: "/dashboard/products", icon: Package, label: "Products" },
                        { href: "/dashboard/orders", icon: ShoppingCart, label: "Orders" },
                        { href: "/dashboard/reviews", icon: Star, label: "Reviews" },
                        { href: "/dashboard/settings", icon: Settings, label: "Settings" },
                    ].map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-4 rounded-xl p-3 text-foreground/50 transition-all hover:bg-primary/5 hover:text-primary active:scale-95 group/item"
                        >
                            <item.icon className="h-6 w-6 shrink-0" />
                            <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto px-4 w-full flex justify-center group-hover:justify-start">
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer w-full">
                        <UserButton />
                        <span className="text-sm font-semibold text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            My Account
                        </span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-20 transition-all">
                <header className="sticky top-0 z-40 bg-canvas/80 backdrop-blur-md border-b border-border/50 h-16 md:h-20 px-4 md:px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="lg:hidden h-8 w-8 rounded-lg relative overflow-hidden shadow-indigo-500/20">
                            <Image src="/logo.png" alt="L" fill className="object-cover" />
                        </div>
                        <h2 className="text-xs font-black uppercase tracking-widest text-foreground/40">Dashboard</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-foreground/60 shadow-sm">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                            Live Store
                        </div>
                        <div className="lg:hidden">
                            <UserButton />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
                    <div className="max-w-7xl mx-auto pb-24 md:pb-20">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 z-50 w-full lg:hidden bg-card/80 backdrop-blur-xl border-t border-border/50 px-6 py-4 flex items-center justify-between shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
                {[
                    { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
                    { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
                    { href: "/dashboard/products", icon: Package, label: "Products" },
                    { href: "/dashboard/orders", icon: ShoppingCart, label: "Orders" },
                    { href: "/dashboard/reviews", icon: Star, label: "Reviews" },
                    { href: "/dashboard/settings", icon: Settings, label: "Settings" },
                ].map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="flex flex-col items-center gap-1 text-foreground/40 transition-all active:scale-90"
                    >
                        <item.icon className="h-6 w-6" />
                        <span className="text-[10px] font-black uppercase tracking-tighter">
                            {item.label}
                        </span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
