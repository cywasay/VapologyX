import { Loader } from "@/components/loader/Loader";

// Shown in place of the page while the next shop page is on its way.
export default function StoreLoading() {
  return <section className="shell page-body" aria-busy="true"><Loader /></section>;
}
