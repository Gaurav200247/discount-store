import { ReceiptText, ShoppingBag, Store, Tag } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/cart";
import { useDiscountConfig } from "@/lib/queries";

const navItems = [
  { to: "/", label: "Store", icon: Store },
  { to: "/orders", label: "Orders", icon: ReceiptText },
  { to: "/admin", label: "Admin", icon: Tag },
];

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary/15 text-primary"
      : "text-muted-foreground hover:text-foreground",
  );
}

export function Layout() {
  const { itemCount } = useCart();
  const { data: config } = useDiscountConfig();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2 text-lg font-bold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Store className="size-4" />
            </span>
            <span>
              Discount<span className="text-primary">Store</span>
            </span>
          </NavLink>

          <nav className="flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={navLinkClass}
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
            <NavLink to="/cart" className={navLinkClass}>
              <ShoppingBag className="size-4" />
              Cart
              {itemCount > 0 && (
                <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-sm text-muted-foreground">
          <span>Discount Store — every nth order earns a coupon</span>
          <Badge variant="outline">
            {config ? `n=${config.n} · ${config.percent}% off` : "loading…"}
          </Badge>
        </div>
      </footer>
    </div>
  );
}
