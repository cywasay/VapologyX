const points = [
  { title: "Every device", text: "Placeholder text. Say something about the range of devices in the shop." },
  { title: "Every coil", text: "Placeholder text. Say something about coils and compatibility." },
  { title: "Every flavor", text: "Placeholder text. Say something about the flavor selection." },
];

export function AboutPoints() {
  return <section className="shell page-body info-grid" aria-label="What we offer">
    {points.map(point => <div key={point.title} className="tile info-card"><h2>{point.title}</h2><p>{point.text}</p></div>)}
  </section>;
}
