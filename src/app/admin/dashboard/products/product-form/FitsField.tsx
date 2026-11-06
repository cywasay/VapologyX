"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// For coils: which devices the coil fits.
export function FitsField({ fits, onChange }: { fits: string[]; onChange: (fits: string[]) => void }) {
  const [devices, setDevices] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    createClient().from("products").select("id,name").eq("category", "device").order("position").limit(1000).then(({ data }) => {
      setDevices((data ?? []) as { id: string; name: string }[]);
    });
  }, []);

  return <fieldset className="product-form-group">
    <legend>Fits these devices</legend>
    {devices.length === 0 && <p>Loading devices…</p>}
    <div className="product-form-checks">
      {devices.map(device => <label key={device.id}><input type="checkbox" checked={fits.includes(device.id)} onChange={event => onChange(event.target.checked ? [...fits, device.id] : fits.filter(id => id !== device.id))} />{device.name}</label>)}
    </div>
  </fieldset>;
}
