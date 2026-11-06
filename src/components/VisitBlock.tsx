import Link from "next/link";
import { StoreDetails } from "./StoreDetails";

export function VisitBlock() {
  return <section className="visit" aria-labelledby="visit-title">
    <div className="shell visit-inner">
      <div>
        <h2 id="visit-title">Visit the flagship store.</h2>
        <Link className="button button-dark" href="/contact">Contact us</Link>
      </div>
      <StoreDetails />
    </div>
  </section>;
}
