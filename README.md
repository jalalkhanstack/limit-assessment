# Submission Tracker

A full-stack workspace for operations managers to review broker-submitted opportunities. Filter, browse, and inspect submissions — built with Django REST Framework on the backend and Next.js + Material UI on the frontend.

---

## Approach

- **Backend:** Domain entities stay relational in Django; the list endpoint uses a lean serializer plus queryset annotations (`Count`, `Subquery`) for document/note totals and the latest note preview so the list view avoids N+1 queries. Detail uses `prefetch_related` with explicit ordering for contacts, documents, and notes. Filtering is centralized in a `django-filter` `FilterSet` with **camelCase query parameter names** so they align with the JSON API (DRF’s camel-case package rewrites response keys, not query strings).
- **Frontend:** The submissions workspace is two client routes: a filterable, paginated table and a detail layout for overview, contacts, documents, and notes. **TanStack Query** handles fetching, caching, and stable list behavior during pagination (`keepPreviousData`). Filter values are sent to the API as **HTTP query parameters** via Axios; the list UI prioritizes the most common ops filters (status, broker, company name with debounced search).

---

## Tradeoffs

| Choice | Rationale |
|--------|-----------|
| **SQLite** | Fast local setup for reviewers; swap the `DATABASES` setting for Postgres when hardening for production. |
| **Filter state in React, not the URL** | Keeps the first version simple and avoids Next.js search-param edge cases; every list request still uses real query params against the API. Shareable/bookmarked list URLs would be a natural next step (`useSearchParams` + `router.replace`). |
| **Global DRF pagination** | `GET /brokers/` is paginated like other list endpoints (seed data is small, so everything is usually on page 1). The frontend accepts either a raw array or `{ count, results }` for the broker dropdown. |
| **List UI vs full API** | The API supports more filters (priority, date range, has documents/notes, sort order) than the table exposes; the shared fetch helper already accepts those params for API clients or a future filter drawer. |
| **Targeted tests, not full E2E** | Backend: `APITestCase` against list/detail and main filters. Frontend: Vitest for `buildSubmissionListParams` and presentational chips—fast feedback without running Playwright in CI yet. |

---

## Demo & stretch goals

**Screen capture (for submission):** With backend on port 8000 and frontend on 3000, record a short walkthrough (under 2 minutes): open `/submissions`, apply filters and pagination, open a row to show detail (contacts, documents, notes) and the back link.

**Stretch / above-minimum (implemented):**

- Rich list filtering and **ordering** on `GET /submissions/` (priority, created date range, has documents/notes, `ordering`).
- List payload optimizations (aggregates + latest note without extra round-trips).
- UX: debounced company search, subdued loading during refetch, empty and error states tuned for a missing API or seed data.
- **Automated tests** (see below): API regression coverage and frontend unit/component checks.

**Not implemented here:** Authentication, deployment, and browser E2E (e.g. Playwright).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, Django 5.2, Django REST Framework 3.17 |
| Filtering | django-filter 25, DRF OrderingFilter |
| CORS | django-cors-headers |
| API format | djangorestframework-camel-case (snake_case → camelCase) |
| Database | SQLite (development) |
| Frontend | Next.js 16, React 19, TypeScript 5 |
| UI | Material UI 7 |
| Data fetching | TanStack React Query 5, Axios |
| Styling | Tailwind CSS 4 |
| Frontend tests | Vitest 3, Testing Library, jsdom |

---

## Automated tests

**Backend** (from `backend/`, with dependencies installed):

```bash
python manage.py test submissions.tests
```

Covers: paginated list shape and camelCase fields, filters (`status`, `brokerId`, `companySearch`, `hasDocuments`, `hasNotes`), `ordering`, submission detail payload, broker list shape.

**Frontend** (from `frontend/`):

```bash
npm install
npm run test
```

Uses **Vitest** for `lib/buildSubmissionListParams.test.ts` (filter → query param mapping) and chip components. Use `npm run test:watch` during development.

---

## Prerequisites

| Tool | Minimum version | Check |
|---|---|---|
| Python | 3.11 | `python --version` |
| Node.js | 18 | `node --version` |
| npm | 9 | `npm --version` |

---

## Quick Start

You need **two terminals running simultaneously** — one for the backend, one for the frontend.

### Terminal 1 — Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up the database
python manage.py migrate

# Populate with ~25 sample submissions, contacts, documents, and notes
python manage.py seed_submissions

# Start the API server
python manage.py runserver 0.0.0.0:8000
```

The API is now available at **http://localhost:8000/api/**

### Terminal 2 — Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open **http://localhost:3000/submissions** in your browser.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://localhost:8000/api` | Base URL for all API requests |

---

## Seed Data

```bash
# First run — creates brokers, companies, team members, and ~25 submissions
python manage.py seed_submissions

# Re-run — wipes and rebuilds the entire dataset
python manage.py seed_submissions --force
```

The seed command creates:
- **5** brokerage firms
- **12** companies across various industries
- **6** internal team members
- **25** submissions with randomised status and priority
- **1–3** contacts per submission
- **1–4** documents per submission
- **1–5** notes per submission

---

## API Reference

Base URL: `http://localhost:8000/api`

### `GET /submissions/`

Returns a paginated list of submissions (10 per page).

**Supported query parameters:**

| Parameter | Type | Example | Description |
|---|---|---|---|
| `status` | string | `?status=in_review` | Filter by status (`new`, `in_review`, `closed`, `lost`) |
| `priority` | string | `?priority=high` | Filter by priority (`high`, `medium`, `low`) |
| `brokerId` | number | `?brokerId=3` | Filter by broker ID |
| `companySearch` | string | `?companySearch=acme` | Case-insensitive search on company name |
| `createdFrom` | date | `?createdFrom=2024-01-01` | Submissions created on or after this date |
| `createdTo` | date | `?createdTo=2024-12-31` | Submissions created on or before this date |
| `hasDocuments` | boolean | `?hasDocuments=true` | Only return submissions that have documents |
| `hasNotes` | boolean | `?hasNotes=false` | Only return submissions with no notes |
| `ordering` | string | `?ordering=-created_at` | Sort field (prefix `-` for descending) |
| `page` | number | `?page=2` | Page number |

**Example response:**
```json
{
  "count": 25,
  "next": "http://localhost:8000/api/submissions/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "status": "in_review",
      "priority": "high",
      "summary": "...",
      "createdAt": "2024-03-15T10:30:00Z",
      "updatedAt": "2024-03-16T09:00:00Z",
      "broker": { "id": 2, "name": "Smith & Co", "primaryContactEmail": "smith@example.com" },
      "company": { "id": 5, "legalName": "Acme Corp", "industry": "Technology", "headquartersCity": "New York" },
      "owner": { "id": 1, "fullName": "Jane Doe", "email": "jane@internal.com" },
      "documentCount": 3,
      "noteCount": 2,
      "latestNote": { "authorName": "Jane Doe", "bodyPreview": "Initial review completed...", "createdAt": "2024-03-16T09:00:00Z" }
    }
  ]
}
```

---

### `GET /submissions/<id>/`

Returns the full submission detail including all related contacts, documents, and notes.

**Example response:**
```json
{
  "id": 1,
  "status": "in_review",
  "priority": "high",
  "summary": "...",
  "createdAt": "2024-03-15T10:30:00Z",
  "updatedAt": "2024-03-16T09:00:00Z",
  "broker": { ... },
  "company": { ... },
  "owner": { ... },
  "contacts": [
    { "id": 1, "name": "John Smith", "role": "CEO", "email": "john@acme.com", "phone": "+1 555 0100" }
  ],
  "documents": [
    { "id": 1, "title": "Prospectus", "docType": "Prospectus", "uploadedAt": "2024-03-15T10:35:00Z", "fileUrl": "https://..." }
  ],
  "notes": [
    { "id": 2, "authorName": "Jane Doe", "body": "Initial review completed.", "createdAt": "2024-03-16T09:00:00Z" }
  ]
}
```

---

### `GET /brokers/`

Returns brokers for dropdowns. The project uses DRF’s default **page-number pagination** (same as submissions), so the JSON shape is typically:

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    { "id": 1, "name": "Alpha Partners", "primaryContactEmail": "contact@alpha.com" },
    { "id": 2, "name": "Smith & Co", "primaryContactEmail": null }
  ]
}
```

The frontend broker hook accepts this shape or a plain array for flexibility.

---

## Project Structure

```
limit_challenge/
├── backend/
│   ├── server/
│   │   ├── settings.py         
│   │   └── urls.py            
│   ├── submissions/
│   │   ├── filters/
│   │   │   └── submission.py 
│   │   ├── management/commands/
│   │   │   └── seed_submissions.py
│   │   ├── migrations/
│   │   ├── admin.py
│   │   ├── models.py            
│   │   ├── serializers.py       
│   │   └── views.py             
│   └── requirements.txt
│
└── frontend/
    ├── app/
    │   ├── layout.tsx           
    │   ├── providers.tsx      
    │   ├── submissions/
    │   │   ├── page.tsx        
    │   │   └── [id]/
    │   │       └── page.tsx     
    ├── components/
    │   ├── StatusChip.tsx    
    │   └── PriorityChip.tsx    
    └── lib/
        ├── api-client.ts   
        ├── buildSubmissionListParams.ts
        ├── types.ts          
        └── hooks/
            ├── useBrokerOptions.ts
            ├── useDebounce.ts
            └── useSubmissions.ts
```
