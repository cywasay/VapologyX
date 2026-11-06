import Link from "next/link";
import type { ReactNode } from "react";
import { BottleArt, DeviceArt, Wordmark } from "@/app/art";
import { GRAPHITE, LIME, SILVER } from "@/app/products";

// The frame of every admin sign-in page: a lime side panel with the brand, and the form beside it.
export function AdminAuthPage({ title, children }: { title: string; children: ReactNode }) {
  return <main className="auth">
    <div className="tile auth-side">
      <Link href="/" aria-label="Back to the store"><Wordmark /></Link>
      <p className="auth-kicker">Admin</p>
      <h1>{title}</h1>
      <div className="auth-art" aria-hidden="true">
        <div className="hero-item-side"><DeviceArt kind="pod" color={SILVER} /></div>
        <div className="hero-item-main"><DeviceArt kind="box" color={LIME} /></div>
        <div className="hero-item-side"><BottleArt color={GRAPHITE} /></div>
      </div>
    </div>
    <div className="auth-main">{children}</div>
  </main>;
}
