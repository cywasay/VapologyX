import { CoilFinderSection } from "./_home/CoilFinderSection";
import { FeaturedDevices } from "./_home/FeaturedDevices";
import { Hero } from "./_home/Hero";
import { HomeMotion } from "./_home/HomeMotion";
import { PopularBottles } from "./_home/PopularBottles";
import { Shelves } from "./_home/Shelves";
import { StoreVisit } from "./_home/StoreVisit";

// The landing page: each part is its own section, shown in this order.
export default function Home() {
  return <HomeMotion>
    <Hero />
    <Shelves />
    <FeaturedDevices />
    <CoilFinderSection />
    <PopularBottles />
    <StoreVisit />
  </HomeMotion>;
}
