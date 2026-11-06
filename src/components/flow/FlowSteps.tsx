// Where the customer is in the buying flow: cart, then their details, then the confirmation.
export function FlowSteps({ current }: { current: 1 | 2 | 3 }) {
  return <ol className="flow-steps" aria-label="Order steps">
    {["Cart", "Your details", "Done"].map((label, index) => {
      const step = index + 1;
      return <li key={label} className={step === current ? "is-current" : step < current ? "is-done" : ""} aria-current={step === current ? "step" : undefined}>
        <b aria-hidden="true">{step < current ? "✓" : step}</b>{label}
      </li>;
    })}
  </ol>;
}
