"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { DemoNote } from "@/components/flow/DemoNote";
import { findOrder, normalizePhone, type Order } from "@/lib/orders";
import { TrackForm, type TrackErrors } from "./TrackForm";
import { TrackResult } from "./TrackResult";

type Result = { state: "idle" } | { state: "looking" } | { state: "missing" } | { state: "found"; order: Order };

// "Track my order": the order number and the mobile number it was placed with.
export function TrackView() {
  const params = useSearchParams();
  const fromLink = (params.get("number") ?? "").toUpperCase();
  const [number, setNumber] = useState(fromLink);
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<TrackErrors>({});
  const [result, setResult] = useState<Result>({ state: "idle" });
  // Next.js keeps this page alive when the customer leaves it, so a new "Track this order" link has to replace
  // the order number and the old result. The reset happens during the render, which is how React asks for it.
  const [linkedNumber, setLinkedNumber] = useState(fromLink);
  if (fromLink !== linkedNumber) {
    setLinkedNumber(fromLink);
    setNumber(fromLink);
    setErrors({});
    setResult({ state: "idle" });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (result.state === "looking") return;
    const found: TrackErrors = {};
    if (number.trim().length < 4) found.number = "Enter your order number, like VX-AB12CD.";
    if (!normalizePhone(phone)) found.phone = "Enter the mobile number you ordered with.";
    setErrors(found);
    if (found.number || found.phone) {
      document.getElementById(found.number ? "track-number" : "track-phone")?.focus();
      return;
    }
    setResult({ state: "looking" });
    const order = await findOrder(number, phone);
    setResult(order ? { state: "found", order } : { state: "missing" });
  }

  return <section className="shell flow" aria-labelledby="track-title">
    <div className="flow-head">
      <h1 id="track-title">Track your order</h1>
      <p>Enter your order number and the mobile number you ordered with.</p>
    </div>

    <TrackForm number={number} phone={phone} errors={errors} looking={result.state === "looking"}
      onNumber={value => { setNumber(value); setErrors(current => ({ ...current, number: undefined })); }}
      onPhone={value => { setPhone(value); setErrors(current => ({ ...current, phone: undefined })); }}
      onSubmit={submit} />

    {result.state === "missing" && <p className="flow-error track-missing" role="alert">We couldn&apos;t find an order with that number and mobile number. Check them and try again.</p>}
    {result.state === "found" && <TrackResult order={result.order} />}

    <DemoNote>Demo tracking. Only orders placed in this browser can be found for now.</DemoNote>
  </section>;
}
