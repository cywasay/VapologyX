import type { IconName } from "../../_shared/Icon";

export const DASHBOARD = "/admin/dashboard";

export const navItems: { name: string; href: string; icon: IconName }[] = [
  { name: "Overview", href: DASHBOARD, icon: "overview" },
  { name: "Orders", href: `${DASHBOARD}/orders`, icon: "orders" },
  { name: "Products", href: `${DASHBOARD}/products`, icon: "products" },
  { name: "Closing", href: `${DASHBOARD}/closing`, icon: "revenue" },
  { name: "Customers", href: `${DASHBOARD}/customers`, icon: "customers" },
  { name: "Messages", href: `${DASHBOARD}/messages`, icon: "messages" },
  { name: "Settings", href: `${DASHBOARD}/settings`, icon: "settings" },
];

// Overview is only current on its own address, because every other page lives below it.
export const currentIndex = (pathname: string) => navItems.findIndex(item => item.href === DASHBOARD ? pathname === DASHBOARD : pathname.startsWith(item.href));
