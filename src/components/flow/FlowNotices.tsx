"use client";

import type { CartSync } from "@/lib/cart-store";

// Tells the customer what changed in their cart since they added things (price, stock), and when prices couldn't be checked.
export function FlowNotices({ sync, warnWhenFailed = false }: { sync: CartSync; warnWhenFailed?: boolean }) {
  return <>
    {sync.notices.length > 0 && <div className="flow-notice" role="status">
      <ul>{sync.notices.map(notice => <li key={notice}>{notice}</li>)}</ul>
      <button onClick={sync.dismiss}>Dismiss</button>
    </div>}
    {warnWhenFailed && sync.state === "failed" && <div className="flow-notice" role="status"><ul><li>We couldn&apos;t check the latest prices just now, so the totals below may be out of date.</li></ul></div>}
  </>;
}
