import { MINIMUM_AGE } from "@/lib/products";
import { STORE } from "@/lib/store-info";

const sections = [
  { title: "Age requirement", text: `This site is for adults aged ${MINIMUM_AGE} and over. ID is checked in the store.` },
  { title: "Orders and payment", text: "Every order is confirmed by WhatsApp or phone call before it is sent. You can pay in cash on delivery or pickup, or by bank transfer; bank details are sent after you order." },
  { title: "Delivery", text: "Islamabad and Rawalpindi by Bykea or inDrive (about 1 day). Other cities by TCS or Leopards Courier (about 2–3 working days). Normal parcel delivery terms apply." },
  { title: "Returns and refunds", text: "We don't accept returns or exchanges. Damaged or faulty items are reviewed case by case. Any approved refund is given as store credit." },
  { title: "Privacy", text: "We keep your name, number, address and order details to confirm and deliver your order, and share them only with the delivery service. Order records are kept for 1 year. See the Privacy page for more." },
  { title: "Contact", text: `Questions about these terms? Call or WhatsApp us on ${STORE.phone}.` },
];

export function TermsList() {
  return <section className="shell page-body" aria-label="Terms">
    <ol className="panel-light terms">
      {sections.map(section => <li key={section.title}><h2>{section.title}</h2><p>{section.text}</p></li>)}
    </ol>
  </section>;
}
