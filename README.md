# Freebee4me — TypeScript dashboard demo

## Start

Install Node.js 22 LTS or newer. Open this extracted folder in VS Code:

```bash
npm install
npm run dev
```

Use the address printed in the terminal. `npm run build` checks TypeScript and builds the app.

## Try the dashboards

- User: open `/login`, enter any valid email and a non-empty password.
- Admin: open `/admin/login`, enter `admin@example.com` and any non-empty password.
- Master admin: open `/admin/login`, enter `master@example.com` and any non-empty password.
- Public signup: `/signup`. It validates fields but does not create an account yet.

The emails above are preview selectors, not real credentials. There is no authentication. Never deploy this demo as a protected admin application.

## User actions

Search available items by title/category; request a neighbour's item; post a sample item; mark your item donated; remove your listing; accept/decline an incoming request; cancel an outgoing request; change your displayed profile name. Incoming/outgoing requests are clearly labelled. Sample ownership is fixed to Demo User.

## Admin actions

View user/item/report counts, remove sample listings, view users, remove regular sample users, and resolve reports. Only the master admin preview can appoint admins, remove admin access, or remove sample admin accounts. The master admin account itself is protected.

## Storage and limitations

All actions update React state only. Signing out or reloading resets the data. Sessions do not share changes. No emails are sent, no real accounts are changed, and no passwords are stored. Profile editing changes the displayed name only; email is read-only. Accepting a request updates its status; mark the listing donated separately after pickup.

The next backend step must replace the demo email checks with verified sessions, server-side input validation, password hashing and role enforcement. Public signup must create only regular users. Seed the first master admin through setup; protect appointment endpoints so only the master admin can call them. Protect listing actions using stored ownership.

Production hosting must serve index.html for frontend routes, including `/admin/login`.

## Files

- `src/App.tsx`: login/signup, sample session and page navigation.
- `src/Dashboard.tsx`: user/admin screens, sample data and commented action functions.
- `src/styles.css`: mobile-first layout with simple class names.
- `src/main.tsx`: React entry point.

## Verification

The strict TypeScript check passed. A production Vite build and browser interaction check were unavailable in the creation environment.

This is an original starter design, not a verified copy of the Figma screens.
# freebee4me.github.io
