"use client";

export default function StoreError({ retry }: { error: unknown; retry: () => void }) {
  return <section className="shell page-body store-error">
    <h1>We can&apos;t load the shop right now.</h1>
    <p>Please try again in a moment.</p>
    <button className="button button-primary" onClick={() => retry()}>Try again</button>
  </section>;
}
