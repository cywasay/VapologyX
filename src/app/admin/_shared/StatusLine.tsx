export type Status = { kind: "error" | "success" | "info"; text: string };

export function StatusLine({ status }: { status: Status | null }) {
  return <p className={`form-status ${status ? `is-${status.kind}` : ""}`} role="status">{status?.text}</p>;
}
