import { StoreDetails } from "@/components/StoreDetails";
import { StoreMap } from "../../_home/StoreMap";

// The right-hand side: the shop on the map, then the full address, hours and numbers.
export function ContactDetails() {
  return <div className="contact-side">
    <StoreMap />
    <div className="tile contact-details">
      <h2>Find the store</h2>
      <StoreDetails />
    </div>
  </div>;
}
