## Why

Flexible / hot-desking offices need a reliable way for employees to reserve a desk before arriving. Without a shared tool, people rely on ad-hoc spreadsheets or messages, which don't prevent double-bookings, don't give a real-time view of availability, and don't help facilities understand utilization. This change introduces the foundation of a desk booking tool so employees can see a floor plan, book an available desk for a specific day (or time range), and manage their own reservations, while admins can curate the desk inventory.

## What Changes

- Introduce a new application (no prior codebase) that supports:
  - Viewing desks and their availability for a selected date/range.
  - Creating, viewing, and cancelling a desk booking as an authenticated user.
  - Preventing overlapping bookings on the same desk (conflict detection).
  - Admin management of floors, desks, and desk attributes (monitor, standing, accessibility, etc.).
  - Basic user accounts with authentication and role distinction (`user`, `admin`).
- Define the initial domain model (User, Floor, Desk, Booking) and the booking lifecycle (`confirmed` → `cancelled` / `completed`).
- Establish the HTTP API surface for the above capabilities.

No breaking changes — this is the initial scaffold of the product.

## Capabilities

### New Capabilities

- `user-auth`: User registration, login, session/token handling, and role-based access (`user`, `admin`).
- `desk-inventory`: Admin-managed catalog of floors and desks, including desk attributes and active/inactive state.
- `desk-booking`: Employee-facing booking lifecycle — availability lookup, create booking, view own bookings, cancel booking, with conflict prevention on overlapping time windows for the same desk.
- `admin-console`: Admin-only views for managing the desk inventory and reviewing bookings/utilization.

### Modified Capabilities

_None — greenfield project._

## Impact

- **New codebase**: all source, configuration, and build tooling will be introduced by this change.
- **Dependencies**: a web framework, a relational datastore (for transactional booking integrity), and an auth library will be added. Exact choices to be decided in `design.md`.
- **Data**: introduces persistent tables for users, floors, desks, and bookings. No existing data to migrate.
- **APIs**: introduces the first set of public HTTP endpoints — no prior consumers to break.
- **Ops**: introduces the first deploy target; hosting and environment strategy to be settled in `design.md`.
