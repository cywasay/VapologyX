import { getShelfCounts } from "../../_home/getShelfCounts";

// The shop's story in three steps, from the owner's own account. "Today" counts the live shelves.
export async function AboutStory() {
  const counts = await getShelfCounts();
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const steps = [
    { year: "2015", title: "It started as a customer", text: "Our owner began vaping and spent years learning the products first-hand: what works, what lasts, and what doesn't." },
    { year: "2024", title: "VapologyX opens", text: "Fake and unreliable products were everywhere, so we opened a store in Islamabad that sells only genuine ones." },
    { year: "Today", title: `${total} products, 4 shelves`, text: "Devices, disposables, bottles and coils, with help choosing what fits you." },
  ];
  return <section className="shell section about-story" aria-labelledby="about-story-title">
    <div className="section-heading"><h2 id="about-story-title">Our story</h2></div>
    <ol>
      {steps.map(step => <li key={step.year}>
        <span className="about-year">{step.year}</span>
        <h3>{step.title}</h3>
        <p>{step.text}</p>
      </li>)}
    </ol>
  </section>;
}
