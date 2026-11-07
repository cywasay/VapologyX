"use client";

import Link from "next/link";
import { Loader } from "@/components/loader/Loader";
import { ImportPreview } from "./ImportPreview";
import { useInventoryImport } from "./useInventoryImport";

export function ImportView() {
  const job = useInventoryImport();
  const { reading, result, busy, error } = job;

  return <>
    <div className="admin-page-head">
      <h1 className="admin-title is-small">Import from Excel</h1>
      <Link className="button button-outline" href="/admin/dashboard/products">Back to products</Link>
    </div>

    {error && <p className="form-status is-error" role="alert">{error}</p>}

    {result && <div className="import-done" role="status">
      <h2>Import finished</h2>
      <p>{result.added} added, {result.updated} updated{result.removed > 0 ? `, ${result.removed} removed` : ""}. Every stock change is saved in the stock history.</p>
      <div className="import-actions">
        <Link className="button button-black" href="/admin/dashboard/products">See the products</Link>
        <button type="button" className="button button-outline" onClick={job.reset}>Import another file</button>
      </div>
    </div>}

    {!reading && !result && <div className="import-pick">
      <p>Choose your inventory spreadsheet (.xlsx). Nothing is saved until you have looked it over and confirmed.</p>
      <p className="import-hint">Products with the same shelf and name are updated: price, stock and cost. New ones are added. The cost is kept private and never shown in the shop.</p>
      {busy ? <Loader label="Reading the file" size="small" /> : <label className="button button-black import-file">
        Choose a file
        <input type="file" accept=".xlsx" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) job.choose(file); }} />
      </label>}
    </div>}

    {reading && <>
      <div className="import-summary">
        <p><b>{reading.rows.length} products</b> found in {job.fileName}. {job.updating} already in the shop will be updated, {reading.rows.length - job.updating} will be added.</p>
        {job.existingCount > 0 && <label className="import-replace">
          <input type="checkbox" checked={job.replace} onChange={event => job.setReplace(event.target.checked)} />
          <span>Remove the {job.existingCount} products in the shop now before importing. They are deleted for good, and their photos stay in storage.</span>
        </label>}
        <div className="import-actions">
          <button type="button" className="button button-black" disabled={busy} onClick={job.save}>{busy ? "Saving…" : `Import ${reading.rows.length} products`}</button>
          <button type="button" className="button button-outline" disabled={busy} onClick={job.reset}>Choose another file</button>
        </div>
      </div>
      <ImportPreview reading={reading} />
    </>}
  </>;
}
