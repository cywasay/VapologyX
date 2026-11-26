// What the shop stands for, taken from the owner's story.
const values = [
  { title: "Genuine products only", text: "No copies, no guesswork. Everything on our shelves is the real thing." },
  { title: "Real product knowledge", text: "We have used these products for years, so we can tell you how they actually perform." },
  { title: "Advice that fits you", text: "Tell us what you like and we'll recommend devices, coils and flavours to match." },
];

export function AboutValues() {
  return <section className="shell section" aria-labelledby="about-values-title">
    <div className="about-values">
      <h2 id="about-values-title">What we stand for</h2>
      <ol>
        {values.map((value, index) => <li key={value.title}>
          <span aria-hidden="true">0{index + 1}</span>
          <div><h3>{value.title}</h3><p>{value.text}</p></div>
        </li>)}
      </ol>
    </div>
  </section>;
}
