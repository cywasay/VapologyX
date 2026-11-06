import { EmptyState } from "../../_shared/EmptyState";

export default function MessagesPage() {
  return <>
    <h1 className="admin-title is-small">Messages</h1>
    <EmptyState icon="messages" title="No messages yet">Messages from the Contact page will appear here once they&apos;re saved to the database.</EmptyState>
  </>;
}
