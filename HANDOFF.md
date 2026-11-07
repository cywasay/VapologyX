# VapologyX shop – handoff notes

Read this first in any new Claude session ("Read HANDOFF.md first, then continue").
Last updated: 2026-11-07.

## 1. Who / what
- Freelancer (git user `cywasay`) builds a custom web shop + admin for **VapologyX**, a vape shop in Pakistan (flagship store). Brand names (Oxva, Vaporesso, Uwell…) are authorized. Site is in testing.
- The user prefers **very short, simple replies**, plain words, no jargon. Explain things with shop examples.
- Theme: near-black ink, soft lime `#e8f78b`, gray-white. Fonts Bricolage Grotesque + Instrument Sans. Red only for errors/destructive.

## 2. Hard rules from the user
- **Never add anything you are not 100% sure of. If unsure, ask.** Build from the client's Excel file only; nothing invented. Write rules in plain words and get a yes before building big things.
- Excel typed numbers are only examples; **formulas are the logic**.
- Import, cost, profit and closing are **admin-only**, never reachable from the shop.
- Goal: **100% automation**, no manual counting at day end.
- Daily closing and monthly closing are separate things.
- Animations must not make phones laggy or break anything. The user has Windows animations off; the global reduced-motion kill rule exempts `.motion`, `.loader`, `.skeleton`, `.keep-motion`.
- Do not commit until the user asks. **Do not push** (see section 3).

## 3. SECURITY – GitHub repo was compromised (2026-11-07)
**Resolved 2026-11-07:** the user secured GitHub and approved a force-push; origin/main is now the clean commit a91a1da and GitHub has no other branches or tags. Normal pushes are fine again. Keep the history below in mind if anything odd reappears.
- `origin/main` was force-replaced by commit `166805d` (fake copy of `7cfa595`) that adds obfuscated malware: an `init` file, `package.json` scripts `node init && …`, a payload appended to `eslint.config.mjs`, `.env*` removed from `.gitignore`, a `config.bat`.
- **Never `git pull`, merge, reset to or run anything from origin/main.**
- The local `main` is clean. Pushing needs a **force-push**, only after the user has secured their GitHub account (password, 2FA, tokens, deploy keys) and says yes explicitly. Tell them to rotate secrets (Supabase keys) if anything built from the bad commit.

## 4. Stack / how things work
- Next.js 16 (App Router, `cacheComponents`, Turbopack), React 19. Read `node_modules/next/dist/docs/` before using Next APIs (AGENTS.md).
- Supabase project `gurpmbtkyquwcqimwxfr`. Admin = `app_metadata.role === "admin"`. There is **one role only** (no owner/staff split).
- DB logic lives in security-definer functions that call `public.require_admin()`; migrations in `supabase/migrations/`.
- Shop day = Asia/Karachi (`shop_day()`, `day_start()`).
- Every stock change writes `stock_moves` (trigger `log_stock_move`, reason via `set_config('app.stock_reason')`, unit cost snapshot).
- Shop pages use `"use cache"` + `cacheTag("products")`; admin saves call `refreshShop()`. A DB change made by SQL only shows in the shop after an admin saves a product or the dev server restarts.
- Claude cannot log into admin. Testing trick: temporary ungated pages under `src/app/admin/zz-*` with mocked fetch, and SQL tests inside `DO` blocks that end with `raise exception 'ROLLBACK-REPORT'` after `set_config('request.jwt.claims', '{"app_metadata":{"role":"admin"}}', true)`. Delete temp pages afterwards.
- Dev server runs in the user's own terminal (`npm run dev`); if pages look stale, ask them to restart it.

## 5. The client's Excel (`C:\Users\gz275\Downloads\Proto Type Excel For Wasay.xlsx`)
Sheet "Daily CLosing " (one month):
- Three sale lists: Hardware (devices + disposables), Bottles, Coils. Columns Date, Sale, Purchase Cost, Selling Cost, Profit = Selling − Purchase.
- Hardware row "For Cash Adjustment": selling = refill receipts (L20:L54 + N20:N54); cost = Shipping + CMC Tax + Elite Tax (Q9:Q11). So **those three taxes are purchase cost, not Shop Expense**.
- Total Sales M2, Total Profit N2. Rent 15000, Electric 10000, Pay 5000 fixed (P2:R2). Charity S2 = 1.5% × Total Profit.
- Net Profit O3 = N2 − Rent − Electric − Pay − Shop Expense (L10) − Charity. (The sheet points at the empty S3 – the user confirmed charity **is** deducted. Charity above 1.5% is on hold, wait for instructions.)
- Direct expenses (Food, Tea, ptcl, Tissue, Freshner, Key, Exp, Ship) → Shop Expense L10.
- Old Amount L6 = last month's Amount For Restock (carried forward automatically).
- Amount For Restock M7 = Sales − Profit + Old Amount − Paid for Restock (L14) − Personal Investment Return back (L15).
- Money check Diff M10 = Sales − (Paid for Restock + Investment Return + Cash + Bank − Old Amount + Rent **paid** + Electric **paid** + Shop Expense) + Personal Investment − Withdrawal. Pay and Charity are not in it.
- Withdrawal: from inventory money → recorded as "Personal Investment – Return back" (L15); from profit → added to Shop Expense.
- Cash Out / Crto Shop / From Faheem = notes only, in no total.
Sheet "Inventory": Brand - Model, Qty, Rate (cost), Total, Price. Match check: Stock at cost + Fixed assets (340,000 in the client's separate Asset List file) + Amount in Hand (= Amount For Restock) vs a typed Match Amount.

## 6. Decisions the user made (2026-11-07)
- Counter pay methods: Cash, Bank, Wallet. Each flavor + mg + size is its own product. Refill bottle cost hits the month it is opened. Expenses are entered at the counter.
- **Counter price changes:** staff never change a product's price (admin product form only). At the till staff type **"Received"** = what the shop kept (after change, any pay method). Below the bill = **Discount**, above = **Extra charged**. Both recorded separately and reported per month. Online orders never get either. Below-cost sale = warning only. Receipt shows "You saved Rs X" for a discount, only the final price for extra.
- **Sale tag:** admin can put a product on sale with a percent off; shop shows the tag and crossed-out price, counter uses the sale price.
- **Fixed assets** (furniture, panaflex…) keep their entered value, no depreciation.
- **Closing** a day or month keeps it editable (fixes flow into later months). A separate **Lock** makes it read-only forever (no unlock).
- Anyone with admin login can close/lock.
- Dropped Claude's own suggestions (separate "sale markdowns" line, editable rent amounts, etc.).
- The counter's opening cash / drawer count is not in the Excel; user has not said to remove it.

## 7. Built so far
See section 8 for the newest work. Commits: 805b507 (Excel import, product_costs, stock_moves), 9a72a84 (counter DB), 09ed65d (restock/write-off/history/expenses), 7cfa595 (phone tweaks), 824c4c0 (local only: shop dropdown animation, button bloom, coil finder, coil fit rules). A large set of later work is **uncommitted** (admin pagination, cart bump, delivery bar, skeletons, order celebration, privacy/shipping/faq/404 pages, sitemap/robots/OG image, dashboard stats + chart, undo delete, counter dark mode/fullscreen/compact tiles/print receipt).

## 8. Newest work and where to test it (2026-11-07, uncommitted)
Migration `supabase/migrations/20261107220000_discounts_locks_month_closing.sql` (applied to the live DB). Tested with a rolled-back SQL run as admin: discount, extra, below-cost check, close + re-close, lock (day and month refuse changes after), assets, match. Type-check, lint and `next build` pass. **Not yet clicked through in a real admin login.**

| What | Where to test | Files |
|---|---|---|
| Received box: discount / extra charged recorded automatically | `/admin/counter` → Sell → add items → "Received" box under the payment buttons | `counter/_sections/Received.tsx`, `useCounter.ts`, `counterApi.ts` (old `CashGiven.tsx` removed) |
| Below-cost warning (warn only; press Complete again to sell) | same, type a very low Received | DB `counter_below_cost` |
| Receipt "Discount" + "You saved" (extra is not shown; lines scaled to what was paid) | receipt after a discounted sale; also Print | `counter/_sections/ReceiptDialog.tsx`, `counter.css` |
| Day: close again after fixes, "Lock today" (forever) | `/admin/counter` → Closing tab | `ClosingPanel.tsx`, `ExpensesCard.tsx`, DB `open_day`, `counter_lock_day` |
| Sale tag: "On sale" + percent off (main price only, option prices unchanged) | `/admin/dashboard/products` → edit a product; shop card + product page show "20% off" and the crossed-out price; counter uses the sale price | `product-form/ProductForm.tsx`, `saveProduct.ts`, `lib/products.ts` (`compare_price`, `saleTag`), `ProductCard.tsx`, `ProductGallery.tsx`, `DetailInfo.tsx`, `globals.css` |
| Monthly closing (sheet layout, net profit, Old Amount carry-forward, money check Diff, Match check, discounts/extra report, close/close again/lock) | `/admin/dashboard/closing` (new "Closing" menu item) | `dashboard/closing/ClosingView.tsx`, `closingApi.ts`, DB `month_figures`/`month_report`/`month_save`/`month_close` |
| Fixed assets list | same page, "Fixed assets" card | `dashboard/closing/AssetsCard.tsx`, table `fixed_assets` |

How the month figures are worked out (from the sheet, plus the user's answers):
- Counter sale lines split into Hardware (device + disposable), Bottles, Coils. A discounted/extra sale's lines are scaled to what was actually received.
- "For Cash Adjustment" (part of Hardware): refills in; Shipping + CMC Tax + Elite Tax expenses and the cost of refill bottles opened that month out.
- Shop Expense = other counter expenses + stock written off (at cost) + "taken out of profit".
- Charity = 1.5% of total profit, deducted. Rent 15000 / Electric 10000 / Pay 5000 fixed in the DB function.
- "Paid for restock" is taken automatically from Restock records (quantity × cost). **Assumption – confirm with the user.**
- Old Amount: typed only for the first month; later months use last month's Amount For Restock.
- Stock in the match check is the stock value right now (a locked month keeps its saved value).
- Online orders are shown but **not** included in the month totals (sheet has no online sales) – **ask the user**.

### 8a. Phone layout + Contact → Messages (2026-11-07, uncommitted)
- Counter phone layout was broken by my own later CSS overriding the phone rules (sale panel overlapped the items); fixed at the end of `counter/counter.css`, plus a sticky "Current sale · N items · Rs X" bar on phones (`.ct-jump`). Closing cards no longer overflow.
- Admin tables (`ProductsTable`, `OrdersTable`, import preview, closing discount list) become cards on phones via `.admin-table.is-cards` + `data-label`/`data-wide` on cells (end of `admin/admin.css`). Overview no longer scrolls sideways.
- Checked at 375px with a temporary fake-data page (deleted). Not checked on a real phone or with real admin data.
- **Contact form now saves messages.** Migration `20261107240000_contact_messages.sql` (applied): table `contact_messages` (admins only), public function `send_contact_message` (checks input, max 40 per hour, ignores an identical repeat within 10 minutes; the form also has a hidden spam box). Admin → Messages (`dashboard/messages/MessagesView.tsx`) lists them newest first, 10 per page, unread marked, opening marks read, Reply by email, Delete. No email/WhatsApp notification and no unread count in the menu yet.

## 8b. Questions to ask the user next
1. Should "Paid for restock" come automatically from Restock records (as built), or be typed?
2. Should online orders count in the monthly sales/profit? (Order lines don't store cost yet.)
3. Keep the counter's opening cash / drawer count? (not in the Excel)
4. Charity above 1.5%: waiting for instructions.

## 9. Still open
- Extra charity above 1.5%: on hold.
- Coil fits missing for: Pava Horiz Stick, Pava Ultra Koko, Smoke 40 Kit, Smoke 50 Kit, Voopoo Vthru.
- Commit the work when the user asks; push only after section 3 is cleared.
