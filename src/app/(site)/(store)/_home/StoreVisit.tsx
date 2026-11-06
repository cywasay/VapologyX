import Link from "next/link";
import { StoreDetails } from "@/components/StoreDetails";
import { StoreMap } from "./StoreMap";
import { VisitPanel } from "./VisitPanel";

export function StoreVisit() {
  return <section className="shell home-visit" aria-labelledby="visit-title">
    <VisitPanel>
      <div className="home-visit-copy">
        <span className="home-chip is-light">Flagship store</span>
        <h2 id="visit-title">Come see every shelf in person.</h2>
        <p>Store visit text goes here. Replace it with what customers can expect in the shop.</p>
        <Link className="button button-dark" href="/contact">Contact the store</Link>
      </div>
      <StoreMap />
      <StoreDetails />
    </VisitPanel>
  </section>;
}
