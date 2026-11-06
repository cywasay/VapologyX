import { Loader } from "@/components/loader/Loader";

// Shown while a page of the buying flow waits for the browser to load the saved cart or order.
export function FlowSkeleton() {
  return <section className="shell flow" aria-busy="true" aria-label="Loading">
    <Loader label="Loading your order" />
  </section>;
}
