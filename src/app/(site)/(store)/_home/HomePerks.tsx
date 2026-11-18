"use client";

import Link from "next/link";
import { useDelivery } from "@/components/store/delivery-context";
import { money } from "@/lib/products";

// Four short, true reasons to order here, right under the hero. Delivery numbers come from admin Settings.
export function HomePerks() {
  const { fee, freeFrom } = useDelivery();
  const perks = [
    { title: `Delivery ${money(fee)}`, text: `Free on orders from ${money(freeFrom)}`, href: "/shipping" },
    { title: "Cash on delivery", text: "Or pay by bank transfer or mobile wallet", href: "/shipping" },
    { title: "Free store pickup", text: "Order online, collect from the shop", href: "/shipping" },
    { title: "Coils that fit", text: "Pick your device, see only its coils", href: "/coils" },
  ];
  return <section className="shell home-perks" aria-label="Why order from us">
    <ul>
      {perks.map(perk => <li key={perk.title}>
        <Link href={perk.href} prefetch={false}>
          <i aria-hidden="true" />
          <span><b>{perk.title}</b><small>{perk.text}</small></span>
        </Link>
      </li>)}
    </ul>
  </section>;
}
