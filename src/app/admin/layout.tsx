import type { ReactNode } from "react";
import { ArtDefs } from "@/components/art";
import "./admin.css";

// Everything under /admin is a separate area of the site: no shop header, footer or age check.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <><ArtDefs />{children}</>;
}
