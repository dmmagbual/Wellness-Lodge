# Content Checklist Status

**Source:** `Final Client Submission Package/03 - Client information and content checklist.docx`

**Status as of this build: the checklist is an unfilled template.** None of its 13 sections (business identity, brand, social accounts, rooms, rates, reservation rules, banking, guest communications, website content, front desk operations, technical access, administration controls, approval record) have been completed by Wellness Lodge management. Every checkbox is blank and every "Notes" line is empty in the copy supplied.

Because none of that information exists yet, **everything a real hotel would normally supply is placeholder content in this build** — room names/photos/rates, car rental fleet, function hall packages, restaurant menu, past events, bank transfer details, contact info, policies, staff names. It is all clearly sample data seeded by `firebase/seed/seed.js`, not real Wellness Lodge information.

## What must come back from the lodge before this can go live

In priority order — the system cannot safely take a real payment or a real reservation without these:

1. **Section 5 (Rates and charges) + Section 4 (Property and accommodation)** — actual room categories, room counts, nightly rates, extra-adult/child pricing, min-stay rules, and whether GST/service charges are included. Drives `roomCategories` and `ratePeriods`.
2. **Section 7 (Payment and banking)** — the real bank account name/number/branch for the bank-transfer instructions guests see, who verifies receipts, and the deposit percentage/balance due date. Drives `settings/public` (`bankName`, `bankAccountName`, `bankAccountNumber`, `bankBranch`, `depositPercent`).
3. **Section 6 (Reservation rules)** — confirmation that the pay-at-desk hold is 12 hours and the bank-transfer receipt deadline is 48 hours (this build assumes both, per the architecture doc, but the checklist leaves both as open questions to confirm).
4. **Section 1 (Business identity and contacts)** — legal name, address, phone, reservations email — needed everywhere on the public site's Contact/footer/Policies pages.
5. **Section 9 (Website content)** — approved page text, real photography, car rental fleet and terms, function hall packages, restaurant menu, past events, and legal Privacy/Terms/Cancellation/Refund policy text.
6. **Section 10 (Front desk operations)** — real staff names/roles/emails to replace the three demo accounts (see `DEMO_ACCOUNTS.md`).
7. **Section 11/12 (Technical access & admin controls)** — who owns the production Firebase/domain/GitHub accounts, and who is authorized to edit rates vs. approve them, before `createStaffUser` is used to provision real logins with real roles.

## Recommendation

Don't wait on the whole checklist before showing this to the client — it's built precisely so it can demo convincingly with placeholders today and swap to real content section-by-section as management completes each part. Treat this file as the running tracker: update it as sections of the checklist come back completed.
