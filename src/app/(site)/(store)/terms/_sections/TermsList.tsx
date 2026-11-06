import { MINIMUM_AGE } from "@/lib/products";

const sections = [
  { title: "Age requirement", text: `This site is for adults aged ${MINIMUM_AGE} and over. Placeholder text: the shop's real age rules go here.` },
  { title: "Orders and payment", text: "Placeholder text: how orders are placed, confirmed and paid for goes here." },
  { title: "Delivery", text: "Placeholder text: delivery areas, times and any checks on delivery go here." },
  { title: "Returns and refunds", text: "Placeholder text: what can be returned, and how refunds work, goes here." },
  { title: "Privacy", text: "Placeholder text: what customer information is collected and how it is used goes here." },
  { title: "Contact", text: "Placeholder text: who to contact about these terms goes here." },
];

export function TermsList() {
  return <section className="shell page-body" aria-label="Terms">
    <ol className="panel-light terms">
      {sections.map(section => <li key={section.title}><h2>{section.title}</h2><p>{section.text}</p></li>)}
    </ol>
  </section>;
}
