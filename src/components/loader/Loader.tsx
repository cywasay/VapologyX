// The site's loading animation. A lime tile with the brand X keeps changing shape while rings of vapor rise from it.
// It is used wherever something is on its way: a shelf, the cart, the admin lists, a page change.
export function Loader({ label = "Loading", size = "normal" }: { label?: string; size?: "normal" | "small" }) {
  return <div className={`loader ${size === "small" ? "is-small" : ""}`} role="status" aria-live="polite">
    <div className="loader-stage" aria-hidden="true">
      <i className="loader-puff" />
      <i className="loader-puff" />
      <i className="loader-puff" />
      <span className="loader-tile"><b>X</b></span>
    </div>
    <p>{label}<span className="loader-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p>
  </div>;
}
