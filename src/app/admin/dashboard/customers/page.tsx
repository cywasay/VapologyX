import { MINIMUM_AGE } from "@/lib/products";
import { EmptyState } from "../../_shared/EmptyState";

export default function CustomersPage() {
  return <>
    <h1 className="admin-title is-small">Customers</h1>
    <EmptyState icon="customers" title="Customer list not connected yet">Accounts from the Register page will appear here. Customers must be {MINIMUM_AGE} or older.</EmptyState>
  </>;
}
