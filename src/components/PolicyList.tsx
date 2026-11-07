// A numbered list of short sections, used by the privacy, shipping and terms pages.
export function PolicyList({ label, sections }: { label: string; sections: { title: string; text: string }[] }) {
  return <section className="shell page-body" aria-label={label}>
    <ol className="panel-light terms">
      {sections.map(section => <li key={section.title}><h2>{section.title}</h2><p>{section.text}</p></li>)}
    </ol>
  </section>;
}
