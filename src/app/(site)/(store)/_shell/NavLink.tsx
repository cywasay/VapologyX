"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// A link that marks itself when its page is the one open.
export function NavLink({ href, children }: { href: string; children: ReactNode }) {
  const current = usePathname() === href;
  return <Link href={href} className={current ? "is-current" : ""} aria-current={current ? "page" : undefined}>{children}</Link>;
}
