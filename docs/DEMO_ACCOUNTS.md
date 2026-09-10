# Demo Accounts

These accounts only exist after `npm run seed` has been run against the **local Firebase emulators** (see `README.md`). They do not exist in any real/production Firebase project — nothing seeds itself there.

| Role | Email | Password | Access in the Front Desk app |
|---|---|---|---|
| Administrator | `admin@wellnesslodge.demo` | `Demo!Pass123` | Everything: queue, rooms, rates, staff accounts, audit log, settings |
| Manager | `manager@wellnesslodge.demo` | `Demo!Pass123` | Queue, rooms, rates, audit log (no staff account management) |
| Front Desk | `frontdesk@wellnesslodge.demo` | `Demo!Pass123` | Queue only — accept/confirm/reject payments, check guests in/out |

## Before going live

1. Sign in once as the Administrator above and use **Staff → Create staff user** to create the lodge's real staff logins with real names, emails and temporary passwords.
2. Deactivate or simply stop distributing these demo credentials — they are a fixed, published password and must never be used against the production project.
3. The very first real administrator on a fresh production project is created with `bootstrapFirstAdmin` (a one-time setup-code-gated callable — see `README.md` → "Creating the first real admin"), not by seeding.
