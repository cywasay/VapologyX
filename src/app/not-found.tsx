import type { Metadata } from "next";
import { NotFoundView } from "@/components/NotFoundView";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return <main className="notfound-page"><NotFoundView brand /></main>;
}
