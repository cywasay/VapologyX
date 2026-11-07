import Link from "next/link";
import { Wordmark } from "@/components/art";

// The page shown for an address that doesn't exist: a big 404 made of the shop's own shapes, and ways back.
export function NotFoundView({ brand = false }: { brand?: boolean }) {
  return <section className="shell notfound" aria-labelledby="notfound-title">
    <div className="notfound-card keep-motion">
      {brand && <Link href="/" className="notfound-brand" aria-label="VapologyX home"><Wordmark /></Link>}
      <div className="notfound-digits" aria-hidden="true"><b>4</b><span /><b>4</b></div>
      <h1 id="notfound-title">That page isn&apos;t here.</h1>
      <p>The link may be old, or the product may have moved. Try one of these instead.</p>
      <div className="notfound-actions">
        <Link className="button button-lime" href="/">Back to home</Link>
        <Link className="button button-outline" href="/devices">Shop devices</Link>
        <Link className="button button-outline" href="/contact">Ask the store</Link>
      </div>
    </div>
  </section>;
}
