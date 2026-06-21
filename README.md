# Voyager — AI Travel Planner

A multi-user web app that generates a complete, editable, AI-powered travel itinerary —
day-by-day activities, a realistic budget breakdown, hotel suggestions, a weather-aware
packing checklist, and a live "trip readiness" score — built as a Round 1 full-stack
engineering assessment.

> **Live demo:** `<add your deployed frontend URL here>`
> **API:** `<add your deployed backend URL here>`
> **Walkthrough video:** `<add your video link here>`

---

## 1. Project overview

Users register, log in, and land on a personal dashboard. They fill in a short form
(destination, number of days, budget tier, interests, optional travel month), and an
LLM agent generates a structured itinerary, a budget estimate, three hotel options at
different price points, and a packing list. Every trip is editable afterward: activities
can be added or removed, and any single day can be handed back to the AI with a free-text
instruction ("more outdoor activities", "less walking", "swap shopping for a museum") to
be regenerated in place. Every activity and hotel links out to Google Maps so a traveler
can preview the actual place before committing to a plan. All data is strictly isolated
per user at the database query level — see
[Authentication & authorization](#5-authentication--authorization).

## 2. Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS | Matches the brief's preferred stack; App Router gives clean route-based code splitting for `/login`, `/dashboard`, `/dashboard/trip/[id]`. |
| Backend | Node.js + Express | Matches the brief; minimal, explicit, easy to reason about for an assessment of this size. |
| Database | MongoDB (Mongoose ODM) | Matches the brief; itineraries are naturally nested/variable-shape documents (days → activities), which maps far better onto MongoDB's document model than a relational schema. |
| Auth | JWT + bcryptjs | Stateless auth that scales horizontally without a session store; bcrypt for one-way password hashing. |
| AI agent | Google Gemini (`gemini-2.5-flash`) via direct REST call | Fast, cheap, and supports a strict `responseMimeType: application/json` mode, which removes a whole class of "the model wrapped JSON in markdown" parsing bugs. |

No framework substitutions were made — the stack matches the brief as given. All
estimated costs throughout the app (itinerary, budget breakdown, hotels) are in **USD**,
regardless of destination, for consistency across international trips.

## 3. Local setup

### Prerequisites
- Node.js 18+ and npm
- A MongoDB connection string (a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster works)
- *(Optional but recommended)* a free [Gemini API key](https://aistudio.google.com/app/apikey) — see note below if you skip this

### Backend
```bash
cd backend
cp .env.example .env
# edit .env: set MONGO_URI, JWT_SECRET, GEMINI_API_KEY
npm install
npm run dev        # starts on http://localhost:5000
```

### Frontend
```bash
cd frontend
cp .env.example .env.local
# edit .env.local if your backend isn't on localhost:5000
npm install
npm run dev         # starts on http://localhost:3000
```

Open `http://localhost:3000`, register an account, and create your first trip.

> **Running without a Gemini key:** if `GEMINI_API_KEY` is left unset, the backend
> automatically falls back to a deterministic, offline itinerary generator
> (`backend/utils/aiAgent.js`) so the whole app — auth, CRUD, editing, the packing
> list — is still fully demoable with zero external dependencies. This was a deliberate
> engineering choice so the project never breaks in front of a reviewer because of a
> missing/rate-limited API key.

### Deployed setup
The same two services are deployed independently:
- **Backend** → Render/Railway (Node web service), with `MONGO_URI`, `JWT_SECRET`,
  `GEMINI_API_KEY`, and `CLIENT_ORIGIN` (the frontend's deployed URL, for CORS) set as
  environment variables in the provider dashboard — never committed to the repo.
- **Frontend** → Vercel, with `NEXT_PUBLIC_API_URL` pointing at the deployed backend URL.

## 4. High-level architecture

```
Next.js Client (App Router)
  ├─ AuthContext: holds JWT + user in localStorage, exposes login/register/logout
  ├─ api.ts: single fetch wrapper that injects "Authorization: Bearer <token>"
  └─ Pages: / , /login , /register , /dashboard , /dashboard/new-trip ,
            /dashboard/trip/[id]
        │
        │  REST (JSON), JWT in Authorization header
        ▼
Express API
  ├─ /api/auth   → register, login, me
  ├─ /api/trips  → CRUD + day-regeneration, ALL routes behind requireAuth middleware
  ├─ middleware/auth.js     → verifies JWT, attaches req.user.id
  ├─ middleware/errorHandler.js → one consistent error shape for the whole API
  └─ utils/aiAgent.js       → prompt construction, Gemini call, retry/backoff, offline fallback
        │
        ▼
MongoDB (Mongoose)
  ├─ User  { name, email, password(hashed) }
  └─ Trip  { userId, destination, itinerary[], hotels[], estimatedBudget, packingList[] }
```

Backend code is organized by responsibility (`routes` → `controllers` → `models`,
with `middleware` and `utils` cutting across), which keeps each file small and makes
it obvious where to add the next feature.

## 5. Authentication & authorization

- **Passwords** are hashed with `bcryptjs` (10 salt rounds) in a Mongoose `pre('save')`
  hook on the `User` model — plaintext passwords are never stored, and the field has
  `select: false` so it's never accidentally returned by a query.
- **Sessions** are stateless JWTs, signed with `JWT_SECRET` and sent as
  `Authorization: Bearer <token>`. The token payload only carries `{ id, email }`.
- **Authorization / data isolation**: every `/api/trips/*` route runs through a
  `requireAuth` middleware that decodes the JWT and attaches `req.user.id`. Every
  single database query in `tripController.js` — get, update, delete, regenerate —
  filters with `{ _id: req.params.id, userId: req.user.id }`. This means even if
  User B guesses User A's trip `_id`, the query simply returns no document and the
  API responds `404`, not `403` — we don't even leak that the trip exists.
- This was verified manually: register two accounts, create a trip on Account A, copy
  its `_id`, then try to `GET`/`PUT`/`DELETE` it while authenticated as Account B → `404`.

## 6. AI agent design

All AI logic is isolated in `backend/utils/aiAgent.js` so controllers stay free of
provider-specific code:

- **Strict JSON contract.** The prompt requires the model to return *only* a JSON
  object matching an exact shape (itinerary days, hotels, budget, packing list), using
  Gemini's `responseMimeType: "application/json"` config — this avoids the classic
  failure mode of an LLM wrapping its answer in prose or markdown fences.
- **Two prompts, one shared contract:** `buildItineraryPrompt` for full-trip generation
  and `buildRegenerateDayPrompt` for single-day regeneration, which sends the *existing*
  day plus the user's free-text instruction back to the model and asks for just that
  one day's replacement — keeping the rest of the trip untouched.
- **Resilience:** `withRetry` retries failed/rate-limited calls with exponential
  backoff (1s → 2s → 4s → 8s → 16s) before surfacing a clean error to the user.
- **Offline fallback:** if no API key is configured, a deterministic mock generator
  produces a structurally identical response, so the rest of the app (and the
  reviewer's first run) never breaks on a missing key.
- **Defensive output normalization.** LLMs don't always follow exact enum casing or
  values from the prompt — in testing, Gemini occasionally returned packing categories
  like `"Health"` or `"Personal"` that aren't in the app's defined set
  (`Documents` / `Clothing` / `Gear` / `Other`), which made the initial naive
  implementation crash on save. `tripController.js` now coerces the AI's raw JSON
  (`normalizeDay`, `normalizePackingList`) into known-valid values before it ever
  reaches MongoDB, on both trip creation and day regeneration. This is treated as a
  defensive boundary, not an edge case: never trust an LLM's output to satisfy your
  schema just because you asked it to.

## 7. Creative features

This project includes two creative additions beyond the core spec, chosen because they
reuse data the app already has rather than bolting on unrelated screens.

### 7.1 AI Weather-Aware Packing Assistant

**The problem:** travelers regularly either over-pack or forget destination-specific
essentials, because a generic "packing checklist" template doesn't know it's planning
a beach week vs. a hiking trip vs. a museum-heavy city break in winter.

**The solution:** the same generation call that builds the itinerary is prompted to
cross-reference the destination, the travel month, and the *actual planned activities*
to produce a categorized packing list (Documents / Clothing / Gear / Other) — for
example, an itinerary with a hiking day gets hiking boots and a daypack; a winter
itinerary gets a heavier jacket. Each item is an interactive, checkable row
(`PackingList.tsx`) that persists its checked state to MongoDB via the same generic
`PUT /api/trips/:id` endpoint used for itinerary edits, so progress is saved across
sessions.

### 7.2 Trip Readiness Score

**The problem:** an itinerary and a packing list are two separate signals — there was
no single view of "am I actually ready for this trip?"

**The solution:** `TripReadiness.tsx` computes a derived 0–100% score entirely
client-side from data the app already has — no extra AI call, no backend change:
60% weight on packing-list completion, 40% weight on how many itinerary days have at
least two planned activities. It's shown as an animated circular gauge with a message
that changes as the score climbs ("Just getting started" → "Ready to fly!"). This was
deliberately built as a *derived* metric rather than another Gemini request, to show
getting more value out of existing data instead of reaching for AI for everything.

### 7.3 Google Maps location links (lightweight, no API key)

Every activity and every recommended hotel has a small pin icon that opens that exact
place in Google Maps (`https://www.google.com/maps/search/?api=1&query=...`) in a new
tab, letting a traveler preview the surroundings, check street view, or get directions
before committing to a plan. This was deliberately scoped to **not** include real
distance/travel-time calculations between stops, which would require Google's
Distance Matrix or Directions API (a separate, metered/paid key) — see
[Known limitations](#9-known-limitations).

## 8. Key design decisions & trade-offs

- **One generic `PUT /api/trips/:id`** (rather than separate endpoints per field) for
  itinerary edits and packing toggles. *Trade-off:* less explicit than dedicated
  REST sub-resources, but it kept the surface area small for the assessment's scope
  and the controller still whitelists exactly which fields can be touched.
- **JWT in `localStorage`** rather than an httpOnly cookie. *Trade-off:* simpler to
  implement and works cleanly across separately-deployed frontend/backend origins
  without cookie/SameSite configuration, at the cost of (mitigated, not eliminated)
  XSS-token-theft exposure that a production app would close with httpOnly cookies +
  CSRF protection.
- **Mongoose subdocuments for itinerary/hotels/packingList** rather than separate
  collections with foreign keys. A trip is always read and written as a whole, so
  embedding avoids needless joins/population calls.
- **Offline AI fallback** (see above) — a deliberate "fail open to a demo, not to a
  crash" choice for an assessment context.
- **Defensive normalization over blind trust** of LLM output (see §6) — schema
  validation failures from an upstream AI call are treated as an expected class of
  bug to design around, not a rare exception.
- **Google Maps via plain search URL, not the Places/Distance Matrix API.** A
  conscious scope decision: the free, key-less search-URL approach delivers most of
  the user value (seeing the actual place) at zero cost and zero added attack
  surface; real distance data was judged not worth a second paid API integration
  for this assessment's scope.

## 9. Known limitations

- No password-reset / email-verification flow (out of scope for the assessment).
- The AI agent is not given live, real-time pricing data — budget and hotel figures
  are realistic estimates from the model, not live quotes.
- Costs are estimated in USD only; no live currency conversion.
- No pagination on the trips list (fine at assessment scale; would add `limit`/`skip`
  or cursor pagination before production use with many trips per user).
- Day regeneration replaces a whole day rather than supporting more granular,
  single-activity AI edits.
- Map links open Google Maps via a text search (place name + destination), not a
  precise geocoded pin — accurate for almost all named landmarks/hotels, but not
  guaranteed for very generic activity titles. Real distances/travel times between
  stops are not calculated; that would require Google's Distance Matrix or Directions
  API (a separate paid/metered key), which was scoped out of this assessment.

## 10. Repository structure

```
ai-travel-planner/
├── backend/
│   ├── config/db.js
│   ├── middleware/{auth.js, errorHandler.js}
│   ├── models/{User.js, Trip.js}
│   ├── controllers/{authController.js, tripController.js}
│   ├── routes/{authRoutes.js, tripRoutes.js}
│   ├── utils/{asyncHandler.js, aiAgent.js}
│   ├── server.js
│   └── .env.example
└── frontend/
    └── src/
        ├── app/{page.tsx, login/, register/, dashboard/}
        ├── components/{Navbar, TripCard, ItineraryDay, PackingList,
        │                TripReadiness, FlightPath}.tsx
        ├── context/AuthContext.tsx
        ├── utils/api.ts
        └── types/index.ts
```
