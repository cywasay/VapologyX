import type { ReactNode } from "react";
import { ButtonOrigin } from "@/components/store/ButtonOrigin";
import { StoreProvider } from "@/components/store/store-context";
import { CartDrawer } from "./_shell/CartDrawer";
import { CartToast } from "./_shell/CartToast";
import { Footer } from "./_shell/Footer";
import { Header } from "./_shell/Header";
import { NoticeBar } from "./_shell/NoticeBar";
import { SearchDialog } from "./_shell/SearchDialog";

// The frame shared by every shop page: header, footer, and the cart and search windows.
export default function StoreLayout({ children }: { children: ReactNode }) {
  return <StoreProvider>
    <div className="store-frame">
      <a className="skip-link" href="#main">Skip to content</a>
      <NoticeBar />
      <Header />
      <main id="main" tabIndex={-1} className="store-main">{children}</main>
      <Footer />
    </div>
    <ButtonOrigin />
    <CartToast />
    <CartDrawer />
    <SearchDialog />
  </StoreProvider>;
}
