"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { FinderDeviceList } from "./FinderDeviceList";
import { FinderTrack } from "./FinderTrack";
import { useSeen } from "./useSeen";

const SWAP_TIME = 440;

// Pick a device and its coils slide out from underneath the device tile, like drawers.
// Changing device pulls the old coils back in first, then deals the new ones.
export function CoilFinder({ devices, coils, totalDevices }: { devices: Product[]; coils: Record<string, Product[]>; totalDevices: number }) {
  const [ref, seen, phone] = useSeen<HTMLDivElement>();
  const [selected, setSelected] = useState(0);
  const [shown, setShown] = useState(0);
  const [round, setRound] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const device = devices[phone ? selected : shown];

  useEffect(() => {
    if (phone || !leaving) return;
    const timer = setTimeout(() => {
      setShown(selected);
      setRound(current => current + 1);
      setLeaving(false);
    }, SWAP_TIME);
    return () => clearTimeout(timer);
  }, [phone, leaving, selected]);

  function choose(index: number) {
    if (index === selected) return;
    setSelected(index);
    if (phone) {
      setShown(index);
      setLeaving(false);
      setRound(current => current + 1);
    } else {
      setLeaving(true);
    }
  }

  return <div ref={ref} className="finder">
    <div className="finder-side">
      <div className="finder-head">
        <span className="eyebrow">Coil finder</span>
        <h2 id="finder-title">Find coils that fit, in one tap.</h2>
        <p>Pick your device to see only the coils made for it.</p>
      </div>
      <FinderDeviceList devices={devices} coils={coils} selected={selected} onChoose={choose} />
      {totalDevices > devices.length && <Link className="finder-more" href="/coils" prefetch={false}>Not listed? Pick from all {totalDevices} devices <i aria-hidden="true">→</i></Link>}
    </div>
    <div className="finder-main">
      <p className="sr-only" role="status">{!phone && leaving ? "" : `Showing coils for ${device.name}`}</p>
      <FinderTrack key={phone ? device.id : undefined} device={device} coils={coils[device.id] ?? []} round={round} seen={seen} leaving={!phone && leaving} />
      <Link className="finder-all" href={`/coils?fits=${device.id}`} prefetch={false}>See every coil for {device.name} <i aria-hidden="true">→</i></Link>
    </div>
  </div>;
}
