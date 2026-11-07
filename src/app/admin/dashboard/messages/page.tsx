import { Suspense } from "react";
import { MessagesView } from "./MessagesView";

export default function MessagesPage() {
  return <Suspense><MessagesView /></Suspense>;
}
