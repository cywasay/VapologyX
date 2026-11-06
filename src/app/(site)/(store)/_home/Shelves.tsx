import { CategoryRail } from "./CategoryRail";
import { getShelfCounts } from "./getShelfCounts";

export async function Shelves() {
  const counts = await getShelfCounts();
  return <section className="shell section" aria-labelledby="shelves-title">
    <div className="section-heading home-reveal"><h2 id="shelves-title">Pick a shelf.</h2><p>Everything in the store sits on one of these four.</p></div>
    <CategoryRail counts={counts} />
  </section>;
}
