# FarmMall frontend

FarmMall's frontend is a responsive Next.js application. It consumes the FarmMall REST API.

## Features currently available

| Area | What users can do |
| --- | --- |
| Public site | View the FarmMall landing page and use public cost and harvest forecast tools |
| Accounts | Register, verify an email OTP, log in, recover/reset a password, and manage profile details and a profile photo |
| Farmer dashboard | View production summaries, upcoming work, weather, quick actions, and links to input-marketplace services |
| Farm preparation | Create pre-production plans and complete guided preparation tasks while recording dates, costs, and suppliers |
| Production cycles | Create, search, update, archive/delete, and inspect crop cycles; capture a location, coordinates, and a drawn farm boundary; manage scheduled and completed activities |
| Diagnosis and farm intelligence | Upload crop images for AI-assisted diagnosis, review analysis details/history, and submit plant, soil, and yield analyses when the corresponding backend provider is configured |
| Farm tools | Use cost, harvest, yield, income, investment, plant-AI, and soil-analysis tools |
| Analytics and reports | Compare projected and actual yield, price, cost, and revenue; save cycle reports; generate a printable farm decision report |
| Collaboration | Invite farm collaborators and manage their roles and permissions from cycle workflows |
| Events | Browse published farming events; admins can create, edit, and delete events |
| Markets | Register production cycles with the buyers marketplace, view bookings, accept/reject decisions, browse input listings, and launch marketplace SSO |
| Maps and weather | Search locations and draw boundaries with Google Maps/Terra Draw; display current conditions through a server-side OpenWeather route |

The current admin experience is limited to a static overview and working event management. It is not yet a complete administration dashboard; the missing areas are listed under [What needs improvement](#what-needs-improvement).

## Technology

- Next.js 14 App Router and React 18
- TypeScript
- Tailwind CSS and Radix UI components
- Axios for the FarmMall API
- Recharts for analytics
- Google Maps and Terra Draw for farm locations and boundaries
- Framer Motion for interface animation

## Run locally

### 1. Start the backend

Follow the backend [`README.md`](../Farm-Mall-back/README.md) and start the API on `http://localhost:3000`.

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure the frontend

```bash
cp .env.example .env.local
```

For local development:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
OPENWEATHER_API_KEY=your_openweathermap_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_browser_key
```

- `NEXT_PUBLIC_API_BASE_URL` is the backend origin or deployment base path. Do not append `/api/v1`; the API client adds it.
- `OPENWEATHER_API_KEY` remains server-side and powers `/api/weather/current`.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is exposed to the browser by design. Restrict it by domain and enable the Maps JavaScript and Places APIs.
- Weather and advanced map features will not work fully without their respective keys; the rest of the interface can still run.

### 4. Start Next.js on port 3001

```bash
npm run dev -- -p 3001
```

Open `http://localhost:3001`. Port `3001` avoids a conflict with the backend, whose default port is `3000`.

## Available commands

```bash
npm run dev              # start the Next.js development server
npm run build            # validate the production API URL and create a production build
npm start                # run the production build through server.js
npm run lint             # run the configured Next.js lint command
npm run deploy:package   # build a cPanel upload archive
```

For a production build, `NEXT_PUBLIC_API_BASE_URL` must be set to a non-localhost URL. It is embedded in the browser bundle, so changing it requires a rebuild.

## Application routes

| Route | Purpose |
| --- | --- |
| `/` | Public landing page |
| `/calculator`, `/forecast` | Public farming calculators |
| `/auth/*`, `/reset-password` | Registration, login, verification, and password recovery |
| `/dashboard` | Farmer overview |
| `/dashboard/pre-production-planning` | Preparation plans and task details |
| `/dashboard/cycles` | Production cycles, activities, harvests, and collaborators |
| `/dashboard/diagnosis` | AI-assisted crop diagnosis |
| `/dashboard/farm-tools` | Farm calculators and analysis tools |
| `/dashboard/events` | Published events |
| `/dashboard/analytics` | Cycle analytics and reports |
| `/dashboard/buyers` | Buyers marketplace status and bookings |
| `/dashboard/profile` | Farmer profile |
| `/admin`, `/admin/events` | Current admin overview and event management |

Authentication state and JWT tokens are handled by `lib/hooks/use-auth.tsx` and `lib/api/client.ts`. Protected requests are sent to `${NEXT_PUBLIC_API_BASE_URL}/api/v1`.

## Project structure

```text
app/                  Next.js routes, layouts, and server-side API routes
components/           Feature and reusable UI components
lib/api/client.ts     Typed FarmMall API client
lib/hooks/            Authentication and feature hooks
lib/types/            Frontend request/response types
lib/data/             Local reference/fallback data
public/               Static assets
styles/               Global styles
middleware.ts         Route access control
server.js             Production/cPanel Next.js entry point
```

## What needs improvement

These are ordered by product priority and include incomplete UI behavior found in the current code.

1. **Integrate the satellite monitoring system with this platform.** Add a cycle-level satellite view using saved farm boundaries, vegetation/health and moisture layers, imagery dates, trends, alerts, and links from both the dashboard and production-cycle detail page. The UI must handle farms without boundaries, cloud-obscured/missing imagery, stale data, and provider errors.
2. **Build a complete admin dashboard.** Only `/admin` and `/admin/events` exist today. The sidebar links for users, analytics, content, database, security, and settings point to pages that have not been built. Replace the static overview with real metrics and implement user/role management, farm and cycle oversight, content/events, subscriptions, marketplace operations, audit logs, service health, and configuration screens backed by protected admin APIs.
3. **Make AI history and provider states consistent.** Complete persisted diagnosis statistics/history, remove overlapping legacy diagnosis paths, and show whether a result came from Gemini, Plant.id, Hugging Face, a fallback, or an unavailable provider.
4. **Harden marketplace workflows.** Improve unavailable-service, callback-delay, duplicate-action, and expired-SSO handling; make integration status and retry actions clear to the farmer.
5. **Restore strict build quality.** `next.config.mjs` currently ignores TypeScript and ESLint failures during builds. Fix existing errors, stop suppressing them, add frontend unit/component/end-to-end tests, and run lint, type-check, tests, and production build in CI.
6. **Remove legacy and duplicate UI paths.** Consolidate the legacy `/dashboard/farm-intelligence` route and duplicate calculator/modal implementations so there is one maintained workflow per feature.

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for frontend packaging and the repository-level `../DEPLOYMENT.md` for the full frontend/backend cPanel setup. Do not commit `.env.local`, production API keys, build output, or user data.
