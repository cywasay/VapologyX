"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { readInventory, type InventoryReading } from "./readInventory";

export type ImportResult = { added: number; updated: number; removed: number };
type Existing = { category: string; name: string }[];

// The three steps of an import: choose the file, look over what it holds, then save it.
export function useInventoryImport() {
  const [fileName, setFileName] = useState("");
  const [reading, setReading] = useState<InventoryReading | null>(null);
  const [existing, setExisting] = useState<Existing>([]);
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  async function choose(file: File) {
    setBusy(true);
    setError("");
    try {
      const { default: readExcelFile } = await import("read-excel-file/browser");
      const sheets = await readExcelFile(file);
      const sheet = sheets.find(item => /inventory/i.test(item.sheet)) ?? sheets[0];
      const found = readInventory(sheet.data as Parameters<typeof readInventory>[0]);
      if (found.rows.length === 0) {
        setError("I couldn't find any products. The file needs a sheet with Coils, Bottles, Devices or Disposables lists, each with Qty, Rate and Price columns.");
        return;
      }
      const { data, error: loadError } = await createClient().from("products").select("category,name").limit(1000);
      if (loadError) throw loadError;
      setExisting((data ?? []) as Existing);
      setReading(found);
      setFileName(file.name);
      setReplace(false);
    } catch {
      setError("That file couldn't be read. Please choose an Excel (.xlsx) file.");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!reading) return;
    setBusy(true);
    setError("");
    const rows = reading.rows.map(({ category, name, qty, cost, price }) => ({ category, name, qty, cost, price }));
    const { data, error: saveError } = await createClient().rpc("import_inventory", { rows, replace_all: replace });
    setBusy(false);
    if (saveError) {
      setError(saveError.message.startsWith("invalid_import") ? `Nothing was saved. ${saveError.message.replace("invalid_import: ", "")}` : "Nothing was saved. Please try again.");
      return;
    }
    setResult(data as ImportResult);
    setReading(null);
  }

  function reset() {
    setReading(null);
    setResult(null);
    setError("");
    setFileName("");
  }

  // How many of the file's products are already in the shop (same shelf and name), so they would be updated.
  const known = new Set(existing.map(item => `${item.category}|${item.name.toLowerCase()}`));
  const updating = reading ? reading.rows.filter(row => known.has(`${row.category}|${row.name.toLowerCase()}`)).length : 0;

  return { fileName, reading, existingCount: existing.length, updating, replace, setReplace, busy, error, result, choose, save, reset };
}
