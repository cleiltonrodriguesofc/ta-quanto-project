# TáQuanto? 🛒

**A community-powered supermarket price comparison and sharing app.**

TáQuanto? helps people make more informed grocery-shopping decisions by turning individual price observations into shared, reusable information. Instead of relying exclusively on static catalogs or retailer promotions, shoppers can look up a product, compare prices reported at different supermarkets, and contribute a new observation when a price changes.

**The central idea is collaborative price freshness:** prices change frequently, so other shoppers should be able to confirm or update a previously reported price. The long-term goal is a living, community-maintained price network—not just a product catalog.

> **Project status — prototype / active development.** TáQuanto? is not yet a publicly validated or production-ready price-verification service. The current React Native + FastAPI implementation is being developed on the [`development` branch](https://github.com/cleiltonrodriguesofc/ta-quanto-project/tree/development). The `main` branch still contains an earlier application snapshot. This README describes the direction and implementation on `development`, distinguishing working code from planned capabilities.

## Why TáQuanto?

Grocery budgets are affected not only by the prices of individual products but also by how much time and effort consumers spend comparing stores. Price information is often fragmented, may become outdated quickly, and is not always available for the exact store where someone is shopping.

TáQuanto? explores a practical question: **can a collaborative network of shoppers reduce the effort required to compare supermarket prices and improve purchasing decisions?**

The project combines three complementary ideas:

1. **Useful information at the point of purchase.** Scan a barcode or search for a product to view price observations across supermarkets.
2. **Community contribution.** Add a missing price or confirm/update information submitted by someone else.
3. **A growing shared data set.** Repeated contributions may make product coverage and price freshness more useful over time.

The app does **not** assume that crowdsourced prices are always correct or current. Timestamps, confirmation flows and future trust/freshness rules are important parts of the proposed model.

## Main user journey

1. Select a supermarket or open the app's shopping flow.
2. Scan a product barcode or browse/search the product catalog.
3. Retrieve product details and any available community-reported supermarket prices.
4. Compare the available observations, including the store and the time of the report.
5. If a price is missing or has changed, submit a new price or use the confirm/update flow.
6. Optionally add items to a shopping basket, adjust quantities and save lists for later use.

**Important distinction:** public product databases supply **product metadata** (such as names, brands and images). They do not automatically establish the price currently charged by a particular supermarket. Store-specific prices come from app records and user contributions.

## Features and implementation status

| Area | What is available in the codebase | Status / limitations |
| --- | --- | --- |
| Barcode scanning | Camera-based scanning and a product-details flow | Implemented in the mobile prototype |
| Product lookup | Local lookup, backend product endpoint and integrations with external product-data providers | Implemented; coverage depends on provider responses |
| Price comparison | Price observations by barcode and supermarket, with minimum/average calculations on the product screen | Implemented in the prototype; depends on available contributions |
| Price registration | Manual entry of product/store prices; authenticated API for new contributions | Implemented; some legacy UI flows still use local adapters |
| Price confirmation and correction | Product-detail actions to confirm a reported price or navigate to an updated registration | UI flow present; end-to-end persistence and freshness rules are still being refined |
| Community price browsing | Search, sorting, contribution filters and timestamps | Implemented, with screens at different stages of backend integration |
| Shopping mode | Supermarket selection, basket management, quantities and totals | Implemented in the mobile prototype |
| Saved shopping lists | Backend endpoints for creating, retrieving, editing, renaming and deleting saved baskets | Implemented in the FastAPI layer; integration is being refined |
| User accounts | Registration, login, refresh tokens and logout through the FastAPI API | JWT authentication implemented; legacy Supabase code remains during migration |
| User profiles | Profile information and contribution/XP-related fields | Partially integrated |
| Location | Optional GPS-related information and supermarket location fields | Present in selected flows |
| Local/offline data | AsyncStorage repositories and remote/local fallback paths | Partial offline support; reliable deferred sync needs further validation |
| Social feed | Social UI and post components | Prototype uses mock posts; not a live social network |
| Localization | Portuguese (Brazil) and English (US) translation files | Present in the mobile app |
| Shopping routes, alerts and advanced social interactions | Planned concepts | Not production features |

The repository contains both newer Clean Architecture components and older adapters/screens. The presence of an endpoint or screen does not, by itself, guarantee that every interaction has been tested end to end.

## Technology stack

| Layer | Technologies |
| --- | --- |
| Mobile | React Native, Expo SDK 57, TypeScript, Expo Router |
| UI and device APIs | Expo Camera, Expo Location, Lucide React Native |
| Local persistence | AsyncStorage |
| API | Python, FastAPI, Pydantic, Uvicorn |
| Data access | SQLAlchemy (async), asyncpg, Alembic |
| Database | PostgreSQL (compatible with hosted providers such as Supabase) |
| Authentication | Application-managed JWT access and refresh tokens |
| API communication | Axios and HTTPX |
| Tests and tooling | Jest, React Native Testing Library, pytest, ESLint, TypeScript, Docker |

**Supabase clarification:** PostgreSQL may be hosted on Supabase, but the new FastAPI authentication flow uses its **own JWT implementation**, rather than Supabase Auth. Legacy Supabase-based code is still present while the migration continues.

### Product-information integrations

The mobile code includes connectors for **Open Food Facts**, **Open Beauty Facts**, **Cosmos**, **UPCitemdb** and **Go-UPC**. The backend also exposes a barcode lookup route with local-record and external-provider fallbacks. Availability, usage limits and API-key requirements vary by source.

External catalog data enriches product identification; user-generated observations remain the basis of supermarket-specific price comparisons.

## Architecture

The active development branch is organized as a mobile client and a separate API:

```text
ta-quanto-project/
├── mobile/
│   ├── app/                    # Expo Router screens and navigation
│   ├── src/
│   │   ├── domain/             # Entities and repository contracts
│   │   ├── application/        # Use cases
│   │   └── infrastructure/     # API, storage and external integrations
│   ├── components/             # Shared UI components
│   ├── context/                # Authentication and shopping-session state
│   └── locales/                # pt-BR and en-US translations
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── domain/         # Entities and abstractions
│   │   │   ├── application/    # Use-case organization
│   │   │   ├── infrastructure/ # Database and authentication
│   │   │   └── presentation/   # FastAPI routers
│   │   └── main.py             # API setup and health endpoints
│   ├── tests/                  # Unit and integration tests
│   └── requirements.txt
├── docker-compose.yml         # Backend service (external DB required)
└── start.sh                   # Linux local/LAN/tunnel development launcher
```

The architectural goal is to keep domain rules separate from presentation, persistence and external services. This transition is ongoing; some legacy modules have not yet been fully migrated.

### API overview

The FastAPI service currently exposes routes under `/api/v1`, including:

- `/auth` — registration, login, token refresh and logout
- `/products/{barcode}` — product lookup
- `/prices` and `/prices/barcode/{barcode}` — price registration and lookup
- `/supermarkets` — supermarket listing and registration
- `/saved-baskets` — saved shopping-list operations
- `/users/me` — authenticated user profile

The service also exposes `/health`, interactive OpenAPI docs at `/docs` and ReDoc at `/redoc`.

## Getting started

These instructions apply to the **`development` branch**. A PostgreSQL database must already be available, either locally or from an external provider.

### Requirements

- Node.js compatible with the installed Expo SDK (Node.js 20 or newer is a practical starting point; check Expo's current requirements)
- npm
- Python 3.12 (or a compatible Python version supported by the backend dependencies)
- PostgreSQL connection string
- Expo Go or an Android/iOS development environment
- Optional: Docker and Docker Compose

### 1. Clone the project

```bash
git clone https://github.com/cleiltonrodriguesofc/ta-quanto-project.git
cd ta-quanto-project
git checkout development
```

### 2. Configure and start the backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `backend/.env` with a valid `DATABASE_URL` using the `postgresql+asyncpg://` format and a strong `JWT_SECRET_KEY`. Then start the API:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Configure and start the mobile app

In a second terminal:

```bash
cd mobile
npm ci
```

Create `mobile/.env` and set the API base URL:

```dotenv
EXPO_PUBLIC_API_URL=http://YOUR_COMPUTER_LAN_IP:8000
```

For Expo Go on a physical phone, use the computer's reachable LAN IP—not `localhost`. Configure any optional external-product-provider credentials required by the integrations you want to test.

```bash
npm run dev
```

Open the Expo development session on a simulator or with Expo Go.

### Alternative: Docker backend

From the repository root, create a **root-level** `.env` file containing `DATABASE_URL` and `JWT_SECRET_KEY`, then run:

```bash
docker compose up --build backend
```

The active Compose configuration starts the **backend only**. It does not start PostgreSQL or the Expo mobile app automatically.

On Linux, `./start.sh` offers additional local-network and tunnel launch modes. It expects local prerequisites, including a configured Python environment, to be installed first.

## Testing

Mobile checks:

```bash
cd mobile
npm run ci:local
```

Backend tests:

```bash
cd backend
pytest
```

The repository includes a GitHub Actions workflow. Because the project has moved into `mobile/` and `backend/`, CI configuration and integration coverage should be checked as part of ongoing maintenance. The commands above describe how to run the available checks; they are not a claim that every test currently passes.

## Research and product validation

TáQuanto? is also an applied research project. Its motivating hypotheses should be **tested**, not presented as proven:

- How important is price when consumers choose groceries?
- How do people currently compare supermarket prices, and what effort or difficulties does that involve?
- Would accessible, recently reported prices help with a real shopping decision?
- Would consumers contribute, confirm or correct prices for the benefit of others? Under what conditions or incentives?

An initial field study and prototype evaluation are planned to investigate these questions. Research outcomes can inform data freshness, moderation, incentives, usability and the decision to expand the service.

## Roadmap

Priorities being investigated or developed include:

- **Price freshness and trust:** timestamps, confirmation/correction history, duplicate handling and mechanisms to flag stale or inconsistent reports.
- **Reliable synchronization:** clearer local/remote consistency, offline submission queues and recovery after connectivity loss.
- **Community network:** real contributions, social connections and user interaction around shared prices; the current social feed is mock-based.
- **Product coverage:** enrichment from multiple metadata sources and a practical approach for products without barcodes.
- **Shopping decisions:** better basket comparisons, savings estimates and potentially price alerts.
- **Quality and release readiness:** integration tests, security hardening, data privacy review and user research.

These items are goals, not promises of current availability.

## Contributing

Contributions, bug reports and feature proposals are welcome. Please open an issue first for significant changes, work on a focused feature branch and submit a pull request with a description of the behavior and testing performed. The active integration branch is `development`.

## Important note about price information

Prices shown by TáQuanto? are observations supplied by users or previously recorded by the system. They may be incomplete, inaccurate or out of date, and may differ at checkout. The app aims to improve access to information—not to guarantee a price or a discount.

---

**TáQuanto? — Better grocery decisions through shared, continually updated price information.**
