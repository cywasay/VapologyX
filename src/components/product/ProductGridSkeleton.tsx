// Grey card shapes shown while a shelf loads, shaped like real product cards so the page doesn't jump when the products arrive.
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return <div className="product-grid keep-motion" role="status" aria-label="Loading products">
    {Array.from({ length: count }, (_, index) => <div key={index} className="product sk-card" aria-hidden="true">
      <span className="sk sk-image" />
      <span className="sk sk-line" />
      <span className="sk sk-line is-short" />
      <span className="sk sk-button" />
    </div>)}
  </div>;
}
