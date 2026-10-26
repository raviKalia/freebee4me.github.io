# Freebee4me

Freebee4me is a community sharing application built as a web development capstone. It helps people give useful items a second home, find free items nearby, and reduce waste. Items are offered at no cost; the application does not process payments or provide delivery.

## How the app works

1. A visitor browses available items and searches by title, description, category, city or postal prefix.
2. A registered user publishes a listing with item details, pickup area and up to five photos.
3. Another signed-in user sends a request. Users cannot request their own listing or create duplicate requests for the same item.
4. The donor reviews the request and accepts or rejects it. The requester can cancel a pending request.
5. Acceptance opens a private conversation so both participants can arrange pickup. Private profile addresses are not included in public listing information.
6. The donor marks the exchange completed. Chat is available only while the request is accepted.

## Accounts and permissions

| Account | Available actions |
| --- | --- |
| Guest | Browse listings, search and filter, read About/Help, and submit a contact message. |
| User | Guest features, profile and photo editing, listing creation and management, requests, accepted-request chat, and in-app alerts. |
| Admin | Review listings and requests, moderate regular accounts, reply to support messages, and edit their admin profile. |
| Master Admin | Admin features plus appointing, revoking and moderating other administrators. |

Administrator accounts use a separate dashboard and cannot donate or request items. Roles are read from Firebase Authentication custom claims. Privileged account actions run through Cloud Functions. Master Admin accounts and the administrator's own account are protected from dashboard moderation. Firestore and Storage rules must be deployed to enforce data access.

## Main features

- **Listings:** upload JPG, PNG or WebP images, create listings, and manage personal donations. Each photo is limited to 5 MB.
- **Search:** keyword, category, city and postal-prefix filtering.
- **Requests:** track sent and received requests and manage exchange status.
- **Chat:** participants can communicate after acceptance; completion closes chat.
- **Profiles:** users save personal details and a profile picture. Admin profiles separately store display name, department, biography and avatar.
- **Support:** contact messages appear in the admin dashboard. Replies are stored under the original ticket; signed-in senders can read them on Contact.
- **Notifications:** Firestore listeners display alerts. Cloud Functions create notifications for support messages, support replies, new requests and request status changes.
- **Accessibility:** font-size controls, high contrast, reduced motion, link underlining, keyboard focus styling and a skip link. Preferences are saved locally.
- **Responsive interface:** layouts adapt to smaller screens and navigation collapses on mobile.

## Project structure

| Path | Purpose |
| --- | --- |
| `client/src/App.tsx` | Authentication state, role handling and page navigation. |
| `client/src/components/` | Shared header, footer, hero, filters, support and accessibility controls. |
| `client/src/features/` | Authentication, item management, request/chat and administration screens. |
| `client/src/pages/` | Browse, profile, About, Help and Contact pages. |
| `client/src/context/` and `hooks/` | Shared accessibility settings and access helpers. |
| `client/src/services/` | Shared service operations used by the current application. |
| `client/src/types/` and `data/` | Type definitions and static content. |
| `client/src/styles/` | Styles organised by screen or feature. |
| `client/public/` | Logos, icons and other public assets. |
| `functions/index.js` | Privileged account/listing actions and notification triggers. |
| `firestore.rules` and `storage.rules` | Database and image access rules. |
| `firebase-admin-setup/` | Local utility for assigning the initial Master Admin claim. |
| `scripts/format.mjs` | Consistent formatting with tabs and compact JSX opening tags. |

The old Express reference server, unused demo components, duplicate setup documents, installed dependencies and generated build output are omitted from this package. This README is the single project guide.

## Technology

React, TypeScript and Vite provide the frontend. Firebase Authentication manages sign-in, Firestore stores application data, Firebase Storage holds images, and Firebase Cloud Functions handle privileged operations and notification creation. The frontend includes Vercel configuration.

## Run locally

Use Node.js 22 for compatibility with the Cloud Functions runtime.

From the project folder:

```sh
npm ci
```

Copy `client/.env.example` to `client/.env.local` and enter your Firebase Web app configuration:

```dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

In the Firebase console, enable Email/Password Authentication and create Firestore and Storage. Add the local and deployed frontend domains to Authentication's authorised domains as needed.

```sh
npm run dev
```

Open the address shown by Vite. Run these commands from the project folder when required:

```sh
npm run build
npm run preview
npm run format
```

The build checks TypeScript and produces `client/dist`. Formatting preserves the existing module paths and uses tabs, single quotes, expanded CSS rules and compact JSX tags.

## Deploy Firebase services

Install the Firebase CLI if it is not already available, then sign in:

```sh
npm install -g firebase-tools
firebase login
```

Install Cloud Function dependencies and deploy from the application root:

```sh
npm ci --prefix functions
firebase deploy --only firestore:rules,storage,functions --project YOUR_FIREBASE_PROJECT_ID
```

Replace `YOUR_FIREBASE_PROJECT_ID` with the same project used in `client/.env.local`. The frontend callable functions target `us-central1`; keep the deployed function region aligned. Cloud Functions deployment requires an appropriately configured billing plan and deployment permissions.

### Initial Master Admin

Create the intended account in Firebase Authentication first. In `firebase-admin-setup/makeAdmin.cjs`, set the email to that account. Provide your own private service-account file locally at `firebase-admin-setup/serviceAccountKey.json`, then run:

```sh
npm ci --prefix firebase-admin-setup
node firebase-admin-setup/makeAdmin.cjs
```

Sign out and back in to refresh claims. Later administrator appointments can be made from the Master Admin dashboard. The credential is deliberately excluded from this package; never commit it or put it in `client/public`.

### Frontend hosting

For Vercel, use this project folder as the root, `npm run build` as the build command and `client/dist` as the output directory. Add all six Firebase environment variables to the hosting configuration. Deploy Firebase rules and functions separately.

## Stored data

- `items`: published listings and availability.
- `requests`: donor/requester relationships and request status.
- `requests/{requestId}/messages`: private exchange messages.
- `profiles`: private user profile details.
- `adminProfiles`: administrator presentation details.
- `publicUsers`: account directory information managed by trusted operations.
- `contactMessages` and nested `replies`: support tickets and responses.
- `notifications`: per-user alerts and read state.
- `adminAudit`: records of privileged administrative actions.

Photos use user-specific paths in Firebase Storage. Authentication UIDs connect accounts to their records. Client-side visibility controls complement the deployed rules and server-side permission checks.

## Current limitations

- City and postal-prefix filtering work, but the radius selector/current-location controls do not implement distance-based geographic searching.
- Notifications are in-app. This version does not send support replies by email or provide browser push notifications.
- Guest support submissions have no signed-in UID, so guests cannot receive account notifications or view a personal reply history.
- The active chat closes after completion; the current interface does not display a read-only completed conversation.
- Real sign-in, uploads, role moderation and notification delivery require a correctly configured Firebase project and deployed rules/functions. A successful local build does not verify those live services.

## Suggested walkthrough

Use two regular accounts and one administrator account. Publish an item with the first user, request it with the second, accept as donor, exchange chat messages and complete the pickup. Then submit a signed-in contact message, reply from the admin dashboard, and confirm the sender sees the reply and alert. Also check the mobile menu, profile upload and accessibility settings.
