const points = [
  { title: "Every device", text: "Refillable pod systems, rechargeable devices and disposables." },
  { title: "Every coil", text: "Different coil options, and help choosing the right coil for your device." },
  { title: "Every flavor", text: "Fruit, ice, menthol, dessert and tobacco flavours, in different brands and nicotine strengths." },
];

export function AboutPoints() {
  return <section className="shell page-body info-grid" aria-label="What we offer">
    {points.map(point => <div key={point.title} className="tile info-card"><h2>{point.title}</h2><p>{point.text}</p></div>)}
  </section>;
}
