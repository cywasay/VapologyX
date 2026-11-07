import { ImageResponse } from "next/og";
import { BRAND } from "@/lib/products";

export const alt = `${BRAND}: devices, disposables, bottles and coils`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The picture shown when a link to the shop is shared: the wordmark on the shop's black, with a lime X.
export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#141518", color: "#f6f7f3" }}>
      <div style={{ display: "flex", alignItems: "center", fontSize: 40, color: "#e8f78b" }}>Flagship store</div>
      <div style={{ display: "flex", alignItems: "center", fontSize: 150, fontWeight: 800, letterSpacing: -6 }}>
        Vapology
        <div style={{ display: "flex", marginLeft: 12, padding: "0 28px", color: "#141518", background: "#e8f78b", borderRadius: 28 }}>X</div>
      </div>
      <div style={{ display: "flex", fontSize: 38, color: "#b9bcb6" }}>Devices · Disposables · Bottles · Coils</div>
    </div>,
    size,
  );
}
