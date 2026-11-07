import type { Metadata } from "next";
import { NotFoundView } from "@/components/NotFoundView";

export const metadata: Metadata = { title: "Page not found" };

export default function StoreNotFound() {
  return <NotFoundView />;
}
