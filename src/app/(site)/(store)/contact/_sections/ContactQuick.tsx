import { STORE } from "@/lib/store-info";

// The fastest ways to reach the shop, as big tappable cards. WhatsApp first, because the owner confirms orders there.
export function ContactQuick() {
  const cards = [
    { label: "WhatsApp", value: STORE.phone, note: "Quickest reply", href: STORE.whatsappLink, external: true, tone: "is-lime" },
    { label: "Call us", value: STORE.phone, note: "During opening hours", href: STORE.phoneLink, external: false, tone: "is-dark" },
    { label: "Visit", value: "Atrium Plaza, Zaraj", note: "Open in Google Maps", href: STORE.mapLink, external: true, tone: "is-light" },
  ];
  return <section className="shell contact-quick" aria-label="Ways to reach us">
    {cards.map(card => <a key={card.label} href={card.href} className={`contact-card ${card.tone}`} {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      <span className="contact-card-label">{card.label}</span>
      <strong>{card.value}</strong>
      <small>{card.note} <i aria-hidden="true">↗</i></small>
    </a>)}
    <div className="contact-card is-hours">
      <span className="contact-card-label">Hours</span>
      <strong>7 days a week</strong>
      <small>About 11:00 AM to 11:00 PM</small>
    </div>
  </section>;
}
