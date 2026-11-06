import Link from "next/link";
import { BottleArt, DeviceArt, Wordmark } from "@/components/art";
import { GRAPHITE, LIME, SILVER } from "@/lib/products";

// The lime panel beside the log in form.
export function LoginSide({ title }: { title: string }) {
  return <div className="tile auth-side">
    <Link href="/" aria-label="Back to the store"><Wordmark /></Link>
    <h1>{title}</h1>
    <div className="auth-art" aria-hidden="true">
      <div className="hero-item-side"><DeviceArt kind="pod" color={SILVER} /></div>
      <div className="hero-item-main"><DeviceArt kind="box" color={LIME} /></div>
      <div className="hero-item-side"><BottleArt color={GRAPHITE} /></div>
    </div>
  </div>;
}
